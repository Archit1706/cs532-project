// components/MessageBubble.tsx
"use client";

import React, { useEffect, useMemo } from 'react';
import { useChatContext } from '../context/ChatContext';
import { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { handleUILink, createLinkableContent } = useChatContext();

  // Process message content to handle both Markdown and UI links
  const processedContent = useMemo(() => {
    if (!message.content) return '';
    
    let content;
    // If the content has already been processed by the backend (contains HTML),
    // use it directly to avoid double processing
    if (message.content.includes('<a ') || message.content.includes('<p>') || message.content.includes('<strong>')) {
      content = message.content;
    } else {
      // First process any UI links - this converts [[market trends]] to HTML links
      content = createLinkableContent(message.content);
      
      // Then process any remaining Markdown
      content = processMarkdown(content);
    }
    
    return content;
  }, [message.content, createLinkableContent]);

  // Function to convert Markdown to HTML (only for parts not already in HTML)
  function processMarkdown(text: string) {
    if (!text) return '';
    
    // Skip parts that are already HTML
    const htmlSegments: string[] = [];
    const textSegments: string[] = [];
    
    // Split the text into HTML and non-HTML segments
    let isInHtml = false;
    let currentSegment = '';
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '<' && !isInHtml) {
        if (currentSegment) {
          textSegments.push(currentSegment);
          currentSegment = '';
        }
        isInHtml = true;
        currentSegment += text[i];
      } else if (text[i] === '>' && isInHtml) {
        currentSegment += text[i];
        htmlSegments.push(currentSegment);
        currentSegment = '';
        isInHtml = false;
      } else {
        currentSegment += text[i];
      }
    }
    
    // Add the last segment
    if (currentSegment) {
      if (isInHtml) {
        htmlSegments.push(currentSegment);
      } else {
        textSegments.push(currentSegment);
      }
    }
    
    // Process Markdown only in text segments
    const processedTextSegments = textSegments.map(segment => {
      // Bold: **text** -> <strong>text</strong>
      segment = segment.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Italic: *text* -> <em>text</em> (avoiding already processed tags)
      segment = segment.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
      
      // Unordered lists: - item -> <li>item</li>
      const bulletItems = segment.match(/^- .+$/gm);
      if (bulletItems) {
        const listItems = bulletItems.map(item => `<li>${item.substring(2)}</li>`).join('');
        segment = segment.replace(/^- .+$/gm, '') + `<ul class="list-disc pl-5 my-2">${listItems}</ul>`;
      }
      
      // Ordered lists: 1. item -> <li>item</li>
      const numberedItems = segment.match(/^\d+\. .+$/gm);
      if (numberedItems) {
        const listItems = numberedItems.map(item => {
          const textPart = item.replace(/^\d+\.\s+/, '');
          return `<li>${textPart}</li>`;
        }).join('');
        segment = segment.replace(/^\d+\. .+$/gm, '') + `<ol class="list-decimal pl-5 my-2">${listItems}</ol>`;
      }
      
      // Paragraphs (for remaining text)
      if (segment.trim() && !segment.includes('<ul') && !segment.includes('<ol')) {
        // Split by double newlines and wrap each in paragraph tags
        const paragraphs = segment.split(/\n\s*\n/);
        segment = paragraphs.map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('');
      }
      
      return segment;
    });
    
    // Interleave HTML and processed text segments
    let result = '';
    let htmlIndex = 0;
    let textIndex = 0;
    
    while (htmlIndex < htmlSegments.length || textIndex < processedTextSegments.length) {
      if (textIndex < processedTextSegments.length) {
        result += processedTextSegments[textIndex++];
      }
      if (htmlIndex < htmlSegments.length) {
        result += htmlSegments[htmlIndex++];
      }
    }
    
    return result || text; // Fallback to original text if processing failed
  }

  // Set up event handlers for link clicks
  useEffect(() => {
    const messageElement = document.getElementById(`message-${message.id}`);
    if (!messageElement) return;
    
    const links = messageElement.querySelectorAll('a[data-ui-link]');
    
    const handleLinkClick = (e: Event) => {
      e.preventDefault();
      const link = e.currentTarget as HTMLAnchorElement;
      
      handleUILink({
        type: link.getAttribute('data-ui-link'),
        element: link,
        tab: link.getAttribute('data-tab'),
        propertyTab: link.getAttribute('data-property-tab'),
        section: link.getAttribute('data-section'),
        forceTab: link.getAttribute('data-force-tab') === 'true',
        label: link.textContent
      });
    };
    
    links.forEach(link => {
      link.addEventListener('click', handleLinkClick);
    });
    
    return () => {
      links.forEach(link => {
        link.removeEventListener('click', handleLinkClick);
      });
    };
  }, [message.id, handleUILink, processedContent]);

  const isBot = message.type === 'bot';
  
  return (
    <div
      id={`message-${message.id}`}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div 
        className={`max-w-[80%] rounded-2xl p-4 ${
          isBot 
            ? 'bg-white border border-slate-200 rounded-tl-none text-slate-800' 
            : 'bg-teal-600 text-white rounded-tr-none'
        }`}
      >
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      </div>
    </div>
  );
};

export default MessageBubble;