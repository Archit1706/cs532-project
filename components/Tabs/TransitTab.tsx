// components/tabs/TransitTab.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import { MdDirections } from 'react-icons/md';

const TransitTab = () => {
    const { locationData } = useChatContext();

    if (!locationData || locationData.transit.length === 0) {
        return <div className="text-slate-100 text-sm p-2">No transit stations found nearby.</div>;
    }

    return (
        <div className="overflow-x-auto bg-teal-50 shadow-md shadow-teal-200 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 p-2">
            <div className="grid grid-flow-col grid-rows-2 gap-4 min-w-max">
                {locationData.transit.slice(0, 10).map((station: any, index: number) => (
                    <div
                        key={index}
                        className="w-64 p-3 bg-white rounded-lg border border-slate-200 flex-shrink-0"
                    >
                        <div className="flex items-center justify-between">
                            <div className="font-medium text-slate-800">{station.title}</div>
                            {station.directions && (
                                <a
                                    href={station.directions}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-teal-600 hover:text-teal-800"
                                    title="Open directions in Google Maps"
                                >
                                    <MdDirections className="inline-block h-8 w-8 font-bold" />
                                </a>
                            )}
                        </div>
                        <div className="text-sm text-slate-700">{station.address}</div>
                        {station.distance && (
                            <div className="text-sm text-slate-700 mt-1">
                                {station.distance.toFixed(2)} miles away
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransitTab;
