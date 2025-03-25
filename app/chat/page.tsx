// app/chat/page.tsx
"use client";

import React, { useEffect } from 'react';
import { ChatProvider, useChatContext } from 'context/ChatContext';
import ChatPanel from 'components/layout/ChatPanel';
import InfoPanel from 'components/layout/InfoPanel';

const ChatContent = () => {
    const { messages, messagesEndRef, setBackendStatus } = useChatContext();

    useEffect(() => {
        const checkBackendStatus = async () => {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();

                if (data.backend === 'connected') {
                    console.log('Backend connected:', data);
                    setBackendStatus('connected');
                } else {
                    console.error('Backend connection issue:', data);
                    setBackendStatus('error');
                }
            } catch (error) {
                console.error('Health check error:', error);
                setBackendStatus('error');
            }
        };

        checkBackendStatus();
    }, [setBackendStatus]);

    useEffect(() => {
        if (messagesEndRef.current) {
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }
    }, [messages, messagesEndRef]);

    return (
        <div className="container mx-auto p-6 flex gap-6">
            <ChatPanel />
            <InfoPanel />
        </div>
    );
};

const ChatPage = () => {
    return (
        <ChatProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <ChatContent />
            </div>
        </ChatProvider>
    );
};

export default ChatPage;