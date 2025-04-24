// components/MessageBubble.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from 'types/chat';
import { useChatContext } from '../context/ChatContext';
import { SECTION_IDS } from '../context/ChatContext'; // Import section IDs

interface Props {
    message: Message;
}

const MessageBubble: React.FC<Props> = ({ message }) => {
    const { handleUILink } = useChatContext();
    const messageRef = useRef<HTMLDivElement>(null);
    const [content, setContent] = useState(message.content);
    
    // Process content immediately to ensure links are in the initial render
    useEffect(() => {
        const processedContent = formatMessageContentString(message.content);
        setContent(processedContent);
    }, [message.content]);
    
    // Set up event handlers after render
    useEffect(() => {
        if (messageRef.current && message.type === 'bot') {
            // Find all links with data-ui-link attribute
            const linkElements = messageRef.current.querySelectorAll('a[data-ui-link]');
            console.log('Found UI links:', linkElements.length);
            
            // Handle both UI component links and section links
            linkElements.forEach(link => {
                // Log details about the link
                console.log('Link found:', {
                    text: link.textContent,
                    type: link.getAttribute('data-ui-link'),
                    href: link.getAttribute('href'),
                });
                
                // Remove any existing click handlers to prevent duplicates
                const newLink = link.cloneNode(true) as HTMLElement;
                if (link.parentNode) {
                    link.parentNode.replaceChild(newLink, link);
                }
                
                newLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Type assertion to HTMLElement to avoid TypeScript errors
                    const linkEl = newLink as HTMLElement;
                    const linkType = linkEl.getAttribute('data-ui-link');
                    const href = linkEl.getAttribute('href');
                    
                    console.log('Link clicked:', linkType, href);
                    
                    // Handle section links vs. UI component links
                    if (href && href.startsWith('#') && Object.values(SECTION_IDS).includes(href.substring(1))) {
                        // This is a section link
                        handleUILink({
                            type: linkType as any,
                            label: linkEl.textContent || 'View',
                            data: { sectionId: href.substring(1) }
                        });
                    } else {
                        // Handle property detail links with zpid data
                        let data = null;
                        if (linkType === 'propertyDetail') {
                            const zpid = linkEl.getAttribute('data-zpid');
                            if (zpid) {
                                data = { zpid };
                            }
                        }
                        
                        if (linkType) {
                            // Add a visual feedback that the link was clicked
                            linkEl.style.backgroundColor = '#bae6fd';
                            linkEl.style.color = '#0369a1';
                            
                            // Call the handler
                            handleUILink({
                                type: linkType as any,
                                label: linkEl.textContent || 'View',
                                data
                            });
                        }
                    }
                });
            });
            
            // Also handle regular anchor links for section navigation
            const sectionLinks = messageRef.current.querySelectorAll('a[href^="#"]');
            sectionLinks.forEach(link => {
                if (!link.hasAttribute('data-ui-link')) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const href = link.getAttribute('href');
                        if (href) {
                            const sectionId = href.substring(1);
                            const section = document.getElementById(sectionId);
                            if (section) {
                                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }
                    });
                }
            });
        }
    }, [message, handleUILink, content]);

    // Function to process the text content and add UI links
    const formatMessageContentString = (contentStr: string): string => {
        // Process raw UI component references in format [[component_name]]
        let processedContent = contentStr;
        const uiComponentPatterns = [
            { 
                regex: /\[\[market(?:\s+trends)?\]\]/gi, 
                replacement: `<a href="#${SECTION_IDS.MARKET}" class="text-teal-600 hover:text-teal-800 underline bg-teal-50 px-1 rounded" data-ui-link="market">market trends</a>` 
            },
            { 
                regex: /\[\[properties\]\]/gi, 
                replacement: `<a href="#${SECTION_IDS.PROPERTIES}" class="text-teal-600 hover:text-teal-800 underline bg-teal-50 px-1 rounded" data-ui-link="property">properties</a>` 
            },
            { 
                regex: /\[\[restaurants\]\]|\[\[local\s+amenities\]\]/gi, 
                replacement: `<a href="#${SECTION_IDS.AMENITIES}" class="text-teal-600 hover:text-teal-800 underline bg-teal-50 px-1 rounded" data-ui-link="restaurants">local amenities</a>` 
            },
            { 
                regex: /\[\[transit\]\]/gi, 
                replacement: `<a href="#${SECTION_IDS.TRANSIT}" class="text-teal-600 hover:text-teal-800 underline bg-teal-50 px-1 rounded" data-ui-link="transit">transit options</a>` 
            },
            { 
                regex: /\[\[property\s+market\]\]/gi, 
                replacement: '<a href="#" class="text-teal-600 hover:text-teal-800 underline bg-teal-50 px-1 rounded" data-ui-link="propertyMarket">property market analysis</a>' 
            }
        ];
        
        // Convert any raw UI references to clickable links
        uiComponentPatterns.forEach(pattern => {
            processedContent = processedContent.replace(pattern.regex, pattern.replacement);
        });
        
        return processedContent;
    };

    const renderContent = () => {
        // If message has markdown formatting
        if (message.content.includes('#') || message.content.includes('**') || message.content.includes('*')) {
            return (
                <div className="markdown">
                    <ReactMarkdown>
                        {message.content}
                    </ReactMarkdown>
                </div>
            );
        }

        // For content with HTML (our processed links)
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
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
                {renderContent()}
            </div>
        </div>
    );
};

export default MessageBubble;