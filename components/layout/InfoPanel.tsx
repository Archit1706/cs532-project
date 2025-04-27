// components/layout/InfoPanel.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useChatContext } from 'context/ChatContext';
import PropertyDetailCard from '../PropertyDetailCard';
import SinglePropertyOverview from '../SinglePropertyOverview';
import WelcomeCard from '../WelcomeCard';
import { MdExplore, MdNotifications, MdHome, MdLocationCity, MdRestaurant, MdDirectionsTransit, MdQueryStats, MdAutoAwesome } from 'react-icons/md';
import { FaRegBookmark } from 'react-icons/fa';
import PropertyTab from '../Tabs/PropertyTab';
import RestaurantTab from '../Tabs/RestaurantTab';
import TransitTab from '../Tabs/TransitTab';
import MarketTab from '../Tabs/MarketTab';
import AIWorkflowTab from '../Tabs/AIWorkflowTab';

// Create unique IDs for each section that can be used as anchors
const SECTION_IDS = {
  PROPERTIES: 'properties-section',
  MARKET: 'market-trends-section',
  AMENITIES: 'local-amenities-section',
  TRANSIT: 'transit-section'
};



const InfoPanel = () => {
    const { 
      selectedProperty, 
      setSelectedProperty, 
      locationData, 
      activeTab, 
      setActiveTab, 
      isPropertyChat, 
      propertyDetails,
      zipCode
    } = useChatContext();

        // Use state to track if component is mounted (client-side only)
        const [isMounted, setIsMounted] = useState(false);
    
        // For keeping workflow state between tab switches
        const [lastAIState, setLastAIState] = useState<any>(null);

            // Only execute on client side
    useEffect(() => {
        setIsMounted(true);
        
        // Event listener for tab changes
        const handleTabChange = (oldTab: string, newTab: string) => {
            console.log(`Tab changed from ${oldTab} to ${newTab}`);
            // Save AI workflow state when leaving the AI tab
            if (oldTab === 'ai') {
                // Store any necessary state
                setLastAIState({
                    timestamp: Date.now()
                });
            }
        };
        
        // Create an event function to monitor tab changes
        const originalSetActiveTab = setActiveTab;
        const wrappedSetActiveTab = (newTab: any) => {
            const oldTab = activeTab;
            handleTabChange(oldTab, newTab);
            originalSetActiveTab(newTab);
        };

              // @ts-ignore - we know what we're doing
              setActiveTab = wrappedSetActiveTab;

        return () => {
            // Cleanup logic if necessary
        };
    }, []);

    const renderTabContent = () => {
        // Use state to track if component is mounted (client-side only)
        const [isMounted, setIsMounted] = useState(false);
        
        // Only execute on client side
        useEffect(() => {
            setIsMounted(true);
        }, []);
        
        // Return null during server-side rendering to prevent hydration mismatch
        if (!isMounted) {
            return null;
        }
    
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
    
            if (!locationData || !zipCode)
                return <WelcomeCard />;
    
            return (
                <div className="space-y-6 m-6 pb-12 overflow-y-auto">
                    {/* Properties Section with Improved Header */}
                    <section id={SECTION_IDS.PROPERTIES} className="scroll-mt-16">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md mb-4">
                            <div className="flex items-center p-4">
                                <MdHome className="text-white mr-3 text-2xl" />
                                <h2 className="text-xl font-bold text-white">Properties in {zipCode}</h2>
                                <a 
                                  href={`#${SECTION_IDS.PROPERTIES}`} 
                                  className="ml-auto text-blue-100 hover:text-white"
                                  title="Copy link to this section"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(window.location.href.split('#')[0] + `#${SECTION_IDS.PROPERTIES}`);
                                  }}
                                >
                                  #
                                </a>
                            </div>
                        </div>
                        <PropertyTab />
                    </section>
                    
                    {/* Market Trends Section with Improved Header */}
                    <section id={SECTION_IDS.MARKET} className="scroll-mt-16 mt-8">
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-md mb-4">
                            <div className="flex items-center p-4">
                                <MdQueryStats className="text-white mr-3 text-2xl" />
                                <h2 className="text-xl font-bold text-white">Market Trends</h2>
                                <a 
                                  href={`#${SECTION_IDS.MARKET}`} 
                                  className="ml-auto text-emerald-100 hover:text-white"
                                  title="Copy link to this section"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(window.location.href.split('#')[0] + `#${SECTION_IDS.MARKET}`);
                                  }}
                                >
                                  #
                                </a>
                            </div>
                        </div>
                        <MarketTab />
                    </section>
                    
                    {/* Local Amenities Section with Improved Header */}
                    <section id={SECTION_IDS.AMENITIES} className="scroll-mt-16 mt-8">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-md mb-4">
                            <div className="flex items-center p-4">
                                <MdRestaurant className="text-white mr-3 text-2xl" />
                                <h2 className="text-xl font-bold text-white">Local Amenities</h2>
                                <a 
                                  href={`#${SECTION_IDS.AMENITIES}`} 
                                  className="ml-auto text-amber-100 hover:text-white"
                                  title="Copy link to this section"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(window.location.href.split('#')[0] + `#${SECTION_IDS.AMENITIES}`);
                                  }}
                                >
                                  #
                                </a>
                            </div>
                        </div>
                        <RestaurantTab />
                    </section>
                    
                    {/* Transit Section with Improved Header */}
                    <section id={SECTION_IDS.TRANSIT} className="scroll-mt-16 mt-8">
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-md mb-4">
                            <div className="flex items-center p-4">
                                <MdDirectionsTransit className="text-white mr-3 text-2xl" />
                                <h2 className="text-xl font-bold text-white">Transit Options</h2>
                                <a 
                                  href={`#${SECTION_IDS.TRANSIT}`} 
                                  className="ml-auto text-indigo-100 hover:text-white"
                                  title="Copy link to this section"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(window.location.href.split('#')[0] + `#${SECTION_IDS.TRANSIT}`);
                                  }}
                                >
                                  #
                                </a>
                            </div>
                        </div>
                        <TransitTab />
                    </section>
                </div>
            );
        }

        if (activeTab === 'ai') {
            return <AIWorkflowTab />;
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
                        onClick={() => setActiveTab('ai')}
                    >
                        <div className={`rounded-full ${activeTab === 'ai' ? 'bg-purple-200 text-gray-700' : 'bg-transparent'}`}>
                            <MdAutoAwesome className='h-6 w-6 mx-4 my-1' />
                        </div>
                        <h1 className='text-purple-100 font-semibold'>AI Workflow</h1>
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