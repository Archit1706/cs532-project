// components/PropertyDetailCard.tsx
"use client";

import React from 'react';
import { Property } from 'types/chat';
import Link from 'next/link';
import { MdChat } from 'react-icons/md';
import GoogleMapEnhanced from './GoogleMapEnhanced';

interface Props {
    property: Property;
    onClose: () => void;
}

const PropertyDetailCard: React.FC<Props> = ({ property, onClose }) => {
    return (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200 animate-fadeIn relative overflow-y-auto max-h-[90vh]">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 z-10"
            >
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">Property Listing</h2>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="h-64 overflow-hidden">
                    <img
                        src={property.imgSrc || "https://via.placeholder.com/800x400?text=No+Image"}
                        alt={property.address}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="p-4">
                    <div className="font-bold text-2xl text-slate-800">
                        {typeof property.price === 'number' ? `$${property.price.toLocaleString()}` : property.price}
                    </div>
                    <div className="text-slate-600 mb-3">{property.address}</div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                            <div className="font-bold text-slate-800">{property.beds}</div>
                            <div className="text-slate-600 text-sm">Beds</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                            <div className="font-bold text-slate-800">{property.baths}</div>
                            <div className="text-slate-600 text-sm">Baths</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                            <div className="font-bold text-slate-800">{typeof property.sqft === 'number' ? property.sqft.toLocaleString() : property.sqft}</div>
                            <div className="text-slate-600 text-sm">Sq Ft</div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3 mb-4">
                        <div className="font-semibold text-slate-800 mb-2">Property Type</div>
                        <div className="text-slate-600">{property.type}</div>
                    </div>

                    {/* Google Map Component */}
                    <GoogleMapEnhanced property={property} />

                    {/* Chat button */}
                    <Link href={`/chat?propertyId=${property.zpid}`}>
                        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md w-full justify-center mt-4">
                            <MdChat className="h-5 w-5" />
                            Chat with this property
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetailCard;