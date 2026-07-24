'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './LexicalRenderer.module.css';
import { useResolvedImageUrl } from '@/hooks/useResolvedImageUrl';

function BlogImage({ filename, alt, width }) {
  const { src, loading } = useResolvedImageUrl(filename);

  if (loading) {
    return <div className={styles.imagePlaceholder}>Loading image...</div>;
  }

  if (!src) {
    return <div className={styles.imagePlaceholder}>Failed to load image</div>;
  }

  const imgStyle = width ? { width: `${width}px`, height: 'auto', maxWidth: '100%' } : {};
  return <img src={src} alt={alt || ''} className={styles.rendererImage} style={imgStyle} loading="lazy" />;
}

function TweetEmbed({ tweetUrl }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const render = () => {
      if (window.twttr?.widgets) window.twttr.widgets.load(containerRef.current);
    };
    if (window.twttr) {
      render();
    } else {
      const existing = document.getElementById('twitter-widget-js');
      if (existing) {
        existing.addEventListener('load', render, { once: true });
      } else {
        const script = document.createElement('script');
        script.id = 'twitter-widget-js';
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = render;
        document.head.appendChild(script);
      }
    }
  }, [tweetUrl]);

  return (
    <div ref={containerRef} className={styles.tweetWrapper}>
      <blockquote className="twitter-tweet">
        <a href={tweetUrl}>{tweetUrl}</a>
      </blockquote>
    </div>
  );
}

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

      case 'image':
        return (
          <BlogImage
            key={index}
            filename={node.src}
            alt={node.altText || ''}
            width={node.width}
          />
        );

      case 'horizontalrule':
        return <hr key={index} className={styles.horizontalRule} />;

      case 'youtube':
        return (
          <div
            key={index}
            className={styles.youtubeWrapper}
            style={node.width ? { width: `${node.width}px`, maxWidth: '100%' } : {}}
          >
            <iframe
              src={`https://www.youtube.com/embed/${node.videoId}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.youtubeIframe}
            />
          </div>
        );

      case 'tweet':
        return <TweetEmbed key={index} tweetUrl={node.tweetUrl} />;

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
