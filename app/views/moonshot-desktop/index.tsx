'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { Icon, IconName } from '@/app/components/IconSVG';
import { useWindowChange } from '@/app/hooks/use-window-change';
import {
  calcCentralizedWindowXY,
  getWindowId,
  getWindowSizeById,
  getWindowXYById,
} from '@/app/lib/window-utils';
import {
  useCreateSessionMutation,
  useLazySetActiveSessionQuery,
} from '@/app/services/session-api-service';
import { ManualRedTeaming } from '@/app/views/manual-redteaming';
import { EndpointsExplorer } from '@/app/views/models-management/endpoints-explorer';
import { useAppDispatch, useAppSelector } from '@/lib/redux';
import {
  removeActiveSession,
  setActiveSession,
} from '@/lib/redux/slices/activeSessionSlice';
import { toggleDarkMode } from '@/lib/redux/slices/darkModeSlice';
import { updateWindows } from '@/lib/redux/slices/windowsSlice';
import { WindowIds, Z_Index, defaultWindowWidthHeight } from './constants';
import { DesktopIcon } from '@components/desktop-icon';
import Menu from '@components/menu';
import TaskBar from '@components/taskbar';
import { Window } from '@components/window';
import { SessionsExplorer } from '@views/manual-redteaming/sessions-explorer';
import { WindowCreateSession } from '@views/manual-redteaming/window-create-session';

export default function MoonshotDesktop() {
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [isChatSessionOpen, setIsChatSessionOpen] = useState(false);
  const [isEndpointsExplorerOpen, setIsEndpointsExplorerOpen] = useState(false);
  const [isShowWindowCreateSession, setIsShowWindowCreateSession] =
    useState(false);
  const [isShowWindowSavedSession, setIsShowWindowSavedSession] =
    useState(false);
  const [isDesktopIconsHidden, setIsDesktopIconsHidden] = useState(false);
  const [triggerSetActiveSession] = useLazySetActiveSessionQuery();
  const dispatch = useAppDispatch();
  const handleOnWindowChange = useWindowChange();
  const windowsMap = useAppSelector((state) => state.windows.map);
  const isDarkMode = useAppSelector((state) => state.darkMode.value);
  const backgroundImageStyle = !isDarkMode
    ? {
        backgroundImage: 'url("/pink-bg-fade5.png")',
        backgroundBlendMode: 'multiply',
        backgroundSize: 'cover',
      }
    : {
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/dark-denim-3.png"), linear-gradient(to right bottom, rgb(113 112 112), rgb(34 34 34))',
      };
  const [
    createSession,
    {
      data: newSession,
      isLoading: createSessionIsLoding,
      error: createSessionError,
    },
  ] = useCreateSessionMutation();

  async function startNewSession(
    name: string,
    description: string,
    endpoints: string[]
  ) {
    const response = await createSession({
      name,
      description,
      endpoints,
    });
    //@ts-ignore
    if (response.data) {
      const activeSessionResponse = await triggerSetActiveSession(
        //@ts-ignore
        response.data.session_id
      );
      if (activeSessionResponse.data) {
        dispatch(setActiveSession(activeSessionResponse.data));
        setIsShowWindowCreateSession(false);
        setIsChatSessionOpen(true);
        setIsDesktopIconsHidden(true);
      }
    } // todo - else and error handling
  }

  function handleContinueSessionClick() {
    setIsShowWindowSavedSession(false);
    setIsChatSessionOpen(true);
    setIsDesktopIconsHidden(true);
  }

  function handlePromptWindowCloseClick() {
    setIsChatSessionOpen(false);
    dispatch(removeActiveSession());
    setIsDesktopIconsHidden(false);
  }

  function handleToggleDarkMode() {
    dispatch(toggleDarkMode());
    document.documentElement.classList.toggle('dark');
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    //set default window dimensions
    const defaults: Record<string, WindowData> = {};
    defaults[getWindowId(WindowIds.LLM_ENDPOINTS)] = [
      ...calcCentralizedWindowXY(
        ...defaultWindowWidthHeight[WindowIds.LLM_ENDPOINTS]
      ),
      defaultWindowWidthHeight[WindowIds.LLM_ENDPOINTS][0],
      defaultWindowWidthHeight[WindowIds.LLM_ENDPOINTS][1],
      0,
    ];
    defaults[getWindowId(WindowIds.SAVED_SESSIONS)] = [
      ...calcCentralizedWindowXY(
        ...defaultWindowWidthHeight[WindowIds.SAVED_SESSIONS]
      ),
      defaultWindowWidthHeight[WindowIds.SAVED_SESSIONS][0],
      defaultWindowWidthHeight[WindowIds.SAVED_SESSIONS][1],
      0,
    ];
    defaults[getWindowId(WindowIds.CREATE_SESSION)] = [
      ...calcCentralizedWindowXY(
        ...defaultWindowWidthHeight[WindowIds.CREATE_SESSION]
      ),
      defaultWindowWidthHeight[WindowIds.CREATE_SESSION][0],
      defaultWindowWidthHeight[WindowIds.CREATE_SESSION][1],
      0,
    ];
    dispatch(updateWindows(defaults));
  }, []);

  return (
    <div
      className={`
        h-screen overflow-y-hidden
        flex flex-col bg-fuchsia-100
        ${
          !isDarkMode
            ? `
          bg-gradient-to-br bg-no-repeat bg-right
          from-fuchsia-100 to-fuchsia-400`
            : ''
        }
      `}
      style={{
        ...backgroundImageStyle,
      }}>
      <TaskBar zIndex={Z_Index.Top}>
        <div className="flex w-full">
          <div className="flex-1">
            <Menu />
          </div>
          <div className="flex flex-1 justify-end items-center pr-4">
            <Icon
              name={isDarkMode ? IconName.LightSun : IconName.DarkMoon}
              size={isDarkMode ? 20 : 22}
              onClick={handleToggleDarkMode}
            />
          </div>
        </div>
      </TaskBar>
      {!isDesktopIconsHidden ? (
        <div
          id="desktopIcons"
          className="flex pt-10"
          style={{ zIndex: Z_Index.Level_1 }}>
          <div className="grid grid-rows-6 grid-cols-10 grid-flow-col p-10 gap-y-12 gap-x-4">
            <DesktopIcon
              name={IconName.Folder}
              label="Cookbooks"
              onClick={() => setIsWindowOpen(true)}
            />
            <DesktopIcon
              name={IconName.Folder}
              label="Recipes"
            />
            <DesktopIcon
              name={IconName.Folder}
              label="LLM Endpoints"
              onClick={() => setIsEndpointsExplorerOpen(true)}
            />
            <DesktopIcon
              name={IconName.Folder}
              label="Prompt Templates"
            />
            <DesktopIcon
              name={IconName.ChatBubbles}
              label="RedTeaming"
              size={40}
              onClick={() => setIsShowWindowCreateSession(true)}
            />
            <DesktopIcon
              name={IconName.RunCookbook}
              label="Run Cookbook"
              onClick={() => null}
            />
            <DesktopIcon
              name={IconName.FolderForChatSessions}
              label="Saved Sessions"
              onClick={() => setIsShowWindowSavedSession(true)}
            />
          </div>
        </div>
      ) : null}

      {isWindowOpen ? (
        <Window
          id="cookbooks"
          name="Cookbooks"
          onCloseClick={() => setIsWindowOpen(false)}>
          <ul style={{ color: '#494848', padding: 15 }}>
            <li
              style={{
                borderBottom: '1px solid #dbdada',
                cursor: 'pointer',
              }}
              onClick={() => null}>
              legal-summarisation.json
            </li>
            <li
              style={{
                borderBottom: '1px solid #dbdada',
                cursor: 'pointer',
              }}>
              bbq-lite-age-cookbook.json
            </li>
            <li
              style={{
                borderBottom: '1px solid #dbdada',
                cursor: 'pointer',
              }}>
              evaluation-catalogue-cookbook.json
            </li>
          </ul>
        </Window>
      ) : null}

      {isShowWindowCreateSession ? (
        <WindowCreateSession
          zIndex={Z_Index.Level_2}
          windowId={getWindowId(WindowIds.CREATE_SESSION)}
          initialXY={getWindowXYById(windowsMap, WindowIds.CREATE_SESSION)}
          initialSize={getWindowSizeById(windowsMap, WindowIds.CREATE_SESSION)}
          onCloseClick={() => setIsShowWindowCreateSession(false)}
          onStartClick={startNewSession}
          onWindowChange={handleOnWindowChange}
        />
      ) : null}

      {isChatSessionOpen ? (
        <ManualRedTeaming
          zIndex={Z_Index.Level_2}
          onCloseBtnClick={handlePromptWindowCloseClick}
        />
      ) : null}

      {isEndpointsExplorerOpen ? (
        <EndpointsExplorer
          zIndex={Z_Index.Level_2}
          windowId={getWindowId(WindowIds.LLM_ENDPOINTS)}
          initialXY={getWindowXYById(windowsMap, WindowIds.LLM_ENDPOINTS)}
          initialSize={getWindowSizeById(windowsMap, WindowIds.LLM_ENDPOINTS)}
          onWindowChange={handleOnWindowChange}
          onCloseClick={() => setIsEndpointsExplorerOpen(false)}
        />
      ) : null}

      {isShowWindowSavedSession ? (
        <SessionsExplorer
          zIndex={Z_Index.Level_2}
          windowId={getWindowId(WindowIds.SAVED_SESSIONS)}
          initialXY={getWindowXYById(windowsMap, WindowIds.SAVED_SESSIONS)}
          initialSize={getWindowSizeById(windowsMap, WindowIds.SAVED_SESSIONS)}
          onCloseClick={() => setIsShowWindowSavedSession(false)}
          onContinueSessionClick={handleContinueSessionClick}
          onWindowChange={handleOnWindowChange}
        />
      ) : null}

      {!isDesktopIconsHidden ? (
        <Image
          src="/moonshot_glow.png"
          alt="Moonshot"
          width={400}
          height={80}
          style={{
            position: 'absolute',
            bottom: 50,
            right: -40,
            zIndex: Z_Index.Base,
          }}
        />
      ) : null}
    </div>
  );
}
