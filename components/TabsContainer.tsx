// components/TabsContainer.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import PropertyTab from './Tabs/PropertyTab';
import RestaurantTab from './Tabs/RestaurantTab';
import TransitTab from './Tabs/TransitTab';
import MarketTab from './Tabs/MarketTab';

const TabsContainer = () => {
    const { activeTab, setActiveTab } = useChatContext();

    return (
        <div className="max-h-72 overflow-y-auto space-y-2 pr-2 animate-fadeIn">
            <div className="flex border-b border-slate-200 mb-4">
                <button
                    data-tab="properties"
                    onClick={() => setActiveTab('properties')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'properties'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    🏠 Properties
                </button>
                <button
                    data-tab="restaurants"
                    onClick={() => setActiveTab('restaurants')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'restaurants'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    🍽️ Restaurants
                </button>
                <button
                    data-tab="transit"
                    onClick={() => setActiveTab('transit')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'transit'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    🚇 Transit
                </button>
                <button
                    data-tab="market"
                    onClick={() => setActiveTab('market')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'market'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    📊 Market
                </button>
            </div>
            
            {activeTab === 'properties' && <PropertyTab />}
            {activeTab === 'restaurants' && <RestaurantTab />}
            {activeTab === 'transit' && <TransitTab />}
            {activeTab === 'market' && <MarketTab />}
        </div>
    );
};

export default TabsContainer;