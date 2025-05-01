// components/tabs/SavedPropertiesTab.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';

const SavedPropertiesTab = () => {
  const { savedProperties, setSelectedProperty, activeTab,
    setActiveTab } = useChatContext();

  if (!savedProperties.length) {
    return <div className="text-slate-700 text-sm p-4">No saved properties yet.</div>;
  }

  return (
    <div className="flex overflow-x-auto gap-4 p-2 bg-emerald-50 shadow-inner scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
      {savedProperties.map((property, index) => (
        <div
          key={index}
          onClick={() => {
            setSelectedProperty(property);
            setActiveTab('explore');
          }}
          className="min-w-[250px] max-w-xs bg-white rounded-lg border border-slate-200 overflow-hidden h-64 flex-shrink-0 flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
        >
          <div className="h-32 overflow-hidden">
            <img
              src={property.imgSrc || "https://via.placeholder.com/300x200?text=No+Image"}
              alt={property.address}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <div className="font-medium text-slate-800 text-lg">
              ${property.price.toLocaleString()}
            </div>
            <div className="text-xs text-slate-700 line-clamp-2 mb-1">{property.address}</div>
            <div className="flex flex-wrap gap-2 mt-auto">
              <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">{property.beds} beds</span>
              <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">{property.baths} baths</span>
              <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">{property.sqft} sqft</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedPropertiesTab;
