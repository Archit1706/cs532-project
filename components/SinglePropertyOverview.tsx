// SinglePropertyOverview.tsx with improved tab linking

import React, { useState, useEffect } from "react";
import { useChatContext } from "context/ChatContext";
import PropertyRoutesMap from "./PropertyRoutesMap";
import PropertyMarketTab from "./Tabs/PropertyMarketTab";
import {
    MdHome,
    MdKingBed,
    MdBathtub,
    MdRuleFolder,
    MdLocationOn,
    MdLabel,
    MdList,
    MdInfo,
    MdWbSunny,
    MdAttachMoney,
    MdInbox,
    MdSchool,
    MdHistory,
    MdAttachFile,
    MdLink,
} from "react-icons/md";
import { TbAirConditioning } from "react-icons/tb";
import { FaRoute, FaMoneyBill, FaChartLine } from "react-icons/fa";
import { IoIosPricetag } from "react-icons/io";

// Define tab IDs for direct linking
export const PROPERTY_TAB_IDS = {
    DETAILS: "property-details-tab",
    PRICE_HISTORY: "property-price-history-tab",
    SCHOOLS: "property-schools-tab", 
    MARKET_ANALYSIS: "property-market-analysis-tab"
};

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

const SinglePropertyOverview = () => {
    const { propertyDetails, setPropertyContext } = useChatContext();
    const [activeTab, setActiveTab] = useState('details');

    // Handle URL hash for direct tab linking
    useEffect(() => {
        // Check if URL has a hash that matches one of our tab IDs
        const hash = window.location.hash.substring(1);
        if (hash) {
            // Map hash to tab name
            const tabMap = {
                [PROPERTY_TAB_IDS.DETAILS]: 'details',
                [PROPERTY_TAB_IDS.PRICE_HISTORY]: 'price history',
                [PROPERTY_TAB_IDS.SCHOOLS]: 'schools',
                [PROPERTY_TAB_IDS.MARKET_ANALYSIS]: 'market analysis'
            };
            
            if (tabMap[hash]) {
                setActiveTab(tabMap[hash]);
                // Scroll to the tab section
                setTimeout(() => {
                    const element = document.getElementById(hash);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            }
        }
    }, []);

    // Listen for the tab switch event
    useEffect(() => {
        const handleTabSwitch = () => {
            console.log('Event received: switchToPropertyMarketTab');
            setActiveTab('market analysis');
        };
        
        // Listen for custom event from UI links
        document.addEventListener('switchToPropertyMarketTab', handleTabSwitch);
        
        // Cleanup
        return () => {
            document.removeEventListener('switchToPropertyMarketTab', handleTabSwitch);
        };
    }, []);

    // Store complete property context for the chat
    useEffect(() => {
        if (propertyDetails?.basic_info) {
            // Create a clean, structured context object with all the important details
            const contextData = {
                address: propertyDetails.basic_info.address?.full,
                price: propertyDetails.basic_info.price,
                beds: propertyDetails.basic_info.bedrooms,
                baths: propertyDetails.basic_info.bathrooms,
                sqft: propertyDetails.basic_info.livingArea,
                yearBuilt: propertyDetails.basic_info.yearBuilt,
                type: propertyDetails.basic_info.homeType,
                daysOnMarket: propertyDetails.basic_info.daysOnZillow,
                priceHistory: propertyDetails.priceHistory?.map((item: { date: any; event: any; price: any; }) => ({
                    date: item.date,
                    event: item.event,
                    price: item.price
                })),
                taxHistory: propertyDetails.taxes?.map((item: { time: string | number | Date; taxPaid: any; value: any; }) => ({
                    year: new Date(item.time).getFullYear(),
                    taxPaid: item.taxPaid,
                    value: item.value
                })),
                schools: propertyDetails.schools?.map((school: { name: any; type: any; grades: any; rating: any; distance: any; }) => ({
                    name: school.name,
                    type: school.type,
                    grades: school.grades,
                    rating: school.rating,
                    distance: school.distance
                })),
                features: {
                    appliances: propertyDetails.features?.appliances,
                    cooling: propertyDetails.features?.cooling,
                    heating: propertyDetails.features?.heating,
                    exteriorFeatures: propertyDetails.features?.exteriorFeatures,
                    rooms: propertyDetails.features?.rooms?.map((room: { roomType: any; roomDimensions: any; }) => ({
                        type: room.roomType,
                        dimensions: room.roomDimensions
                    }))
                },
                tabLinks: {
                    details: `#${PROPERTY_TAB_IDS.DETAILS}`,
                    priceHistory: `#${PROPERTY_TAB_IDS.PRICE_HISTORY}`,
                    schools: `#${PROPERTY_TAB_IDS.SCHOOLS}`,
                    marketAnalysis: `#${PROPERTY_TAB_IDS.MARKET_ANALYSIS}`
                }
            };
            
            // Store this in context for the chat to access
            if (setPropertyContext) {
                setPropertyContext(contextData);
            }
            
            console.log('Property context set for chat:', contextData);
        }
    }, [propertyDetails, setPropertyContext]);

    if (!propertyDetails?.basic_info) return null;

    const info = propertyDetails.basic_info;
    const features = propertyDetails.features || {};
    const address = info.address?.full || `${info.address?.streetAddress}, ${info.address?.city}, ${info.address?.state} ${info.address?.zipcode}`;
    const image = propertyDetails?.images?.[0] || "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

    const renderFacts = () =>
        features.atAGlanceFacts?.map((fact: any, i: number) => (
            <div
                key={i}
                className="flex justify-between text-md text-slate-600 py-1.5 border-b border-slate-100 last:border-b-0"
            >
                <span>{fact.factLabel}</span>
                <span className="font-medium text-slate-800">{fact.factValue}</span>
            </div>
        ));

    const renderPriceHistory = () => {
        const priceEvents = propertyDetails.priceHistory
            ?.filter((entry: any) => ['Listed for sale', 'Sold', 'Price change'].includes(entry.event))
            .slice(0, 5);

        const taxEvents = propertyDetails.taxes
            ?.sort((a: any, b: any) => b.time - a.time)
            .slice(0, 10);

        return (
            <>
                {/* Price History Section */}
                {priceEvents?.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-md font-semibold text-slate-700 mb-2">Sales History</h4>
                        {priceEvents.map((entry: any, i: number) => (
                            <div
                                key={`price-${i}`}
                                className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100 last:border-b-0"
                            >
                                <span>{entry.date}</span>
                                <span className="font-medium text-slate-800">
                                    {entry.event}: ${entry.price?.toLocaleString() || 'N/A'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tax History Section */}
                {taxEvents?.length > 0 && (
                    <div>
                        <h4 className="text-md font-semibold text-slate-700 mb-2">Tax History</h4>
                        {taxEvents.map((entry: any, i: number) => (
                            <div
                                key={`tax-${i}`}
                                className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100 last:border-b-0"
                            >
                                <span>{new Date(entry.time).toLocaleDateString()}</span>
                                <span className="text-right">
                                    <span className="block font-medium text-slate-800">
                                        Tax: ${entry.taxPaid?.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Assessed Value: ${entry.value?.toLocaleString()}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };


    const renderSchools = () =>
        propertyDetails.schools?.map((school: any, i: number) => (
            <div
                key={i}
                className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100 last:border-b-0"
            >
                <div>
                    <span className="font-medium text-slate-800">{school.name}</span>
                    <span className="ml-2 text-xs text-slate-500">
                        {school.type} • {school.grades}
                    </span>
                </div>
                <div className="flex items-center">
                    <span className="mr-2">Rating: {school.rating}/10</span>
                    <span className="text-xs text-slate-500">
                        {school.distance} miles
                    </span>
                </div>
            </div>
        ));

    // Function to copy tab link to clipboard
    const copyTabLink = (tabId: string) => {
        const url = `${window.location.href.split('#')[0]}#${tabId}`;
        navigator.clipboard.writeText(url);
        
        // Visual feedback
        const linkBtn = document.getElementById(`copy-${tabId}`);
        if (linkBtn) {
            linkBtn.classList.add('text-teal-500');
            setTimeout(() => {
                linkBtn.classList.remove('text-teal-500');
            }, 1000);
        }
    };

    return (
        <div className="max-w-5xl mx-auto bg-slate-50 p-4 rounded-2xl">
            {/* Property Header */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                <div className="md:flex">
                    <div className="md:flex-shrink-0">
                        <img
                            className="h-72 w-full object-cover md:w-96"
                            src={image || undefined}
                            alt={address}
                        />
                    </div>
                    <div className="p-6 w-full">
                        <div className="flex items-center mb-2">
                            <MdLocationOn className="mr-2 text-teal-600 text-5xl" />
                            <h2 className="text-2xl font-bold text-slate-800">{address}</h2>
                        </div>
                        <p className="text-slate-600 mb-4 capitalize flex items-center">
                            <MdHome className="mr-2 text-slate-500 text-xl" />
                            {info.homeType?.replaceAll("_", " ").toLowerCase()}
                        </p>

                        {/* Property Highlights */}
                        <div className="grid grid-cols-3 gap-4 text-center bg-slate-100 rounded-lg p-4 justify-items-center">
                            <div className="flex flex-col items-center justify-center">
                                <MdKingBed className="text-teal-600 mb-1 text-2xl" />
                                <div className="text-sm text-slate-500">Beds</div>
                                <div className="text-lg font-semibold text-gray-500 h-6">{info.bedrooms}</div>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <MdBathtub className="text-teal-600 mb-1 text-2xl" />
                                <div className="text-sm text-slate-500">Baths</div>
                                <div className="text-lg font-semibold text-gray-500 h-6">{info.bathrooms}</div>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <MdRuleFolder className="text-teal-600 mb-1 text-2xl" />
                                <div className="text-sm text-slate-500">Year Built</div>
                                <div className="text-lg font-semibold text-gray-500 h-6">{info.yearBuilt}</div>
                            </div>
                        </div>


                        {/* Price */}
                        <div className="mt-4 flex items-center">
                            <IoIosPricetag className="mr-2 text-emerald-600 text-2xl" />
                            <p className="text-2xl font-bold text-emerald-600">
                                ${info.price?.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabbed Navigation */}
            <div id="property-tabs" className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
                <div className="flex border-b border-slate-200">
                    {[
                        { name: 'Details', id: PROPERTY_TAB_IDS.DETAILS },
                        { name: 'Price History', id: PROPERTY_TAB_IDS.PRICE_HISTORY },
                        { name: 'Schools', id: PROPERTY_TAB_IDS.SCHOOLS },
                        { name: 'Market Analysis', id: PROPERTY_TAB_IDS.MARKET_ANALYSIS, icon: FaChartLine }
                    ].map((tab) => (
                        <div key={tab.id} className="relative flex-1">
                            <button
                                id={tab.id}
                                className={`w-full py-3 text-sm font-medium flex items-center justify-center
                                    ${activeTab.toLowerCase() === tab.name.toLowerCase()
                                        ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-600'
                                        : 'text-slate-600 hover:bg-slate-50'}`}
                                onClick={() => setActiveTab(tab.name.toLowerCase())}
                            >
                                {tab.icon && <tab.icon className="mr-1" />}
                                {tab.name}
                            </button>
                            <button
                                id={`copy-${tab.id}`}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyTabLink(tab.id);
                                }}
                                title="Copy link to this tab"
                            >
                                <MdLink size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4">
                    {activeTab === 'details' && (
                        <div className="space-y-6" id={PROPERTY_TAB_IDS.DETAILS}>
                            {/* Full-width Description */}
                            {info.description && (
                                <Section title="Description" icon={MdInfo} className="w-full">
                                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                                        {info.description}
                                    </p>
                                </Section>
                            )}

                            {/* Two-column grid for rest of the info */}
                            <div className="grid md:grid-cols-2 gap-6">

                                <div>
                                    {features.atAGlanceFacts?.length > 0 && (
                                        <Section title="At a Glance" icon={MdList}>
                                            {renderFacts()}
                                        </Section>
                                    )}

                                    {features.rooms?.length > 0 && (
                                        <Section title="Room Dimensions">
                                            <div className="grid md:grid-cols-1 gap-2">
                                                {features.rooms
                                                    .filter((r: any) => r.roomType && r.roomDimensions)
                                                    .map((room: any, i: number) => (
                                                        <div
                                                            key={i}
                                                            className="flex justify-between border-b border-slate-100 pb-1.5 last:border-b-0"
                                                        >
                                                            <span className="capitalize text-slate-600">
                                                                {room.roomType.replace(/([A-Z])/g, ' $1')}
                                                            </span>
                                                            <div className="text-right">
                                                                <span className="text-slate-800">{room.roomDimensions}</span>
                                                                {room.roomArea && (
                                                                    <span className="text-xs text-slate-500 block">
                                                                        {room.roomArea} sq ft
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </Section>
                                    )}

                                    {features.hoaFee && (
                                        <Section title="HOA Fee" icon={MdLabel}>
                                            <p className="text-slate-700">{features.hoaFee}</p>
                                        </Section>
                                    )}
                                </div>

                                <div>
                                    {features.appliances?.length > 0 && (
                                        <Section title="Appliances" icon={MdInbox}>
                                            <ul className="space-y-1.5 text-slate-700">
                                                {features.appliances.map((a: string, i: number) => (
                                                    <li key={i} className="flex items-center">
                                                        <span className="w-2 h-2 mr-2 bg-teal-500 rounded-full"></span>
                                                        {a}
                                                    </li>
                                                ))}
                                            </ul>
                                        </Section>
                                    )}

                                    {features.exteriorFeatures?.length > 0 && (
                                        <Section title="Exterior Features" icon={MdWbSunny}>
                                            <ul className="space-y-1.5 text-slate-700">
                                                {features.exteriorFeatures.map((a: string, i: number) => (
                                                    <li key={i} className="flex items-center">
                                                        <span className="w-2 h-2 mr-2 bg-teal-500 rounded-full"></span>
                                                        {a}
                                                    </li>
                                                ))}
                                            </ul>
                                        </Section>
                                    )}

                                    {(features.heating?.length > 0 || features.cooling?.length > 0) && (
                                        <Section title="Climate Control" icon={TbAirConditioning}>
                                            {features.heating?.length > 0 && (
                                                <div className="mb-2">
                                                    <h4 className="font-medium text-slate-700 mb-1">Heating</h4>
                                                    <p className="text-slate-600">{features.heating.join(", ")}</p>
                                                </div>
                                            )}
                                            {features.cooling?.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-slate-700 mb-1">Cooling</h4>
                                                    <p className="text-slate-600">{features.cooling.join(", ")}</p>
                                                </div>
                                            )}
                                        </Section>
                                    )}
                                </div>


                            </div>
                        </div>
                    )}


                    {activeTab === 'price history' && (
                        <div id={PROPERTY_TAB_IDS.PRICE_HISTORY}>
                            <Section title="Price History" icon={MdHistory}>
                                {renderPriceHistory()}
                            </Section>
                        </div>
                    )}

                    {activeTab === 'schools' && (
                        <div id={PROPERTY_TAB_IDS.SCHOOLS}>
                            <Section title="Nearby Schools" icon={MdSchool}>
                                {renderSchools()}
                            </Section>
                        </div>
                    )}
                    
                    {activeTab === 'market analysis' && (
                        <div id={PROPERTY_TAB_IDS.MARKET_ANALYSIS} className="animate-fadeIn">
                            <PropertyMarketTab />
                        </div>
                    )}
                </div>
            </div>

            <Section title="Navigations" icon={FaRoute}>
                <PropertyRoutesMap
                    property={{
                        id: info.zpid,
                        address,
                        price: info.price,
                        beds: info.bedrooms,
                        baths: info.bathrooms,
                        sqft: info.livingArea,
                        type: info.homeType,
                        zpid: info.zpid,
                        imgSrc: image,
                    }}
                />
            </Section>
        </div>
    );
};

export default SinglePropertyOverview;