import Image from 'next/image';
import { TextInput } from '../component-lib/textInput';
import { Window } from '../component-lib/window';

function PromptWindow(props: {
  name: string;
  children?: React.ReactNode;
  styles?: React.CSSProperties;
  onCloseClick?: () => void;
  onPromptTemplateClick?: () => void;
}) {
  const { onCloseClick, onPromptTemplateClick, styles } = props;

  return (
    <Window
      initialXY={[600, 600]}
      resizeable={false}
      name="Prompt"
      onCloseClick={onCloseClick}
      styles={{ height: 115, width: 500, ...styles }}
      contentAreaStyles={{ background: 'none' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <TextInput
            name="sessionName"
            placeholder="Message"
            style={{ width: 400 }}
          />
          <button
            style={{
              minWidth: 80,
              border: '1px solid #cfcfcf',
              padding: '5px 15px',
              background: '#1189b9',
              color: '#FFF',
              fontSize: 13,
              borderRadius: 4,
              height: 33,
            }}
            type="button"
            onClick={() => null}>
            Send
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex ', alignItems: 'center' }}>
            <Image
              src="icons/prompt_template.svg"
              alt="close"
              width={24}
              height={24}
              style={{
                cursor: 'pointer',
                marginRight: 3,
              }}
              onClick={onPromptTemplateClick}
            />
            <div style={{ fontSize: 11 }}> Prompt Template </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Image
              src="icons/context_strategy_icon.svg"
              alt="close"
              width={23}
              height={23}
              style={{
                cursor: 'pointer',
                marginRight: 3,
              }}
            />
            <div style={{ fontSize: 11 }}> Context Strategy </div>
          </div>
        </div>
      </div>
    </Window>
  );
}

export { PromptWindow };
