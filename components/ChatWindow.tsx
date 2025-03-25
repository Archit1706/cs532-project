// components/ChatWindow.tsx
"use client";

import React, { useRef } from 'react';
import { useChatContext } from 'context/ChatContext';
import MessageBubble from 'components/MessageBubble';
import MessageInput from 'components/MessageInput';
import LanguageSelector from 'components/LanguageSelector';
import QuickQuestions from 'components/QuickQuestions';

const ChatWindow = () => {
    const { messages, isLoading, isTranslating } = useChatContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    return (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200 flex flex-col h-[600px]">
            <div id="chat-container" className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll">
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

            <LanguageSelector />
            <QuickQuestions />
            <MessageInput messagesEndRef={messagesEndRef} />
        </div>
    );
};

export default ChatWindow;
