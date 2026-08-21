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
import {
  HorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from '@lexical/react/LexicalHorizontalRuleNode';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';

import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $insertNodes,
  $getNodeByKey,
  $setSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  DecoratorNode,
  createCommand,
  COMMAND_PRIORITY_EDITOR,
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
import { fetchWithAuth } from '@/lib/tokenUtils';
import { API_ENDPOINTS } from '@/config/api';
import { useResolvedImageUrl } from '@/hooks/useResolvedImageUrl';

import styles from './LexicalEditor.module.css';

// ─── MediaControls (shared overlay for align buttons + delete) ────────────────

function MediaControls({ editor, nodeKey, align, onDelete }) {
  const setAlign = (newAlign) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && typeof node.setAlign === 'function') {
        node.setAlign(align === newAlign ? 'none' : newAlign);
      }
    });
  };

  const alignBtn = (value, title, Icon) => (
    <button
      type="button"
      className={`${styles.mediaAlignBtn}${align === value ? ` ${styles.mediaAlignBtnActive}` : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => { e.stopPropagation(); setAlign(value); }}
      title={title}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className={styles.mediaControls}>
      {alignBtn('left', 'Align left (wrap text)', AlignLeft)}
      {alignBtn('center', 'Align center', AlignCenter)}
      {alignBtn('right', 'Align right (wrap text)', AlignRight)}
      <span className={styles.mediaControlsDivider} />
      <button
        type="button"
        className={styles.imageDeleteBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onDelete}
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

// ─── ImageNode ────────────────────────────────────────────────────────────────

export const INSERT_IMAGE_COMMAND = createCommand('INSERT_IMAGE_COMMAND');

function ImageComponent({ src, altText, nodeKey, editor, width, align }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [localWidth, setLocalWidth] = useState(width ?? null);
  const imgRef = useRef(null);
  const latestWidthRef = useRef(localWidth);
  const { src: resolvedSrc, loading } = useResolvedImageUrl(src);

  // Sync when undo/redo changes the node's width externally
  useEffect(() => {
    setLocalWidth(width ?? null);
    latestWidthRef.current = width ?? null;
  }, [width]);

  // Block text selection and set cursor globally while dragging
  useEffect(() => {
    if (!isResizing) return;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const handleDelete = (e) => {
    e.stopPropagation();
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  };

  // direction: 'e' = right handle (drag right → wider), 'w' = left handle (drag left → wider)
  const startResize = (direction) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = imgRef.current?.offsetWidth ?? 300;

    const onMouseMove = (moveEvent) => {
      const delta = direction === 'w'
        ? startX - moveEvent.clientX
        : moveEvent.clientX - startX;
      const newWidth = Math.max(100, Math.round(startWidth + delta));
      latestWidthRef.current = newWidth;
      setLocalWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setIsResizing(false);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) node.setWidth(latestWidthRef.current);
      });
    };

    setIsResizing(true);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const isActive = isHovered || isResizing;
  const imgStyle = localWidth ? { width: `${localWidth}px`, height: 'auto' } : {};

  const getAlignClass = () => {
    switch (align) {
      case 'left': return styles.mediaAlignLeft;
      case 'right': return styles.mediaAlignRight;
      case 'center': return styles.mediaAlignCenter;
      default: return '';
    }
  };

  return (
    <div
      className={`${styles.imageWrapper} ${getAlignClass()}${isActive ? ` ${styles.mediaActive}` : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { if (!isResizing) setIsHovered(false); }}
    >
      <img
        ref={imgRef}
        src={resolvedSrc}
        alt={altText}
        className={styles.editorImage}
        style={imgStyle}
        draggable={false}
      />
      {isActive && (
        <>
          <div
            className={`${styles.resizeHandle} ${styles.resizeHandleW}`}
            onMouseDown={startResize('w')}
          />
          <div
            className={`${styles.resizeHandle} ${styles.resizeHandleE}`}
            onMouseDown={startResize('e')}
          />
          <MediaControls
            editor={editor}
            nodeKey={nodeKey}
            align={align}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}

class ImageNode extends DecoratorNode {
  static getType() { return 'image'; }
  static clone(node) { return new ImageNode(node.__src, node.__altText, node.__width, node.__align, node.__key); }

  constructor(src, altText = '', width = null, align = 'none', key) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__align = align;
  }

  static importJSON(s) { return new ImageNode(s.src, s.altText || '', s.width ?? null, s.align ?? 'none'); }
  exportJSON() {
    return { type: 'image', version: 1, src: this.__src, altText: this.__altText, width: this.__width, align: this.__align };
  }

  setWidth(width) {
    const self = this.getWritable();
    self.__width = width;
  }

  setAlign(align) {
    const self = this.getWritable();
    self.__align = align;
  }

  isInline() { return false; }
  createDOM() { return document.createElement('div'); }
  updateDOM() { return false; }
  decorate(editor) {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        nodeKey={this.__key}
        editor={editor}
        width={this.__width}
        align={this.__align}
      />
    );
  }
}

function $createImageNode(src, altText) { return new ImageNode(src, altText); }

function ImagePlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      ({ src, altText }) => {
        editor.update(() => {
          const imageNode = $createImageNode(src, altText);
          $insertNodes([imageNode]);
          // Always ensure a paragraph follows so the cursor has somewhere to go
          if (imageNode.getNextSibling() === null) {
            const paragraph = $createParagraphNode();
            imageNode.insertAfter(paragraph);
            paragraph.select();
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);
  return null;
}

// ─── YouTubeNode ──────────────────────────────────────────────────────────────

export const INSERT_YOUTUBE_COMMAND = createCommand('INSERT_YOUTUBE_COMMAND');

function extractYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/,
  );
  return match ? match[1] : null;
}

function YouTubeComponent({ videoId, nodeKey, editor, width, align }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [localWidth, setLocalWidth] = useState(width ?? null);
  const wrapperRef = useRef(null);
  const latestWidthRef = useRef(localWidth);

  useEffect(() => {
    setLocalWidth(width ?? null);
    latestWidthRef.current = width ?? null;
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const startResize = (direction) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = wrapperRef.current?.offsetWidth ?? 400;

    const onMouseMove = (moveEvent) => {
      const delta = direction === 'w'
        ? startX - moveEvent.clientX
        : moveEvent.clientX - startX;
      const newWidth = Math.max(200, Math.round(startWidth + delta));
      latestWidthRef.current = newWidth;
      setLocalWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setIsResizing(false);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) node.setWidth(latestWidthRef.current);
      });
    };

    setIsResizing(true);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const isActive = isHovered || isResizing;
  const outerStyle = localWidth ? { width: `${localWidth}px`, maxWidth: '100%' } : {};

  const getAlignClass = () => {
    switch (align) {
      case 'left': return styles.mediaAlignLeft;
      case 'right': return styles.mediaAlignRight;
      case 'center': return styles.mediaAlignCenter;
      default: return '';
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  };

  return (
    <div
      ref={wrapperRef}
      className={`${styles.youtubeResizeWrapper} ${getAlignClass()}${isActive ? ` ${styles.mediaActive}` : ''}`}
      style={outerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { if (!isResizing) setIsHovered(false); }}
    >
      <div className={styles.youtubeWrapper}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={styles.youtubeIframe}
        />
      </div>
      {isActive && (
        <>
          <div
            className={`${styles.resizeHandle} ${styles.resizeHandleW}`}
            onMouseDown={startResize('w')}
          />
          <div
            className={`${styles.resizeHandle} ${styles.resizeHandleE}`}
            onMouseDown={startResize('e')}
          />
          <MediaControls
            editor={editor}
            nodeKey={nodeKey}
            align={align}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}

class YouTubeNode extends DecoratorNode {
  static getType() { return 'youtube'; }
  static clone(node) { return new YouTubeNode(node.__videoId, node.__width, node.__align, node.__key); }

  constructor(videoId, width = null, align = 'none', key) {
    super(key);
    this.__videoId = videoId;
    this.__width = width;
    this.__align = align;
  }

  static importJSON(s) { return new YouTubeNode(s.videoId, s.width ?? null, s.align ?? 'none'); }
  exportJSON() {
    return { type: 'youtube', version: 1, videoId: this.__videoId, width: this.__width, align: this.__align };
  }

  setWidth(width) {
    const self = this.getWritable();
    self.__width = width;
  }

  setAlign(align) {
    const self = this.getWritable();
    self.__align = align;
  }

  isInline() { return false; }
  createDOM() { return document.createElement('div'); }
  updateDOM() { return false; }

  decorate(editor) {
    return (
      <YouTubeComponent
        videoId={this.__videoId}
        nodeKey={this.__key}
        editor={editor}
        width={this.__width}
        align={this.__align}
      />
    );
  }
}

function YouTubePlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      ({ videoId }) => {
        editor.update(() => {
          $insertNodes([new YouTubeNode(videoId)]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);
  return null;
}

// ─── TweetNode ────────────────────────────────────────────────────────────────

export const INSERT_TWEET_COMMAND = createCommand('INSERT_TWEET_COMMAND');

function TweetComponent({ tweetUrl, nodeKey, editor, align }) {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderWidget = () => {
      if (window.twttr?.widgets) {
        window.twttr.widgets.load(containerRef.current);
      }
    };

    if (window.twttr) {
      renderWidget();
    } else {
      const existing = document.getElementById('twitter-widget-js');
      if (existing) {
        existing.addEventListener('load', renderWidget, { once: true });
      } else {
        const script = document.createElement('script');
        script.id = 'twitter-widget-js';
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = renderWidget;
        document.head.appendChild(script);
      }
    }
  }, [tweetUrl]);

  const getAlignClass = () => {
    switch (align) {
      case 'left': return styles.mediaAlignLeft;
      case 'right': return styles.mediaAlignRight;
      case 'center': return styles.mediaAlignCenter;
      default: return '';
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  };

  const isActive = isHovered;

  return (
    <div
      className={`${styles.tweetWrapper} ${getAlignClass()}${isActive ? ` ${styles.mediaActive}` : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div ref={containerRef}>
        <blockquote className="twitter-tweet">
          <a href={tweetUrl}>{tweetUrl}</a>
        </blockquote>
      </div>
      {isActive && (
        <MediaControls
          editor={editor}
          nodeKey={nodeKey}
          align={align}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

class TweetNode extends DecoratorNode {
  static getType() { return 'tweet'; }
  static clone(node) { return new TweetNode(node.__tweetUrl, node.__align, node.__key); }

  constructor(tweetUrl, align = 'none', key) {
    super(key);
    this.__tweetUrl = tweetUrl;
    this.__align = align;
  }

  static importJSON(s) { return new TweetNode(s.tweetUrl, s.align ?? 'none'); }
  exportJSON() {
    return { type: 'tweet', version: 1, tweetUrl: this.__tweetUrl, align: this.__align };
  }

  setAlign(align) {
    const self = this.getWritable();
    self.__align = align;
  }

  isInline() { return false; }
  createDOM() { return document.createElement('div'); }
  updateDOM() { return false; }

  decorate(editor) {
    return <TweetComponent tweetUrl={this.__tweetUrl} nodeKey={this.__key} editor={editor} align={this.__align} />;
  }
}

function TweetPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      INSERT_TWEET_COMMAND,
      ({ tweetUrl }) => {
        editor.update(() => {
          $insertNodes([new TweetNode(tweetUrl)]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);
  return null;
}

// ─── FootnoteNode ────────────────────────────────────────────────────────────

class FootnoteNode extends DecoratorNode {
  static getType() { return 'footnote'; }
  static clone(node) { return new FootnoteNode(node.__title, node.__body, node.__key); }

  constructor(title, body, key) {
    super(key);
    this.__title = title;
    this.__body = body;
  }

  static importJSON(s) { return new FootnoteNode(s.title, s.body); }
  exportJSON() {
    return { type: 'footnote', version: 1, title: this.__title, body: this.__body };
  }

  setTitleAndBody(title, body) {
    const self = this.getWritable();
    self.__title = title;
    self.__body = body;
  }

  getTitle() { return this.__title; }
  getBody() { return this.__body; }

  isInline() { return true; }
  createDOM() {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    return span;
  }
  updateDOM() { return false; }

  decorate(editor) {
    return (
      <FootnoteComponent
        nodeKey={this.__key}
        title={this.__title}
        body={this.__body}
        editor={editor}
      />
    );
  }
}

function $createFootnoteNode(title, body) { return new FootnoteNode(title, body); }
function $isFootnoteNode(node) { return node instanceof FootnoteNode; }

// ─── FootnoteDialog (shared insert + edit) ────────────────────────────────────

function FootnoteDialog({ open, onOpenChange, initialTitle = '', initialBody = '', onSave, onDelete, mode }) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setBody(initialBody);
    }
  }, [open, initialTitle, initialBody]);

  const canSave = title.trim().length > 0 && body.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Footnote' : 'Insert Footnote'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body text"
            rows={5}
          />
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {mode === 'edit' && (
              <button
                type="button"
                onClick={onDelete}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Delete footnote
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => onSave(title.trim(), body.trim())}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── FootnoteComponent ────────────────────────────────────────────────────────

function FootnoteComponent({ nodeKey, title, body, editor }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = (newTitle, newBody) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.setTitleAndBody(newTitle, newBody);
    });
    setDialogOpen(false);
  };

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
    setDialogOpen(false);
  };

  return (
    <>
      <span
        role="button"
        tabIndex={-1}
        className={styles.footnoteMarker}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
        title="Edit footnote"
      />
      <FootnoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialTitle={title}
        initialBody={body}
        onSave={handleSave}
        onDelete={handleDelete}
        mode="edit"
      />
    </>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  'Default', 'Arial', 'Courier New', 'Georgia',
  'Times New Roman', 'Trebuchet MS', 'Verdana',
];

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

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;
const DEFAULT_FONT_SIZE = 16;

// ─── ToolbarPlugin ────────────────────────────────────────────────────────────

function ToolbarPlugin({ enableFootnotes = true }) {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState('paragraph');
  const [fontFamily, setFontFamily] = useState('Default');
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [fontColor, setFontColor] = useState('#000000');
  const [isUploading, setIsUploading] = useState(false);
  const [footnoteDialogOpen, setFootnoteDialogOpen] = useState(false);
  const imageInputRef = useRef(null);
  const capturedSelectionRef = useRef(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsUnderline(selection.hasFormat('underline'));
    setIsCode(selection.hasFormat('code'));

    const node = selection.anchor.getNode();
    const parent = node.getParent();
    setIsLink($isLinkNode(parent) || $isLinkNode(node));

    // Read font-size and font-family from the anchor node's inline style
    const style = node.getStyle?.() || '';
    const sizeMatch = style.match(/font-size:\s*(\d+)px/);
    setFontSize(sizeMatch ? parseInt(sizeMatch[1], 10) : DEFAULT_FONT_SIZE);
    const familyMatch = style.match(/font-family:\s*([^;]+)/);
    setFontFamily(familyMatch ? familyMatch[1].trim() : 'Default');

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

  // ── Block type ──────────────────────────────────────────────────────────────

  const formatBlock = (type) => {
    if (type === 'bullet') {
      editor.dispatchCommand(
        blockType === 'bullet' ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
        undefined,
      );
      return;
    }
    if (type === 'number') {
      editor.dispatchCommand(
        blockType === 'number' ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
        undefined,
      );
      return;
    }
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (type === 'paragraph') $setBlocksType(selection, () => $createParagraphNode());
      else if (type === 'quote')  $setBlocksType(selection, () => $createQuoteNode());
      else if (type === 'code')   $setBlocksType(selection, () => $createCodeNode());
      else if (['h1', 'h2', 'h3', 'h4'].includes(type))
        $setBlocksType(selection, () => $createHeadingNode(type));
    });
  };

  // ── Font family ─────────────────────────────────────────────────────────────

  const applyFontFamily = (family) => {
    setFontFamily(family);
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
  };

  // ── Font size ───────────────────────────────────────────────────────────────

  const applyFontSize = (size) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size));
    setFontSize(clamped);
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      sel.getNodes().forEach((n) => {
        if (n.setStyle) {
          const s = (n.getStyle?.() || '').replace(/font-size:\s*[^;]+;?/g, '').trim();
          n.setStyle(`${s}; font-size: ${clamped}px`);
        }
      });
    });
  };

  // ── Link ────────────────────────────────────────────────────────────────────

  const insertLink = () => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      const url = prompt('Enter URL:');
      if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url, target: '_blank' });
    }
  };

  // ── Font color ──────────────────────────────────────────────────────────────

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

  // ── Image upload ─────────────────────────────────────────────────────────────

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.blog.uploadImage, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Image upload failed.');
        return;
      }
      const { filename } = await res.json();
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: filename, altText: file.name });
    } catch (err) {
      alert('Image upload error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ── YouTube / Tweet inserts ──────────────────────────────────────────────────

  const insertYouTube = () => {
    const url = prompt('Enter YouTube URL:');
    if (!url) return;
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      alert('Could not find a YouTube video ID in that URL.');
      return;
    }
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, { videoId });
  };

  const insertTweet = () => {
    const url = prompt('Enter X (Twitter) post URL:');
    if (!url) return;
    if (!url.includes('twitter.com') && !url.includes('x.com')) {
      alert('Please enter a valid X (Twitter) post URL.');
      return;
    }
    editor.dispatchCommand(INSERT_TWEET_COMMAND, { tweetUrl: url });
  };

  // ── Footnote insert ───────────────────────────────────────────────────────────

  const openFootnoteDialog = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        capturedSelectionRef.current = selection.clone();
      } else {
        capturedSelectionRef.current = null;
      }
    });
    setFootnoteDialogOpen(true);
  };

  const handleInsertFootnoteSave = (title, body) => {
    editor.update(() => {
      if (capturedSelectionRef.current) {
        $setSelection(capturedSelectionRef.current);
      }
      $insertNodes([$createFootnoteNode(title, body)]);
    });
    capturedSelectionRef.current = null;
    setFootnoteDialogOpen(false);
  };

  // ── Format button helper ─────────────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={styles.toolbar}>

      {/* Undo / Redo */}
      <button type="button" onMouseDown={noFocusSteal} className={styles.toolbarBtn} title="Undo"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>&#8630;</button>
      <button type="button" onMouseDown={noFocusSteal} className={styles.toolbarBtn} title="Redo"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>&#8631;</button>

      <span className={styles.divider} />

      {/* Text / Block type */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" onMouseDown={noFocusSteal}
            className={`${styles.toolbarBtn} ${styles.toolbarDropdownBtn}`}>
            {BLOCK_TYPES[blockType] ?? 'Text'}
            <span className={styles.chevron}>▾</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={styles.dropdownContent} sideOffset={4}>
            {Object.entries(BLOCK_TYPES).map(([val, label]) => (
              <DropdownMenu.Item
                key={val}
                className={`${styles.dropdownItem} ${blockType === val ? styles.dropdownItemActive : ''}`}
                onSelect={() => formatBlock(val)}
              >
                {label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <span className={styles.divider} />

      {/* Font family */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" onMouseDown={noFocusSteal}
            className={`${styles.toolbarBtn} ${styles.toolbarDropdownBtn}`}
            style={{ fontFamily: fontFamily === 'Default' ? undefined : fontFamily }}>
            {fontFamily}
            <span className={styles.chevron}>▾</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={styles.dropdownContent} sideOffset={4}>
            {FONT_FAMILIES.map((f) => (
              <DropdownMenu.Item
                key={f}
                className={`${styles.dropdownItem} ${fontFamily === f ? styles.dropdownItemActive : ''}`}
                style={{ fontFamily: f === 'Default' ? undefined : f }}
                onSelect={() => applyFontFamily(f)}
              >
                {f}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Font size +/- */}
      <div className={styles.fontSizeControl}>
        <button type="button" onMouseDown={noFocusSteal} className={styles.toolbarBtn}
          title="Decrease font size" onClick={() => applyFontSize(fontSize - 1)}>
          −
        </button>
        <span className={styles.fontSizeDisplay}>{fontSize}</span>
        <button type="button" onMouseDown={noFocusSteal} className={styles.toolbarBtn}
          title="Increase font size" onClick={() => applyFontSize(fontSize + 1)}>
          +
        </button>
      </div>

      <span className={styles.divider} />

      {/* Text formatting */}
      {btn(isBold,      'Bold',        () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'),      <strong>B</strong>)}
      {btn(isItalic,    'Italic',      () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'),    <em>I</em>)}
      {btn(isUnderline, 'Underline',   () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'), <u>U</u>)}
      {btn(isCode,      'Inline code', () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'),      <code>&lt;/&gt;</code>)}
      {btn(isLink,      'Insert / remove link', insertLink, <span>&#128279;</span>)}

      <span className={styles.divider} />

      {/* Font color — native picker */}
      <label className={`${styles.toolbarBtn} ${styles.colorLabel}`} title="Text color" onMouseDown={noFocusSteal}>
        <span className={styles.colorIcon} style={{ borderBottom: `3px solid ${fontColor}` }}>A</span>
        <input
          type="color"
          value={fontColor}
          onChange={(e) => applyFontColor(e.target.value)}
          className={styles.colorInput}
        />
      </label>

      <span className={styles.divider} />

      {/* Align */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" onMouseDown={noFocusSteal}
            className={`${styles.toolbarBtn} ${styles.toolbarDropdownBtn}`}>
            Align <span className={styles.chevron}>▾</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={styles.dropdownContent} sideOffset={4}>
            <DropdownMenu.Item className={styles.dropdownItem}
              onSelect={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}>
              Left Align
            </DropdownMenu.Item>
            <DropdownMenu.Item className={styles.dropdownItem}
              onSelect={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}>
              Center Align
            </DropdownMenu.Item>
            <DropdownMenu.Item className={styles.dropdownItem}
              onSelect={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}>
              Right Align
            </DropdownMenu.Item>
            <DropdownMenu.Separator className={styles.dropdownSeparator} />
            <DropdownMenu.Item className={styles.dropdownItem}
              onSelect={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}>
              Indent
            </DropdownMenu.Item>
            <DropdownMenu.Item className={styles.dropdownItem}
              onSelect={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}>
              Outdent
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <span className={styles.divider} />

      {/* Insert */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" onMouseDown={noFocusSteal}
            className={`${styles.toolbarBtn} ${styles.toolbarDropdownBtn}`}>
            Insert <span className={styles.chevron}>▾</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={styles.dropdownContent} sideOffset={4}>
            <DropdownMenu.Item className={styles.dropdownItem}
              onSelect={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}>
              Horizontal Rule
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={`${styles.dropdownItem} ${isUploading ? styles.dropdownItemDisabled : ''}`}
              onSelect={() => !isUploading && imageInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading…' : 'Image'}
            </DropdownMenu.Item>
            <DropdownMenu.Item className={styles.dropdownItem} onSelect={insertYouTube}>
              YouTube Video
            </DropdownMenu.Item>
            <DropdownMenu.Item className={styles.dropdownItem} onSelect={insertTweet}>
              X (Tweet)
            </DropdownMenu.Item>
            {enableFootnotes && (
              <DropdownMenu.Item className={styles.dropdownItem} onSelect={openFootnoteDialog}>
                Footnote
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Footnote insert dialog */}
      <FootnoteDialog
        open={footnoteDialogOpen}
        onOpenChange={setFootnoteDialogOpen}
        initialTitle=""
        initialBody=""
        onSave={handleInsertFootnoteSave}
        mode="insert"
      />

    </div>
  );
}

// ─── LexicalEditor ────────────────────────────────────────────────────────────

export default function LexicalEditor({ initialValue = '', onChange, enableFootnotes = true }) {
  const containerRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState(null); // null = use CSS default
  const resizeCleanupRef = useRef(null);

  // Cancel any active drag if the editor unmounts mid-drag
  useEffect(() => () => resizeCleanupRef.current?.(), []);

  const handleResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = containerRef.current?.getBoundingClientRect().height ?? 400;

    const onMouseMove = (moveEvent) => {
      const newHeight = Math.max(200, startHeight + (moveEvent.clientY - startY));
      setEditorHeight(newHeight);
    };

    const cleanup = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', cleanup);
      resizeCleanupRef.current = null;
    };

    resizeCleanupRef.current = cleanup;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', cleanup);
  }, []);

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
      hr: styles.horizontalRule,
    },
    nodes: [
      HeadingNode, QuoteNode, CodeNode, CodeHighlightNode,
      LinkNode, AutoLinkNode, ListNode, ListItemNode,
      TableNode, TableCellNode, TableRowNode,
      ImageNode,
      HorizontalRuleNode,
      YouTubeNode,
      TweetNode,
      FootnoteNode,
    ],
    onError: (error) => console.error('Lexical error:', error),
  };

  const handleChange = useCallback(
    (editorState) => {
      editorState.read(() => {
        if (onChange) onChange(JSON.stringify(editorState.toJSON()));
      });
    },
    [onChange],
  );

  return (
    <div
      ref={containerRef}
      className={styles.editorContainer}
      style={editorHeight ? { height: editorHeight } : undefined}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin enableFootnotes={enableFootnotes} />
        <div className={styles.editorWrapper}>
          <RichTextPlugin
            contentEditable={<ContentEditable className={styles.contentEditable} />}
            placeholder={<div className={styles.placeholder}>Start writing your blog post…</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <TablePlugin />
          <CheckListPlugin />
          <TabIndentationPlugin />
          <OnChangePlugin onChange={handleChange} />
          <ImagePlugin />
          <HorizontalRulePlugin />
          <YouTubePlugin />
          <TweetPlugin />
        </div>
      </LexicalComposer>
      <div className={styles.resizeHandle} onMouseDown={handleResizeMouseDown}>
        <span className={styles.resizeGrip} />
      </div>
    </div>
  );
}
