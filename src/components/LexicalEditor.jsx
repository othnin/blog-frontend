'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  EditorState,
} from 'lexical';
import styles from './LexicalEditor.module.css';

// Toolbar Plugin
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    return editor.registerCommand(
      'UNDO_COMMAND',
      () => {
        setCanUndo(!canUndo);
        return false;
      },
      1
    );
  }, [editor, canUndo]);

  const handleUndo = () => {
    editor.dispatchCommand('UNDO_COMMAND', undefined);
  };

  const handleRedo = () => {
    editor.dispatchCommand('REDO_COMMAND', undefined);
  };

  return (
    <div className={styles.toolbar}>
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className={styles.toolbarButton}
        title="Undo"
      >
        ↶ Undo
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className={styles.toolbarButton}
        title="Redo"
      >
        ↷ Redo
      </button>
      <span className={styles.toolbarDivider}>|</span>
      <p className={styles.toolbarHint}>
        Type your blog content here. Use markdown-style formatting.
      </p>
    </div>
  );
}

// Main Lexical Editor Component
export default function LexicalEditor({ initialValue = '', onChange }) {
  const [editorContent, setEditorContent] = useState(initialValue);

  const handleEditorChange = useCallback(
    (editorState) => {
      editorState.read(() => {
        const json = editorState.toJSON();
        const jsonString = JSON.stringify(json);
        setEditorContent(jsonString);
        if (onChange) {
          onChange(jsonString);
        }
      });
    },
    [onChange]
  );

  const initialConfig = {
    namespace: 'BlogEditor',
    theme: {
      root: styles.editorRoot,
      paragraph: styles.editorParagraph,
      text: styles.editorText,
    },
    onError: (error) => {
      console.error('Lexical error:', error);
    },
  };

  return (
    <div className={styles.editorContainer}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className={styles.editorWrapper}>
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                className={styles.contentEditable}
                placeholder="Start writing your blog post..."
              />
            }
            placeholder={
              <div className={styles.placeholder}>
                Start writing your blog post...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
        </div>
      </LexicalComposer>
      <div className={styles.jsonPreview}>
        <details>
          <summary>JSON Preview (for debugging)</summary>
          <pre>{editorContent}</pre>
        </details>
      </div>
    </div>
  );
}
