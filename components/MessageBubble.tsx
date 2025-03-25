// components/MessageBubble.tsx
"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from 'types/chat';

interface Props {
    message: Message;
}

const MessageBubble: React.FC<Props> = ({ message }) => {
    const formatMessageContent = (content: string) => {
        if (content.includes('#') || content.includes('**') || content.includes('*')) {
            return (
                <div className="markdown">
                    <ReactMarkdown>
                        {content}
                    </ReactMarkdown>
                </div>
            );
        }

        return content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                {i < content.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    return (
        <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] p-4 rounded-2xl ${message.type === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white/95 text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
            >
                {formatMessageContent(message.content)}
            </div>
        </div>
    );
};

export default MessageBubble;