// components/layout/InfoPanel.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import PropertyDetailCard from '../PropertyDetailCard';
import WelcomeCard from '../WelcomeCard';
import { MdExplore, MdNotifications } from 'react-icons/md';
import { FaRegBookmark } from 'react-icons/fa';
import PropertyTab from '../Tabs/PropertyTab';
import RestaurantTab from '../Tabs/RestaurantTab';
import TransitTab from '../Tabs/TransitTab';

const InfoPanel = () => {
    const { selectedProperty, setSelectedProperty, locationData, activeTab, setActiveTab } = useChatContext();

    const renderTabContent = () => {
        if (selectedProperty) {
            return <PropertyDetailCard property={selectedProperty} onClose={() => setSelectedProperty(null)} />;
        }

        if (!locationData) {
            return <></>;
            // return <WelcomeCard />;
        }

        switch (activeTab) {
            case 'properties':
                return (
                    <div className="space-y-6 m-6">
                        <h2 className="text-lg font-semibold text-slate-700">Properties in Your Area</h2>
                        <PropertyTab />
                        <h2 className="text-lg font-semibold text-slate-700 mt-4">Local Amenities</h2>
                        <RestaurantTab />
                        <h2 className="text-lg font-semibold text-slate-700 mt-4">Transit</h2>
                        <TransitTab />
                    </div>
                );
            case 'saved':
                return <div className="text-slate-600 space-y-6 m-6">No saved items yet.</div>;
            case 'updates':
                return <div className="text-slate-600 space-y-6 m-6">No updates yet.</div>;
            default:
                return null;
        }
    };

    return (
        <div className="w-1/2 h-full flex flex-col rounded-2xl shadow-gray-500 shadow-lg bg-radial-[at_50%_65%] from-teal-400 via-teal-500 to-teal-700 to-90%">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* 3 tab layout */}
                <div className='flex flex-row justify-around items-center bg-emerald-700/35 border-b border-slate-200 mb-2 rounded-t-2xl'>
                    <div
                        className='flex flex-col justify-center items-center cursor-pointer rounded-xl m-2 p-2'
                        onClick={() => setActiveTab('properties')}
                    >
                        <div className={`rounded-full ${activeTab === 'properties' ? 'bg-purple-200 text-gray-700' : 'bg-transparent'}`}>
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



// // components/layout/InfoPanel.tsx
// "use client";

// import React from 'react';
// import { useChatContext } from 'context/ChatContext';
// import PropertyDetailCard from '../PropertyDetailCard';
// import WelcomeCard from '../WelcomeCard';
// import TabsHeader from '../TabsHeader';
// import TabsContainer from '../TabsContainer';

// const InfoPanel = () => {
//     const { selectedProperty, setSelectedProperty, locationData } = useChatContext();

//     return (
//         <div className="w-3/5 space-y-4">
//             {selectedProperty ? (
//                 <PropertyDetailCard property={selectedProperty} onClose={() => setSelectedProperty(null)} />
//             ) : locationData ? (
//                 <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200 animate-fadeIn">
//                     <h2 className="text-xl font-semibold text-slate-800 mb-4">
//                         Area Information: {locationData.zipCode}
//                     </h2>
//                     <TabsHeader />
//                     <TabsContainer />
//                 </div>
//             ) : (
//                 <WelcomeCard />
//             )}
//         </div>
//     );
// };

// export default InfoPanel;
