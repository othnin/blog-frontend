'use client';

import { useEffect, useState } from 'react';
import styles from './LexicalRenderer.module.css';

export default function LexicalRenderer({ jsonContent }) {
  const [parsedContent, setParsedContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (typeof jsonContent === 'string') {
        setParsedContent(JSON.parse(jsonContent));
      } else {
        setParsedContent(jsonContent);
      }
    } catch (err) {
      console.error('Error parsing Lexical content:', err);
      setError('Unable to parse content');
    }
  }, [jsonContent]);

  const renderNode = (node, index) => {
    if (!node) return null;

    switch (node.type) {
      case 'root':
        return (
          <div key={index} className={styles.root}>
            {node.children?.map((child, idx) => renderNode(child, idx))}
          </div>
        );

      case 'paragraph':
        return (
          <p key={index} className={styles.paragraph}>
            {node.children?.map((child, idx) => renderNode(child, idx))}
          </p>
        );

      case 'text':
        let textElement = (
          <span key={index} className={styles.text}>
            {node.text}
          </span>
        );

        // Apply formatting
        if (node.format) {
          const formats = node.format;
          if (formats & 1) {
            // Bold
            textElement = <strong key={index}>{textElement}</strong>;
          }
          if (formats & 2) {
            // Italic
            textElement = <em key={index}>{textElement}</em>;
          }
          if (formats & 4) {
            // Strikethrough
            textElement = <del key={index}>{textElement}</del>;
          }
          if (formats & 8) {
            // Underline
            textElement = <u key={index}>{textElement}</u>;
          }
        }

        return textElement;

      case 'heading':
        const HeadingTag = `h${node.tag || 1}`;
        return (
          <HeadingTag key={index} className={styles[`heading${node.tag || 1}`]}>
            {node.children?.map((child, idx) => renderNode(child, idx))}
          </HeadingTag>
        );

      case 'list':
        const ListTag = node.listType === 'ordered' ? 'ol' : 'ul';
        return (
          <ListTag
            key={index}
            className={
              node.listType === 'ordered' ? styles.orderedList : styles.unorderedList
            }
          >
            {node.children?.map((child, idx) => renderNode(child, idx))}
          </ListTag>
        );

      case 'listitem':
        return (
          <li key={index} className={styles.listItem}>
            {node.children?.map((child, idx) => renderNode(child, idx))}
          </li>
        );

      case 'quote':
        return (
          <blockquote key={index} className={styles.blockquote}>
            {node.children?.map((child, idx) => renderNode(child, idx))}
          </blockquote>
        );

      case 'code':
        return (
          <pre key={index} className={styles.codeBlock}>
            <code>{node.children?.map((child, idx) => renderNode(child, idx))}</code>
          </pre>
        );

      case 'link':
        return (
          <a
            key={index}
            href={node.url}
            target={node.target}
            rel="noopener noreferrer"
            className={styles.link}
          >
            {node.children?.map((child, idx) => renderNode(child, idx))}
          </a>
        );

      default:
        return node.children?.map((child, idx) => renderNode(child, idx));
    }
  };

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!parsedContent) {
    return <div className={styles.loading}>Loading content...</div>;
  }

  const rootNode = parsedContent.root ?? parsedContent;
  return <div className={styles.renderer}>{renderNode(rootNode, 0)}</div>;
}
