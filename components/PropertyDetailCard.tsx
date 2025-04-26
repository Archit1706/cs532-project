// components/PropertyDetailCard.tsx - Updated with open dialog by default
"use client";

import React, { useState, useEffect } from 'react';
import { Property } from 'types/chat';
import Link from 'next/link';
import { MdChat, MdInfo, MdClose } from 'react-icons/md';
import PropertyRoutesMap from './PropertyRoutesMap';
import { useChatContext } from 'context/ChatContext';
import { FaRoute } from 'react-icons/fa';

interface Props {
    property: Property;
    onClose: () => void;
}

// Improved Section Component with more dynamic styling
const Section = ({
    title,
    children,
    icon: Icon = MdInfo,
    className = ""
}: {
    title: string;
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string
}) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4 ${className}`}>
        <div className="flex items-center mb-3 border-b border-slate-100 pb-2">
            <Icon className="mr-3 text-teal-600 w-6 h-6" />
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        </div>
        {children}
    </div>
);

const PropertyDetailCard: React.FC<Props> = ({ property, onClose }) => {
    const { setActiveTab } = useChatContext();
    // Show dialog by default
    const [showChatInfo, setShowChatInfo] = useState(true);
    
    // Fixed onClose handler
    const handleClose = () => {
        // Ensure we stay in 'explore' tab after closing
        setActiveTab('explore');
        // Call the original onClose prop
        onClose();
    };

    return (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200 animate-fadeIn relative overflow-y-auto max-h-[90vh]">
            <button
                onClick={handleClose}
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

                    {/* Chat button - moved up before map */}
                    <div className="relative mb-6">
                        {showChatInfo && (
                            <div className="bg-white p-4 rounded-lg shadow-lg border border-teal-200 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-teal-700">Chat with This Property</h3>
                                    <button 
                                        onClick={() => setShowChatInfo(false)}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <MdClose />
                                    </button>
                                </div>
                                <p className="text-slate-700 text-sm mb-2">
                                    Start a conversation about this property to:
                                </p>
                                <ul className="text-sm text-slate-600 mb-3 list-disc pl-5">
                                    <li>Get detailed property information</li>
                                    <li>See historical price data</li>
                                    <li>Access comparative market analysis</li>
                                    <li>Learn about the neighborhood</li>
                                    <li>Explore financing options</li>
                                </ul>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Link target='_blank' href={`/chat?propertyId=${property.zpid}`} className="flex-1">
                                <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md w-full justify-center">
                                    <MdChat className="h-5 w-5" />
                                    Chat with this property
                                </button>
                            </Link>
                            <button 
                                onClick={() => setShowChatInfo(!showChatInfo)}
                                className="bg-teal-100 text-teal-600 p-2 rounded-md hover:bg-teal-200"
                                title="Learn about chat features"
                            >
                                <MdInfo className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <Section title="Navigation & Transit Options" icon={FaRoute}>
                    <PropertyRoutesMap property={property} />
            </Section>

                </div>
            </div>
        </div>
    );
};

export default PropertyDetailCard;