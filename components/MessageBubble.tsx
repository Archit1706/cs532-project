// components/MessageBubble.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from 'types/chat';
import { useChatContext } from '../context/ChatContext';

interface Props {
    message: Message;
}

const MessageBubble: React.FC<Props> = ({ message }) => {
    const { handleUILink } = useChatContext();
    const messageRef = useRef<HTMLDivElement>(null);
    
    // Parse and set up UI link event handlers after the component renders
    useEffect(() => {
        if (messageRef.current && message.type === 'bot') {
            // Find all links with data-ui-link attribute
            const linkElements = messageRef.current.querySelectorAll('a[data-ui-link]');
            console.log('Found UI links:', linkElements.length);
            
            // Add click handlers to each link
            linkElements.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const linkType = link.getAttribute('data-ui-link');
                    console.log('Link clicked:', linkType);
                    
                    // Handle property detail links with zpid data
                    let data = null;
                    if (linkType === 'propertyDetail') {
                        const zpid = link.getAttribute('data-zpid');
                        if (zpid) {
                            data = { zpid };
                        }
                    }
                    
                    if (linkType) {
                        handleUILink({
                            type: linkType as any,
                            label: link.textContent || 'View',
                            data
                        });
                    }
                });
            });
        }
    }, [message, handleUILink]);

    const formatMessageContent = (content: string) => {
        // First check for raw UI component references in format [[component_name]]
        let processedContent = content;
        const uiComponentPatterns = [
            { regex: /\[\[market(?:\s+trends)?\]\]/gi, type: 'market' },
            { regex: /\[\[properties\]\]/gi, type: 'property' },
            { regex: /\[\[restaurants\]\]/gi, type: 'restaurants' },
            { regex: /\[\[transit\]\]/gi, type: 'transit' },
            { regex: /\[\[property\s+market\]\]/gi, type: 'propertyMarket' }
        ];
        
        // Convert any raw UI references to clickable links
        uiComponentPatterns.forEach(pattern => {
            processedContent = processedContent.replace(
                pattern.regex, 
                `<a href="#" class="text-teal-600 hover:text-teal-800 underline bg-teal-50 px-1 rounded" data-ui-link="${pattern.type}">$&</a>`
            );
        });
        
        // If message has markdown formatting, render it
        if (content.includes('#') || content.includes('**') || content.includes('*')) {
            return (
                <div className="markdown">
                    <ReactMarkdown>
                        {processedContent}
                    </ReactMarkdown>
                </div>
            );
        }

        // If message contains HTML (from processed UI links), render it as HTML
        if (processedContent.includes('<a href') || processedContent.includes('data-ui-link')) {
            return (
                <div dangerouslySetInnerHTML={{ __html: processedContent }} />
            );
        }

        // Default text rendering with newlines
        return processedContent.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                {i < processedContent.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    return (
        <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
                ref={messageRef}
                className={`max-w-[80%] p-4 rounded-2xl ${message.type === 'user'
                    ? 'bg-teal-700 text-white rounded-tr-none'
                    : 'bg-gray-50 text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
            >
                {formatMessageContent(message.content)}
            </div>
        </div>
    );
};

export default MessageBubble;