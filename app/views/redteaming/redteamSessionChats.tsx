'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon, IconName } from '@/app/components/IconSVG';
import { Button, ButtonType } from '@/app/components/button';
import { useEventSource } from '@/app/hooks/use-eventsource';
import { useGetAllAttackModulesQuery } from '@/app/services/attack-modules-api-service';
import { useGetPromptTemplatesQuery } from '@/app/services/prompt-template-api-service';
import {
  useSendArtPromptMutation,
  useSendPromptMutation,
  useSetAttackModuleMutation,
  useSetPromptTemplateMutation,
  useUnsetAttackModuleMutation,
  useUnsetPromptTemplateMutation,
} from '@/app/services/session-api-service';
import { AppEventTypes } from '@/app/types/enums';
import { Modal } from '@/app/views/shared-components/modal/modal';
import { PopupSurface } from '@/app/views/shared-components/popupSurface/popupSurface';
import { useAppDispatch, useAppSelector } from '@/lib/redux';
import { updateWindows } from '@/lib/redux/slices/windowsSlice';
import tailwindConfig from '@/tailwind.config';
import { AttackModulesList } from './components/attackModulesList';
import { ChatBoxControls } from './components/chatbox';
import { ChatboxFreeLayout } from './components/chatbox-free-layout';
import { ChatboxSlideLayout } from './components/chatbox-slide-layout';
import { PromptBox } from './components/prompt-box';
import { SelectedOptionPill } from './components/selectedOptionPill';
import { getWindowId, getWindowXYById } from '@app/lib/window-utils';
import { Tooltip, TooltipPosition } from '@components/tooltip';
import { appendChatHistory, setActiveSession } from '@redux/slices';
import { LayoutMode, setChatLayoutMode } from '@redux/slices';
import { Z_Index } from '@views/moonshot-desktop/constants';
import { LoadingAnimation } from '@/app/views/shared-components/loadingAnimation';

const colors = tailwindConfig.theme?.extend?.colors as CustomColors;

type ActiveSessionProps = {
  sessionData: SessionData;
};

const promptBoxId = 'prompt-box';
const streamPath = '/api/v1/redteaming/stream';

function RedteamSessionChats(props: ActiveSessionProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const windowsMap = useAppSelector((state) => state.windows.map);
  const { sessionData } = props;
  const [promptText, setPromptText] = useState('');
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [liveAttackInProgress, setLiveAttackInProgress] = useState(false);
  const [isAttackMode, setIsAttackMode] = useState(
    Boolean(sessionData.session.attack_module)
  );
  const [selectedAttackModule, setSelectedAttackModule] = useState<
    AttackModule | undefined
  >();
  const [optionsModal, setOptionsModal] = useState<
    'attack-module' | 'prompt-template' | 'context-strategy' | undefined
  >();
  const activeSession =
    useAppSelector((state) => state.activeSession.entity) || sessionData;
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<
    PromptTemplate | undefined
  >();
  const [eventData, closeEventSource] = useEventSource<
    ArtStatus,
    AppEventTypes
  >(streamPath, AppEventTypes.REDTEAM_UPDATE);

  let layoutMode = useAppSelector((state) => state.chatLayoutMode.value);

  const { data: promptTemplates, isFetching: isFetchingPromptTemplates } =
    useGetPromptTemplatesQuery();

  const { data: attackModules, isFetching: isFetchingAttackModules } =
    useGetAllAttackModulesQuery();

  const [sendPrompt, { isLoading: sendPromptIsLoading }] =
    useSendPromptMutation();
  const [sendArtPrompt, { isLoading: sendArtPromptIsLoading }] =
    useSendArtPromptMutation();

  const [triggerSetPromptTemplate, { data: promptTemplateResult }] =
    useSetPromptTemplateMutation();

  const [triggerUnSetPromptTemplate, { data: unusePromptTemplateResult }] =
    useUnsetPromptTemplateMutation();

  const [setAttackModule, { isLoading: setAttackModuleResultIsLoding }] =
    useSetAttackModuleMutation();

  const [unsetAttackModule, { isLoading: unsetAttackModuleResultIsLoding }] =
    useUnsetAttackModuleMutation();

  const chatboxControlsRef = useRef<Map<string, ChatBoxControls> | null>(null);

  useLayoutEffect(() => {
    setIsFetchingData(isFetchingPromptTemplates || isFetchingAttackModules);
  }, [isFetchingPromptTemplates, isFetchingAttackModules]);

  useEffect(() => {
    const promptBoxDefaults: Record<string, WindowData> = {};
    promptBoxDefaults[getWindowId(promptBoxId)] = calcPromptBoxDefaults();
    dispatch(updateWindows(promptBoxDefaults));
  }, []);

  useEffect(() => {
    dispatch(setActiveSession(sessionData));
  }, [sessionData]);

  useEffect(() => {
    if (!chatboxControlsRef.current) return;
    if (sendPromptIsLoading || sendArtPromptIsLoading) {
      const chatboxesControls = chatboxControlsRef.current;
      chatboxesControls.forEach((boxControl) => {
        if (boxControl) {
          boxControl.scrollToBottom();
        }
      });
    } else {
      setPromptText('');
    }
  }, [sendPromptIsLoading, sendArtPromptIsLoading]);

  useEffect(() => {
    if (!Boolean(sessionData.session.attack_module) || !attackModules) return;
    const activeAttackModule = attackModules.find(
      (module) => module.id === sessionData.session.attack_module
    );
    if (activeAttackModule) {
      setSelectedAttackModule(activeAttackModule);
      setIsAttackMode(true);
    }
  }, [attackModules]);

  useEffect(() => {
    if (!promptTemplates) return;
    if (activeSession) {
      const template = promptTemplates.find(
        (template) => template.name === activeSession.session.prompt_template
      );
      if (template) {
        setSelectedPromptTemplate(template);
      }
    }
  }, [promptTemplates, activeSession]);

  useEffect(() => {
    if (eventData) {
      if (!eventData.current_runner_id) return;
      const id = eventData.current_runner_id;
      console.log('eventData', eventData);
      dispatch(appendChatHistory(eventData.current_chats));
    }
  }, [eventData]);

  useEffect(() => {
    return () => {
      console.debug('Unmount status. Closing event source');
      closeEventSource();
    };
  }, []);

  function handleOnWindowChange(
    x: number,
    y: number,
    width: number,
    height: number,
    scrollTop: number,
    windowId: string
  ) {
    dispatch(updateWindows({ [windowId]: [x, y, width, height, scrollTop] }));
  }

  async function handleSendPromptClick(message: string) {
    if (!activeSession) return;
    setPromptText(message);
    let result;

    if (isAttackMode) {
      setLiveAttackInProgress(true);
      result = await sendArtPrompt({
        prompt: message,
        session_id: activeSession.session.session_id,
      });
    } else {
      result = await sendPrompt({
        prompt: message,
        session_id: activeSession.session.session_id,
      });
    }
    if ('data' in result && result.data) {
      if (isAttackMode) {
        if (result.data === activeSession.session.session_id) {
          return;
        }
        // todo - handle error
      }
      dispatch(appendChatHistory(result.data as ChatHistory));
    } else if ('error' in result) {
      console.error('Error fetching data:', result.error);
    }
  }

  async function handleSelectPromptTemplate(
    template: PromptTemplate | undefined
  ) {
    if (!template && activeSession && selectedPromptTemplate) {
      triggerUnSetPromptTemplate({
        session_id: activeSession.session.session_id,
        templateName: selectedPromptTemplate.name,
      });
      setSelectedPromptTemplate(undefined);
      return;
    }
    setSelectedPromptTemplate(template);
    if (activeSession && template)
      await triggerSetPromptTemplate({
        session_id: activeSession.session.session_id,
        templateName: template.name,
      });
  }

  async function handleSelectAttackModule(attackModule: AttackModule) {
    setOptionsModal(undefined);
    const result = await setAttackModule({
      session_id: activeSession.session.session_id,
      attack_id: attackModule.id,
    });
    if ('data' in result && result.data) {
      if (result.data.success) {
        setSelectedAttackModule(attackModule);
        setIsAttackMode(true);
      }
    }
  }

  async function handleRemoveAttackClick(
    attackModule: AttackModule | undefined
  ) {
    if (!attackModule) return;
    const result = await unsetAttackModule({
      session_id: activeSession.session.session_id,
      attack_id: attackModule.id,
    });
    if ('data' in result && result.data) {
      if (result.data.success) {
        setSelectedAttackModule(undefined);
        setIsAttackMode(false);
      }
    }
  }

  function calcPromptBoxDefaults(): WindowData {
    const width = 500;
    const height = 190;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight - height - 25;
    return [left, top, width, height, 0];
  }

  if (activeSession && activeSession.session.endpoints.length < 4) {
    layoutMode = LayoutMode.FREE;
  }

  let promptBoxInitialXY: [number, number] = [700, 600];

  if (layoutMode === LayoutMode.FREE) {
    if (windowsMap[getWindowId(promptBoxId)]) {
      promptBoxInitialXY = getWindowXYById(windowsMap, promptBoxId);
    }
  }

  if (activeSession === undefined) return null;

  const optionsPanel = (
    <div className="bg-moongray-600  w-[370px] absolute left-[115%] top-0 rounded-md p-2  shadow-lg">
      <div className="flex items-center gap-2">
        <Button
          text="Attack Module"
          type="button"
          mode={ButtonType.TEXT}
          hoverBtnColor={colors.moongray[500]}
          pressedBtnColor={colors.moongray[400]}
          leftIconName={IconName.MoonAttackStrategy}
          onClick={() => setOptionsModal('attack-module')}
        />
        {selectedAttackModule ? (
          <SelectedOptionPill
            label={selectedAttackModule.name}
            onXClick={() => handleRemoveAttackClick(selectedAttackModule)}
          />
        ) : (
          <p className="text-[0.9rem] text-moongray-400">None</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          text="Prompt Template"
          type="button"
          mode={ButtonType.TEXT}
          hoverBtnColor={colors.moongray[500]}
          pressedBtnColor={colors.moongray[400]}
          leftIconName={IconName.MoonPromptTemplate}
          iconSize={18}
        />
        <p className="text-[0.9rem] text-moongray-400">None</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          text="Context Strategy"
          type="button"
          mode={ButtonType.TEXT}
          hoverBtnColor={colors.moongray[500]}
          pressedBtnColor={colors.moongray[400]}
          leftIconName={IconName.MoonContextStrategy}
        />
        <p className="text-[0.9rem] text-moongray-400">None</p>
      </div>
    </div>
  );

  const layoutSwitch =
    activeSession.session.endpoints.length > 3 ? (
      <section className="w-full flex justify-center mb-8">
        <div className="flex gap-6 top-10 bg-moongray-600 rounded py-3 px-4 shadow-lg items-center w-[200px]">
          <p className="text-sm text-white">Layout: </p>
          <Tooltip
            disabled={layoutMode === LayoutMode.SLIDE}
            content="Switch to slide layout"
            position={TooltipPosition.left}
            offsetLeft={-18}
            offsetTop={5}>
            <Icon
              size={25}
              name={IconName.LayoutColumns}
              disabled={layoutMode === LayoutMode.SLIDE}
              onClick={() => dispatch(setChatLayoutMode(LayoutMode.SLIDE))}
            />
          </Tooltip>
          <Tooltip
            disabled={layoutMode === LayoutMode.FREE}
            content="Switch to free layout"
            position={TooltipPosition.right}
            offsetLeft={18}
            offsetTop={5}>
            <Icon
              size={26}
              name={IconName.LayoutWtf}
              disabled={layoutMode === LayoutMode.FREE}
              onClick={() => dispatch(setChatLayoutMode(LayoutMode.FREE))}
            />
          </Tooltip>
        </div>
      </section>
    ) : null;

  return (
    <>
      {optionsModal != undefined && (
        <Modal
          width="auto"
          height={600}
          headingColor={colors.moongray[950]}
          enableScreenOverlay
          overlayOpacity={0.8}
          bgColor={colors.moongray[500]}
          textColor={colors.moongray[400]}
          heading="Attack Modules"
          onCloseIconClick={() => setOptionsModal(undefined)}>
          {optionsModal === 'attack-module' && (
            <AttackModulesList
              onPrimaryBtnClick={handleSelectAttackModule}
              onSecondaryBtnClick={() => setOptionsModal(undefined)}
            />
          )}
        </Modal>
      )}

      <PopupSurface
        onCloseIconClick={() => router.push('/')}
        height="calc(100vh - 20px)"
        style={{
          backgroundColor: colors.moongray[800],
          width: 'calc(100vw - 20px)',
          border: 'none',
          margin: '0 auto',
        }}>
        <header className="flex relative justify-between pt-4">
          <hgroup className="flex flex-col left-6 pl-5">
            <h2 className="capitalize text-lg text-white">
              <span className="font text-white text-lg">
                {activeSession.session.name}Red Teaming Session Name Placeholder
              </span>
            </h2>
            <div className="w-80 text-white text-sm">
              {activeSession.session.description}Lorum ipsum description
              placeholder
            </div>
          </hgroup>
        </header>
        {isFetchingData ? (
          <LoadingAnimation />
        ) : (
          <>
            {layoutSwitch}
            {layoutMode === LayoutMode.SLIDE && promptTemplates && (
              <section className="flex flex-col w-full relative gap-4">
                <div className="flex h-full">
                  <ChatboxSlideLayout
                    ref={chatboxControlsRef}
                    chatSession={activeSession}
                    chatCompletionInProgress={
                      isAttackMode ? liveAttackInProgress : sendPromptIsLoading
                    }
                    promptTemplates={promptTemplates}
                    selectedPromptTemplate={selectedPromptTemplate}
                    promptText={promptText}
                    handleOnWindowChange={handleOnWindowChange}
                  />
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    <PromptBox
                      zIndex={Z_Index.FocusedWindow}
                      disabled={
                        setAttackModuleResultIsLoding || isAttackMode
                          ? liveAttackInProgress
                          : sendPromptIsLoading
                      }
                      windowId={getWindowId(promptBoxId)}
                      name={promptBoxId}
                      draggable={false}
                      chatSession={activeSession}
                      promptTemplates={promptTemplates}
                      activePromptTemplate={selectedPromptTemplate}
                      onSendClick={handleSendPromptClick}
                      onSelectPromptTemplate={handleSelectPromptTemplate}
                      onWindowChange={handleOnWindowChange}
                      styles={{ position: 'relative' }}
                    />
                    {optionsPanel}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </PopupSurface>
      {/* Draggable prompt boxes must NOT be within any positioned container because it is positioned relative to viewport */}
      {layoutMode === LayoutMode.FREE && promptTemplates ? (
        <ChatboxFreeLayout
          ref={chatboxControlsRef}
          chatSession={activeSession}
          chatCompletionInProgress={
            isAttackMode ? liveAttackInProgress : sendPromptIsLoading
          }
          promptTemplates={promptTemplates}
          selectedPromptTemplate={selectedPromptTemplate}
          promptText={promptText}
          handleOnWindowChange={handleOnWindowChange}
        />
      ) : null}
      {layoutMode === LayoutMode.FREE && promptTemplates && (
        <PromptBox
          zIndex={Z_Index.FocusedWindow}
          disabled={
            setAttackModuleResultIsLoding || isAttackMode
              ? liveAttackInProgress
              : sendPromptIsLoading
          }
          windowId={getWindowId(promptBoxId)}
          name={promptBoxId}
          draggable={layoutMode === LayoutMode.FREE}
          initialXY={promptBoxInitialXY}
          chatSession={activeSession}
          promptTemplates={promptTemplates}
          activePromptTemplate={selectedPromptTemplate}
          onCloseClick={() => null}
          onSendClick={handleSendPromptClick}
          onSelectPromptTemplate={handleSelectPromptTemplate}
          onWindowChange={handleOnWindowChange}
          onCloseSessionCommand={() => null}
        />
      )}
    </>
  );
}

export { RedteamSessionChats };
