// components/tabs/RestaurantTab.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const getStarIcons = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(<FaStar key={i} className="text-yellow-400 inline-block mr-0.5" />);
        } else if (i === fullStars && hasHalfStar) {
            stars.push(<FaStarHalfAlt key={i} className="text-yellow-400 inline-block mr-0.5" />);
        } else {
            stars.push(<FaRegStar key={i} className="text-yellow-300 inline-block mr-0.5" />);
        }
    }

    return stars;
};

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
                        className="w-80 p-3 bg-white rounded-lg border border-slate-200 flex-shrink-0 flex items-start gap-3"
                    >
                        {/* Left: Details */}
                        <div className="flex-grow">
                            <div className="font-semibold text-slate-800 text-base">{restaurant.title}</div>
                            <div className="text-sm text-slate-700 mb-1">{restaurant.address}</div>
                            {restaurant.distance && (
                                <div className="text-sm text-slate-700">
                                    {restaurant.distance.toFixed(2)} miles away
                                </div>
                            )}
                            <div className="text-sm text-slate-700 mt-1">Type: {restaurant.type}</div>
                            <div className="text-sm text-slate-700 mt-1">Price: {restaurant.price}</div>
                            <div className="flex items-center text-sm text-slate-700 mt-1">
                                {getStarIcons(restaurant.rating)}
                                <span className="ml-1 text-slate-600">
                                    {restaurant.rating} {restaurant.reviews_original}
                                </span>
                            </div>
                        </div>

                        {/* Right: Image */}
                        {restaurant.image && (
                            <img
                                src={restaurant.image}
                                alt={restaurant.title}
                                className="w-20 h-20 object-cover rounded-md"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RestaurantTab;
