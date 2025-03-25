// components/layout/InfoPanel.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import PropertyDetailCard from '../PropertyDetailCard';
import WelcomeCard from '../WelcomeCard';
import TabsHeader from '../TabsHeader';
import TabsContainer from '../TabsContainer';

const InfoPanel = () => {
    const { selectedProperty, setSelectedProperty, locationData } = useChatContext();

    return (
        <div className="w-3/5 space-y-4">
            {selectedProperty ? (
                <PropertyDetailCard property={selectedProperty} onClose={() => setSelectedProperty(null)} />
            ) : locationData ? (
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200 animate-fadeIn">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">
                        Area Information: {locationData.zipCode}
                    </h2>
                    <TabsHeader />
                    <TabsContainer />
                </div>
            ) : (
                <WelcomeCard />
            )}
        </div>
    );
};

export default InfoPanel;
