// components/TabsHeader.tsx
"use client";

import React from 'react';
import { useChatContext } from '../context/ChatContext';

const TabsHeader = () => {
    const { activeTab, setActiveTab, locationData, properties } = useChatContext();

    return (
        <div className="flex border-b border-slate-200 mb-4">
            <button
                onClick={() => setActiveTab(activeTab === 'properties' ? null : 'properties')}
                className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'properties'
                    ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
            >
                🏠 Properties
                <span className="ml-2 bg-slate-200 px-2 py-1 rounded-full text-xs">
                    {properties.length}
                </span>
            </button>
            <button
                onClick={() => setActiveTab(activeTab === 'restaurants' ? null : 'restaurants')}
                className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'restaurants'
                    ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
            >
                🍽️ Restaurants
                <span className="ml-2 bg-slate-200 px-2 py-1 rounded-full text-xs">
                    {locationData?.restaurants?.length || 0}
                </span>
            </button>
            <button
                onClick={() => setActiveTab(activeTab === 'transit' ? null : 'transit')}
                className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'transit'
                    ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
            >
                🚇 Transit
                <span className="ml-2 bg-slate-200 px-2 py-1 rounded-full text-xs">
                    {locationData?.transit?.length || 0}
                </span>
            </button>
            <button
                onClick={() => setActiveTab(activeTab === 'market' ? null : 'market')}
                className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'market'
                    ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
            >
                📊 Market
            </button>
        </div>
    );
};

export default TabsHeader;
