"use client";

import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatProvider, useChatContext } from 'context/ChatContext';
import ChatPanel from 'components/layout/ChatPanel';
import InfoPanel from 'components/layout/InfoPanel';
import Sidebar from 'components/layout/Sidebar';
import TopHeader from 'components/layout/TopHeader';
import { Property } from '@/types/chat';
import AgentMessagingDebugger from '../../components/AgentMessagingDebugger';

const ChatPageContent = () => {
    const { properties, setSelectedProperty, setIsPropertyChat, setPropertyDetails, loadPropertyChat, locationData } = useChatContext();
    const searchParams = useSearchParams();
    const propertyId = searchParams.get("propertyId");

    useEffect(() => {
        if (propertyId && properties.length > 0) {
            const selected = properties.find((p: Property) => p.id === propertyId);
            if (selected) setSelectedProperty(selected);
        }
    }, [propertyId, properties, setSelectedProperty]);

    useEffect(() => {
        if (propertyId) {
            loadPropertyChat(propertyId);
        }
    }, [propertyId]);


    useEffect(() => {
        console.log('Location Data:', locationData);
    }
        , []);
    return (
        <div className="flex h-screen bg-emerald-50 overflow-hidden">
            <Sidebar />

            <main className="flex flex-col flex-1 overflow-hidden">
                <TopHeader />

                <div className="flex flex-1 overflow-hidden m-4 gap-4 ">
                    <ChatPanel />
                    <InfoPanel />
                </div>
                <AgentMessagingDebugger />
            </main>
        </div>
    );
};

const ChatPage = () => (
    <ChatProvider>
        <Suspense fallback={<div>Loading...</div>}>
            <ChatPageContent />
        </Suspense>
    </ChatProvider>
);

export default ChatPage;
