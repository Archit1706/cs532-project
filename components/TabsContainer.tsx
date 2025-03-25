// components/TabsContainer.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import PropertyTab from './Tabs/PropertyTab';
import RestaurantTab from './Tabs/RestaurantTab';
import TransitTab from './Tabs/TransitTab';
import MarketTab from './Tabs/MarketTab';

const TabsContainer = () => {
    const { activeTab } = useChatContext();

    if (!activeTab) return null;

    return (
        <div className="max-h-72 overflow-y-auto space-y-2 pr-2 animate-fadeIn">
            {activeTab === 'properties' && <PropertyTab />}
            {activeTab === 'restaurants' && <RestaurantTab />}
            {activeTab === 'transit' && <TransitTab />}
            {activeTab === 'market' && <MarketTab />}
        </div>
    );
};

export default TabsContainer;
