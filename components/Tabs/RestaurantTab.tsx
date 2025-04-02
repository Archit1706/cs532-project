// components/tabs/RestaurantTab.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';

const RestaurantTab = () => {
    const { locationData } = useChatContext();

    if (!locationData || locationData.restaurants.length === 0) {
        return <div className="text-slate-700 text-sm p-2">No restaurants found nearby.</div>;
    }

    return (
        <div className="overflow-x-auto bg-teal-50 shadow-md shadow-teal-200 p-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            <div className="grid grid-flow-col grid-rows-2 gap-4 min-w-max animate-fadeIn">
                {locationData.restaurants.slice(0, 10).map((restaurant: any, index: number) => (
                    <div
                        key={index}
                        className="w-64 p-3 bg-white rounded-lg border border-slate-200 flex-shrink-0"
                    >
                        <div className="font-medium text-slate-800">{restaurant.title}</div>
                        <div className="text-sm text-slate-700">{restaurant.address}</div>
                        {restaurant.distance && (
                            <div className="text-sm text-slate-700 mt-1">
                                {restaurant.distance.toFixed(1)} miles away
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RestaurantTab;
