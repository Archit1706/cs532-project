// Properly fixed MessageBubble.tsx with correct ReactMarkdown props
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
    
    // Add event listeners to links after component mounts
    useEffect(() => {
        if (messageRef.current && message.type === 'bot') {
            // Find all links in the message
            const allLinks = messageRef.current.querySelectorAll('a');
            
            // Add click event to all links
            allLinks.forEach((link, index) => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
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
                        
                        if (href && href.startsWith('#')) {
                            const sectionId = href.substring(1);
                            
                            const section = document.getElementById(sectionId);
                            if (section) {
                                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }
                    }
                });
            });
        }
    }, [message, handleUILink]);

    // Custom renderer for markdown content
    const renderMarkdownContent = () => {
        // If it's a bot message with HTML content, preserve the HTML
        if (message.type === 'bot' && (message.content.includes('<a') || message.content.includes('<br>') || message.content.includes('<div'))) {
            return (
                <div 
                    className="markdown"
                    dangerouslySetInnerHTML={{ __html: message.content }}
                />
            );
        }
        
        // Otherwise, parse as markdown
        return (
            <div className="markdown">
                <ReactMarkdown
                    components={{
                        h1: ({children, ...props}) => <h1 className="text-xl font-bold my-2" {...props}>{children}</h1>,
                        h2: ({children, ...props}) => <h2 className="text-lg font-bold my-2" {...props}>{children}</h2>,
                        h3: ({children, ...props}) => <h3 className="text-md font-bold my-1" {...props}>{children}</h3>,
                        h4: ({children, ...props}) => <h4 className="font-bold my-1" {...props}>{children}</h4>,
                        ul: ({children, ...props}) => <ul className="list-disc ml-6 my-2" {...props}>{children}</ul>,
                        ol: ({children, ...props}) => <ol className="list-decimal ml-6 my-2" {...props}>{children}</ol>,
                        li: ({children, ...props}) => <li className="my-1" {...props}>{children}</li>,
                        p: ({children, ...props}) => <p className="my-2" {...props}>{children}</p>,
                        a: ({href, children, ...props}) => (
                            <a 
                                href={href} 
                                className="text-teal-600 hover:text-teal-800 underline"
                                onClick={(e) => e.preventDefault()}
                                {...props}
                            >
                                {children}
                            </a>
                        ),
                        code: ({children, className, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return props.node?.properties?.inline ? (
                                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                    {children}
                                </code>
                            ) : (
                                <pre className="bg-gray-100 p-2 rounded my-2 overflow-x-auto">
                                    <code className={className ? className : 'text-sm font-mono'} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            );
                        },
                        blockquote: ({children, ...props}) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-700" {...props}>
                                {children}
                            </blockquote>
                        ),
                        strong: ({children, ...props}) => <strong className="font-bold" {...props}>{children}</strong>,
                        em: ({children, ...props}) => <em className="italic" {...props}>{children}</em>,
                    }}
                >
                    {message.content}
                </ReactMarkdown>
            </div>
        );
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
                {renderMarkdownContent()}
            </div>
        </div>
    );
};

export default MessageBubble;