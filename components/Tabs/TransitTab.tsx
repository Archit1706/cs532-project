// components/tabs/TransitTab.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';

const TransitTab = () => {
    const { locationData } = useChatContext();

    if (!locationData || locationData.transit.length === 0) {
        return <div className="text-slate-700 text-sm p-2">No transit stations found nearby.</div>;
    }

    return (
        <div className="space-y-2 pr-2 bg-teal-50 shadow-md shadow-teal-200 animate-fadeIn scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 scroll-auto">
            {locationData.transit.slice(0, 5).map((station: any, index: any) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-medium text-slate-800">{station.title}</div>
                    <div className="text-sm text-slate-700">{station.address}</div>
                    {station.distance && (
                        <div className="text-sm text-slate-700 mt-1">
                            {station.distance.toFixed(1)} miles away
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TransitTab;
