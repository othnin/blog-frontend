'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';

import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';

import { $setBlocksType } from '@lexical/selection';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode as LexicalListNode,
} from '@lexical/list';
import { $createCodeNode } from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';

import styles from './LexicalEditor.module.css';

const FONT_FAMILIES = [
  'Default', 'Arial', 'Courier New', 'Georgia',
  'Times New Roman', 'Trebuchet MS', 'Verdana',
];

const FONT_SIZES = ['10px','12px','14px','16px','18px','20px','24px','28px','32px','36px','48px'];

const BLOCK_TYPES = {
  paragraph: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  bullet: 'Bulleted List',
  number: 'Numbered List',
  quote: 'Quote',
  code: 'Code Block',
};

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState('paragraph');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [fontColor, setFontColor] = useState('#000000');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsUnderline(selection.hasFormat('underline'));
    setIsStrikethrough(selection.hasFormat('strikethrough'));
    setIsCode(selection.hasFormat('code'));

    const node = selection.anchor.getNode();
    const parent = node.getParent();
    setIsLink($isLinkNode(parent) || $isLinkNode(node));

    const element =
      node.getKey() === 'root' ? node : node.getTopLevelElementOrThrow();

    if ($isListNode(element)) {
      const parentList = $getNearestNodeOfType(node, LexicalListNode);
      const type = parentList ? parentList.getListType() : element.getListType();
      setBlockType(type === 'bullet' ? 'bullet' : 'number');
    } else {
      const type = $isHeadingNode(element) ? element.getTag() : element.getType();
      setBlockType(type || 'paragraph');
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateToolbar());
      }),
    );
  }, [editor, updateToolbar]);

  const noFocusSteal = (e) => e.preventDefault();

  const formatBlock = (type) => {
    if (type === 'bullet') {
      editor.dispatchCommand(
        blockType === 'bullet' ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
        undefined
      );
      return;
    }
    if (type === 'number') {
      editor.dispatchCommand(
        blockType === 'number' ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
        undefined
      );
      return;
    }
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (type === 'paragraph') $setBlocksType(selection, () => $createParagraphNode());
      else if (type === 'quote')  $setBlocksType(selection, () => $createQuoteNode());
      else if (type === 'code')   $setBlocksType(selection, () => $createCodeNode());
      else if (['h1','h2','h3','h4'].includes(type))
        $setBlocksType(selection, () => $createHeadingNode(type));
    });
  };

  const insertLink = () => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      const url = prompt('Enter URL:');
      if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url, target: '_blank' });
    }
  };

  const applyFontColor = (color) => {
    setFontColor(color);
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      sel.getNodes().forEach((n) => {
        if (n.setStyle) {
          const s = (n.getStyle?.() || '').replace(/color:\s*[^;]+;?/g, '').trim();
          n.setStyle(`${s}; color: ${color}`);
        }
      });
    });
  };

  const btn = (active, title, onClick, children) => (
    <button
      type="button"
      title={title}
      onMouseDown={noFocusSteal}
      onClick={onClick}
      className={`${styles.toolbarBtn} ${active ? styles.toolbarBtnActive : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className={styles.toolbar}>
      {/* Undo / Redo */}
      <button type="button" onMouseDown={noFocusSteal} className={styles.toolbarBtn} title="Undo" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>&#8630;</button>
      <button type="button" onMouseDown={noFocusSteal} className={styles.toolbarBtn} title="Redo" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>&#8631;</button>

      <span className={styles.divider} />

      {/* Block type */}
      <select
        className={styles.toolbarSelect}
        value={blockType}
        onChange={(e) => formatBlock(e.target.value)}
        title="Block type"
      >
        {Object.entries(BLOCK_TYPES).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>

      <span className={styles.divider} />

      {/* Font family */}
      <select
        className={styles.toolbarSelect}
        onChange={(e) => {
          const family = e.target.value;
          editor.update(() => {
            const sel = $getSelection();
            if (!$isRangeSelection(sel)) return;
            sel.getNodes().forEach((n) => {
              if (n.setStyle) {
                const s = (n.getStyle?.() || '').replace(/font-family:\s*[^;]+;?/g, '').trim();
                n.setStyle(family === 'Default' ? s : `${s}; font-family: ${family}`);
              }
            });
          });
        }}
        title="Font family"
      >
        {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>

      {/* Font size */}
      <select
        className={styles.toolbarSelect}
        defaultValue="16px"
        onChange={(e) => {
          const size = e.target.value;
          editor.update(() => {
            const sel = $getSelection();
            if (!$isRangeSelection(sel)) return;
            sel.getNodes().forEach((n) => {
              if (n.setStyle) {
                const s = (n.getStyle?.() || '').replace(/font-size:\s*[^;]+;?/g, '').trim();
                n.setStyle(`${s}; font-size: ${size}`);
              }
            });
          });
        }}
        title="Font size"
      >
        {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <span className={styles.divider} />

      {/* Text format */}
      {btn(isBold,          'Bold',          () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'),          <strong>B</strong>)}
      {btn(isItalic,        'Italic',        () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'),        <em>I</em>)}
      {btn(isUnderline,     'Underline',     () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'),     <u>U</u>)}
      {btn(isStrikethrough, 'Strikethrough', () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'), <s>S</s>)}
      {btn(isCode,          'Inline code',   () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'),          <code>&lt;/&gt;</code>)}

      <span className={styles.divider} />

      {/* Alignment */}
      {btn(false, 'Align left',   () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'),    <span>&#8676;</span>)}
      {btn(false, 'Align center', () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'),  <span>&#8596;</span>)}
      {btn(false, 'Align right',  () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'),   <span>&#8677;</span>)}
      {btn(false, 'Justify',      () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'), <span>&#8801;</span>)}

      <span className={styles.divider} />

      {/* Link */}
      {btn(isLink, 'Insert / remove link', insertLink, <span>&#128279;</span>)}

      {/* Text color */}
      <label className={styles.colorLabel} title="Text color" onMouseDown={noFocusSteal}>
        <span className={styles.colorIcon} style={{ borderBottom: `3px solid ${fontColor}` }}>A</span>
        <input
          type="color"
          value={fontColor}
          onChange={(e) => applyFontColor(e.target.value)}
          className={styles.colorInput}
        />
      </label>
    </div>
  );
}

export default function LexicalEditor({ initialValue = '', onChange }) {
  const initialConfig = {
    namespace: 'BlogEditor',
    editorState: initialValue || undefined,
    theme: {
      root: styles.editorRoot,
      paragraph: styles.paragraph,
      heading: { h1: styles.h1, h2: styles.h2, h3: styles.h3, h4: styles.h4 },
      list: {
        ul: styles.ul,
        ol: styles.ol,
        listitem: styles.listItem,
        nested: { listitem: styles.nestedListItem },
        listitemChecked: styles.listitemChecked,
        listitemUnchecked: styles.listitemUnchecked,
      },
      quote: styles.quote,
      code: styles.codeBlock,
      link: styles.link,
      text: {
        bold: styles.textBold,
        italic: styles.textItalic,
        underline: styles.textUnderline,
        strikethrough: styles.textStrikethrough,
        code: styles.textCode,
      },
    },
    nodes: [
      HeadingNode, QuoteNode, CodeNode, CodeHighlightNode,
      LinkNode, AutoLinkNode, ListNode, ListItemNode,
      TableNode, TableCellNode, TableRowNode,
    ],
    onError: (error) => console.error('Lexical error:', error),
  };

  const handleChange = useCallback(
    (editorState) => {
      editorState.read(() => {
        if (onChange) onChange(JSON.stringify(editorState.toJSON()));
      });
    },
    [onChange]
  );

  return (
    <div className={styles.editorContainer}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className={styles.editorWrapper}>
          <RichTextPlugin
            contentEditable={<ContentEditable className={styles.contentEditable} />}
            placeholder={<div className={styles.placeholder}>Start writing your blog post...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <TablePlugin />
          <CheckListPlugin />
          <TabIndentationPlugin />
          <OnChangePlugin onChange={handleChange} />
        </div>
      </LexicalComposer>
    </div>
  );
}
