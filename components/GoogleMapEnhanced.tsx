// components/GoogleMapEnhanced.tsx
"use client";

import React from 'react';
import { Property } from 'types/chat';

interface Props {
  property: Property;
}

const GoogleMapEnhanced: React.FC<Props> = ({ property }) => {
  // Create Google Maps Embed URL
  const encodedAddress = encodeURIComponent(property.address);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}&zoom=15`;
  
  // Function to open Google Maps search in new tab
  const searchNearby = (searchTerm: string) => {
    const url = `https://www.google.com/maps/search/${searchTerm}+near+${encodedAddress}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="w-full h-80 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 mb-3">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapEmbedUrl}
        ></iframe>
      </div>
      
      <div className="text-sm text-slate-600">
        <p>Search for nearby places:</p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <button 
            onClick={() => searchNearby("restaurants")}
            className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200 text-xs font-medium hover:bg-teal-100"
          >
            Restaurants
          </button>
          <button
            onClick={() => searchNearby("schools")}
            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-xs font-medium hover:bg-blue-100"
          >
            Schools
          </button>
          <button
            onClick={() => searchNearby("parks")}
            className="px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium hover:bg-green-100"
          >
            Parks
          </button>
          <button
            onClick={() => searchNearby("grocery stores")}
            className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-xs font-medium hover:bg-amber-100"
          >
            Grocery
          </button>
          <button
            onClick={() => searchNearby("transit")}
            className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 text-xs font-medium hover:bg-purple-100"
          >
            Transit
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapEnhanced;