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
        <div className="space-y-2 pr-2 animate-fadeIn">
            {locationData.restaurants.slice(0, 5).map((restaurant: any, index: any) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-slate-200">
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
    );
};

export default RestaurantTab;
