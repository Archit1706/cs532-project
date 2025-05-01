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

  // Process message content to handle Markdown and UI links
  const processedContent = useMemo(() => {
    if (!message.content) return '';
    
    // First process any UI links
    let content = createLinkableContent(message.content);
    
    // Then process Markdown formatting
    content = processMarkdown(content);
    
    return content;
  }, [message.content, createLinkableContent]);

  // Function to convert basic Markdown to HTML
  function processMarkdown(text: string) {
    // Preserve [[links]] first
    const linkPlaceholders: string[] = [];
    const placeholderText = text.replace(/\[\[(.*?)\]\]/g, (_, match) => {
      linkPlaceholders.push(match);
      return `@@LINK_${linkPlaceholders.length - 1}@@`;
    });
  
    let html = placeholderText;
  
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
    // Italic
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  
    // Normalize line endings
    html = html.replace(/\r\n/g, '\n');
  
    // Group bullet lines into UL
    html = html.replace(/(?:^|\n)([-*] .+?)(?=\n[^-* ]|$)/g, (match) => {
      const items = match.trim().split('\n').map(line => line.replace(/^[-*] (.+)/, '<li>$1</li>')).join('');
      return `<ul class="list-disc pl-5 my-2">${items}</ul>`;
    });
  
    // Group numbered lines into OL
    html = html.replace(/(?:^|\n)(\d+\. .+?)(?=\n[^0-9.]|$)/g, (match) => {
      const items = match.trim().split('\n').map(line => line.replace(/^\d+\. (.+)/, '<li>$1</li>')).join('');
      return `<ol class="list-decimal pl-5 my-2">${items}</ol>`;
    });
  
    // Convert plain lines to <p> unless they are already block elements
    html = html.replace(/(?:^|\n)(?!<\/?(ul|ol|li|p|strong|em|a)\b)(.+)/g, (match, _, content) => {
      if (!content.trim()) return '';
      return `<p>${content.trim()}</p>`;
    });
  
    // Clean up multiple <p> inside list
    html = html.replace(/<\/(ul|ol)>\s*<p>/g, '</$1><p>');
    html = html.replace(/<\/li>\s*<p>/g, '</li><p>');
  
    // Restore [[links]]
    html = html.replace(/@@LINK_(\d+)@@/g, (_, i) => `[[${linkPlaceholders[+i]}]]`);
  
    return html;
  }
  
  // Add event listeners for UI links after component mounts
  useEffect(() => {
    const messageElement = document.getElementById(`message-${message.id}`);
    if (!messageElement) return;

    const links = messageElement.querySelectorAll('a[data-ui-link]');
    
    const handleLinkClick = (e: Event) => {
      e.preventDefault();
      const link = e.currentTarget as HTMLAnchorElement;
      
      // Extract link data attributes
      const linkType = link.getAttribute('data-ui-link');
      const tab = link.getAttribute('data-tab');
      const propertyTab = link.getAttribute('data-property-tab');
      const section = link.getAttribute('data-section');
      const forceTab = link.getAttribute('data-force-tab') === 'true';
      
      handleUILink({
        type: linkType,
        element: link,
        tab,
        propertyTab,
        section,
        forceTab
      });
    };
    
    // Add click event listeners to all links
    links.forEach(link => {
      link.addEventListener('click', handleLinkClick);
    });
    
    // Cleanup on unmount
    return () => {
      links.forEach(link => {
        link.removeEventListener('click', handleLinkClick);
      });
    };
  }, [message.id, handleUILink, processedContent]);

  // Determine message position and styling
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