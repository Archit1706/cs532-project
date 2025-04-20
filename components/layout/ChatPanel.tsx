// components/layout/ChatPanel.tsx
"use client";

import React, { useEffect } from 'react';
import MessageBubble from '../MessageBubble';
import MessageInput from '../MessageInput';
import QuickQuestions from '../QuickQuestions';
import UIContextDebugger from '../UIContextDebugger';
import { useChatContext } from 'context/ChatContext';

const ChatPanel = () => {
    const {
        messages,
        isLoading,
        isTranslating,
        messagesEndRef,
        selectedProperty,
        isPropertyChat,
        propertyDetails,
    } = useChatContext();

    // Auto-scroll to bottom whenever messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div className="w-1/2 flex flex-col h-full bg-white rounded-2xl shadow-emerald-900 shadow-xl relative">
            {/* Add the UI Context Debugger */}
            <UIContextDebugger />
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 rounded-2xl" id="chat-container">
                {isPropertyChat && propertyDetails?.basic_info?.address?.full && (
                    <div className="mb-4 p-4 bg-teal-100 border border-teal-300 rounded-md text-teal-800 font-semibold">
                        You are chatting about: {propertyDetails?.basic_info?.address?.full}
                    </div>
                )}
                {messages.map((message: any) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white/95 border border-slate-200 p-4 rounded-2xl rounded-tl-none">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}

                {isTranslating && (
                    <div className="text-center text-sm text-slate-500 mt-2">
                        <div className="inline-flex items-center">
                            <span>Translating</span>
                            <span className="ml-1 flex space-x-1">
                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 py-3">
                <QuickQuestions />
            </div>

            <div className="px-4 py-3">
                <MessageInput messagesEndRef={messagesEndRef} />
            </div>
        </div>
    );
};

export default ChatPanel;