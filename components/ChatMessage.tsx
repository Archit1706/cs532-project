// components/ChatMessage.tsx
import React, { useEffect, useRef } from 'react';
import { Message } from 'types/chat';
import { useChatContext } from 'context/ChatContext';
import ReactMarkdown from 'react-markdown';
import { FaUser, FaRobot } from 'react-icons/fa';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { handleUILink } = useChatContext();
  const messageRef = useRef<HTMLDivElement>(null);

  // Process the message content and attach UI link handlers
  useEffect(() => {
    if (!messageRef.current) return;

    // Find all UI link elements in the message
    const linkElements = messageRef.current.querySelectorAll('[data-ui-link]');
    
    // Add click handlers to each link
    linkElements.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const linkType = link.getAttribute('data-ui-link');
        const zpid = link.getAttribute('data-zpid');
        
        if (linkType) {
          console.log(`UI link clicked: ${linkType}, zpid: ${zpid}`);
          handleUILink({ 
            type: linkType as any, 
            label: link.textContent || linkType,
            data: zpid ? { zpid } : undefined
          });
        }
      });
    });
    
    // Cleanup function to remove event listeners
    return () => {
      if (!messageRef.current) return;
      const linkElements = messageRef.current.querySelectorAll('[data-ui-link]');
      linkElements.forEach(link => {
        link.removeEventListener('click', () => {});
      });
    };
  }, [message.content, handleUILink]);

  // Check if the message content is already processed (has HTML)
  const isProcessedContent = message.content.includes('<a ') || 
                             message.content.includes('<h') || 
                             message.content.includes('<strong>');

  // Determine the appropriate rendering method
  const renderContent = () => {
    if (isProcessedContent) {
      // If content has HTML, render it directly
      return (
        <div 
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: message.content }}
        />
      );
    } else if (message.content.includes('[[')) {
      // If content has link markers but no HTML, try to render with processed links
      // This is a fallback mechanism
      console.log("Content has link markers but no HTML, processing...");
      const { createLinkableContent } = useChatContext();
      const processedContent = createLinkableContent(message.content);
      
      return (
        <div 
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      );
    } else {
      // For plain text content, use simple rendering
      return (
        <div className="prose prose-slate max-w-none">
          {message.content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      );
    }
  };

  return (
    <div 
      ref={messageRef}
      className={`p-4 rounded-lg mb-4 ${
        message.type === 'user' 
          ? 'bg-blue-50 mr-12 self-end' 
          : 'bg-slate-50 ml-12'
      }`}
    >
      <div className="flex items-start">
        <div className="mr-3 mt-1">
          {message.type === 'user' ? (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <FaUser />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white">
              <FaRobot />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="font-semibold mb-1">
            {message.type === 'user' ? 'You' : 'REbot'}
          </div>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;