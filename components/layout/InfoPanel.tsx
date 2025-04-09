// components/layout/InfoPanel.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import PropertyDetailCard from '../PropertyDetailCard';
import SinglePropertyOverview from '../SinglePropertyOverview';
import WelcomeCard from '../WelcomeCard';
import { MdExplore, MdNotifications } from 'react-icons/md';
import { FaRegBookmark } from 'react-icons/fa';
import PropertyTab from '../Tabs/PropertyTab';
import RestaurantTab from '../Tabs/RestaurantTab';
import TransitTab from '../Tabs/TransitTab';
import MarketTab from '../Tabs/MarketTab';

const InfoPanel = () => {
    const { selectedProperty, setSelectedProperty, locationData, activeTab, setActiveTab, isPropertyChat, propertyDetails } = useChatContext();

    const renderTabContent = () => {
        if (activeTab === 'explore') {
            if (isPropertyChat && propertyDetails) {
                return (
                    <div className="space-y-6 m-6">
                        <h2 className="text-xl font-semibold text-slate-700">Property Overview</h2>
                        <SinglePropertyOverview />

                        <h2 className="text-lg font-semibold text-slate-700">Transit</h2>
                        <TransitTab />

                        <h2 className="text-lg font-semibold text-slate-700">Local Amenities</h2>
                        <RestaurantTab />

                        <h2 className="text-lg font-semibold text-slate-700">Similar Properties</h2>
                        <PropertyTab source="nearby" />
                    </div>
                );
            }

            // Only show this if we're not in a dedicated property chat
            if (selectedProperty) {
                return <PropertyDetailCard property={selectedProperty} onClose={() => setSelectedProperty(null)} />;
            }

            if (!locationData)
                return <></>;
            // return <WelcomeCard />;

            return (
                <div className="space-y-6 m-6">
                    <h2 className="text-lg font-semibold text-slate-700">Properties in Your Area</h2>
                    <PropertyTab />
                    <h2 className="text-lg font-semibold text-slate-700 mt-4">Market Details</h2>
                    <MarketTab />
                    <h2 className="text-lg font-semibold text-slate-700 mt-4">Local Amenities</h2>
                    <RestaurantTab />
                    <h2 className="text-lg font-semibold text-slate-700 mt-4">Transit</h2>
                    <TransitTab />
                </div>
            );
        }

        if (activeTab === 'saved') {
            return <div className="text-slate-600 space-y-6 m-6">No saved items yet.</div>;
        }

        if (activeTab === 'updates') {
            return <div className="text-slate-600 space-y-6 m-6">No updates yet.</div>;
        }

        return null;
    };


    return (
        <div className="w-1/2 h-full flex flex-col rounded-2xl shadow-gray-500 shadow-lg bg-radial-[at_50%_65%] from-teal-400 via-teal-500 to-teal-700 to-90%">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* 3 tab layout */}
                <div className='flex flex-row justify-around items-center bg-emerald-700/35 border-b border-slate-200 mb-2 rounded-t-2xl'>
                    <div
                        className='flex flex-col justify-center items-center cursor-pointer rounded-xl m-2 p-2'
                        onClick={() => setActiveTab('explore')}
                    >
                        <div className={`rounded-full ${activeTab === 'explore' ? 'bg-purple-200 text-gray-700' : 'bg-transparent'}`}>
                            <MdExplore className='h-6 w-6 mx-4 my-1' />
                        </div>
                        <h1 className='text-purple-100 font-semibold'>Explore</h1>
                    </div>
                    <div
                        className='flex flex-col justify-center items-center cursor-pointer rounded-xl m-2 p-2'
                        onClick={() => setActiveTab('saved')}
                    >
                        <div className={`rounded-full ${activeTab === 'saved' ? 'bg-purple-200 text-gray-700' : 'bg-transparent'}`}>
                            <FaRegBookmark className='h-5 w-5 mx-4 my-1' />
                        </div>
                        <h1 className='text-purple-100 font-semibold'>Saved</h1>

                    </div>
                    <div
                        className='flex flex-col justify-center items-center cursor-pointer rounded-xl m-2 p-2'
                        onClick={() => setActiveTab('updates')}
                    >
                        <div className={`rounded-full ${activeTab === 'updates' ? 'bg-purple-200 text-gray-700' : 'bg-transparent'}`}>
                            <MdNotifications className='h-6 w-6 mx-4 my-1' />
                        </div>
                        <h1 className='text-purple-100 font-semibold'>Updates</h1>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 space-y-4">
                    {renderTabContent()}
                </div>
            </div>
        </div >
    );
};

export default InfoPanel;
