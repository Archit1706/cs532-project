// components/MessageBubble.tsx with extensive debugging
"use client";

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from 'types/chat';
import { useChatContext } from '../context/ChatContext';

interface Props {
    message: Message;
}

const MessageBubble: React.FC<Props> = ({ message }) => {
    const { handleUILink } = useChatContext();
    const messageRef = useRef<HTMLDivElement>(null);
    
    // Debug the initial message content
    useEffect(() => {
        if (message.type === 'bot') {
            console.log('Original message content:', message.content);
            console.log('Contains market link?', message.content.includes('market'));
            console.log('Contains a tags?', message.content.includes('<a'));
            console.log('Contains data-ui-link?', message.content.includes('data-ui-link'));
        }
    }, [message.content, message.type]);
    
    // Add event listeners to links after component mounts
    useEffect(() => {
        if (messageRef.current && message.type === 'bot') {
            // Find all links in the message
            const allLinks = messageRef.current.querySelectorAll('a');
            console.log('All links found:', allLinks.length);
            
            // Log details of all links
            allLinks.forEach((link, index) => {
                console.log(`Link ${index}:`, {
                    href: link.getAttribute('href'),
                    text: link.textContent,
                    hasDataAttr: link.hasAttribute('data-ui-link'),
                    dataValue: link.getAttribute('data-ui-link'),
                    classList: Array.from(link.classList),
                    outerHTML: link.outerHTML,
                });
                
                // Add click event to all links
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log(`Link ${index} clicked`);
                    
                    // If it has data-ui-link attribute, use the link handler
                    if (link.hasAttribute('data-ui-link')) {
                        const linkType = link.getAttribute('data-ui-link');
                        let data = null;
                        
                        // For property links
                        if (linkType === 'propertyDetail') {
                            const zpid = link.getAttribute('data-zpid');
                            if (zpid) {
                                data = { zpid };
                            }
                        }
                        
                        // Call the handler
                        console.log('Calling handleUILink with:', { type: linkType, text: link.textContent });
                        handleUILink({
                            type: linkType as any,
                            label: link.textContent || 'View',
                            data
                        });
                        
                        // Add visual feedback
                        link.style.backgroundColor = '#bae6fd';
                        link.style.color = '#0369a1';
                    } else {
                        // Handle regular href links
                        const href = link.getAttribute('href');
                        console.log('Regular link href:', href);
                        
                        if (href && href.startsWith('#')) {
                            const sectionId = href.substring(1);
                            console.log('Section ID from href:', sectionId);
                            
                            const section = document.getElementById(sectionId);
                            if (section) {
                                console.log(`Scrolling to section: ${sectionId}`);
                                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else {
                                console.log(`Section not found: ${sectionId}`);
                            }
                        }
                    }
                });
            });
        }
    }, [message, handleUILink]);

    return (
        <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
                ref={messageRef}
                className={`max-w-[80%] p-4 rounded-2xl ${message.type === 'user'
                    ? 'bg-teal-700 text-white rounded-tr-none'
                    : 'bg-gray-50 text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                dangerouslySetInnerHTML={{ __html: message.content }}
            />
        </div>
    );
};

export default MessageBubble;