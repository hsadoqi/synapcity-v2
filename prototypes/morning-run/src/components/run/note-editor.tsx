'use client';

import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  type EditorState,
} from 'lexical';
import {
  LexicalComposer,
  type InitialConfigType,
} from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { useEffect } from 'react';

import { cn } from '@/lib/utils';

type Props = {
  /** Read once when the editor mounts. Change `key` to load a different value. */
  initialValue: string;
  onChange: (text: string) => void;
  /** Fired by Ctrl or Cmd + Enter. Plain Enter makes a new line. */
  onSubmit?: () => void;
  ariaLabel: string;
  placeholder: string;
  autoFocus?: boolean;
  /** Tailwind min-height class. */
  minHeight?: string;
  className?: string;
};

function $fillPlainText(text: string) {
  const root = $getRoot();
  root.clear();
  const paragraph = $createParagraphNode();
  text.split('\n').forEach((line, index) => {
    if (index > 0) paragraph.append($createLineBreakNode());
    if (line) paragraph.append($createTextNode(line));
  });
  root.append(paragraph);
}

function SubmitPlugin({ onSubmit }: { onSubmit: () => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(
    () =>
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (event && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onSubmit();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    [editor, onSubmit],
  );
  return null;
}

/**
 * Private free text, edited with Lexical. Plain text only: it is stored and exported as text,
 * so it survives any later change of editor.
 */
export function NoteEditor({
  initialValue,
  onChange,
  onSubmit,
  ariaLabel,
  placeholder,
  autoFocus,
  minHeight = 'min-h-12',
  className,
}: Props) {
  const initialConfig: InitialConfigType = {
    namespace: 'morning-run-note',
    onError: (error) => {
      throw error;
    },
    editorState: () => $fillPlainText(initialValue),
  };

  const handleChange = (state: EditorState) => {
    onChange(state.read(() => $getRoot().getTextContent()));
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn('relative', className)}>
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={ariaLabel}
              aria-placeholder={placeholder}
              placeholder={
                <div className="pointer-events-none absolute inset-x-0 top-0 py-3 text-lg text-muted-foreground">
                  {placeholder}
                </div>
              }
              className={cn(
                'w-full border-0 border-b border-input bg-transparent py-3 text-lg leading-relaxed outline-none transition-colors focus:border-primary focus-visible:outline-none',
                minHeight,
              )}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
        {onSubmit ? <SubmitPlugin onSubmit={onSubmit} /> : null}
        {autoFocus ? <AutoFocusPlugin /> : null}
      </div>
    </LexicalComposer>
  );
}
