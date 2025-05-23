// components/tabs/PropertyTab.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import { FaHeart, FaRegHeart } from "react-icons/fa";

const PropertyTab = ({ source = "main" }: { source?: "main" | "nearby" }) => {
    const {
        properties,
        nearbyProperties,
        isLoadingProperties,
        setSelectedProperty,
        isPropertyChat,
        savedProperties, toggleSaveProperty
    } = useChatContext();

    const list = source === "nearby" ? nearbyProperties : properties;

    if (isLoadingProperties && list.length === 0) {
        return (
            <div className="flex justify-center p-4">
                <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
            </div>
        );
    }

    if (list.length === 0) {
        return <div className="text-slate-700 text-sm p-2">No properties found in this area.</div>;
    }

    return (
        <div className="flex overflow-x-auto gap-4 p-2 bg-teal-50 shadow-md shadow-teal-200 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            {list.slice(0, 6).map((property: any, index: number) => (
                <div
                    key={index}
                    onClick={() => setSelectedProperty(property)}
                    className="min-w-[250px] max-w-xs bg-white rounded-lg border border-slate-200 overflow-hidden h-64 flex-shrink-0 flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                >
                    {property.imgSrc ? (
                        <div className="h-32 overflow-hidden">
                            <img
                                src={property.imgSrc}
                                alt={property.address}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/300x200?text=No+Image";
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSaveProperty(property);
                                }}
                                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                            >
                                {savedProperties.some((p) => p.zpid === property.zpid) ? (
                                    <FaHeart className="text-red-500" />
                                ) : (
                                    <FaRegHeart className="text-slate-400" />
                                )}
                            </button>
                        </div>

                    ) : (
                        <div className="h-32 bg-slate-100 flex items-center justify-center">
                            <span className="text-slate-400">No image available</span>
                        </div>
                    )}
                    <div className="p-3 flex-1 flex flex-col">
                        <div className="font-medium text-slate-800 text-lg">
                            {typeof property.price === 'number' ? `$${property.price.toLocaleString()}` : property.price}
                        </div>
                        <div className="text-xs text-slate-700 line-clamp-2 mb-1">{property.address}</div>
                        <div className="flex flex-wrap gap-2 mt-auto">
                            <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">{property.beds} beds</span>
                            <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">{property.baths} baths</span>
                            <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">
                                {typeof property.sqft === 'number' ? `${property.sqft.toLocaleString()} sqft` : `${property.sqft} sqft`}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PropertyTab;