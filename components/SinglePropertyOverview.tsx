import React, { useState } from "react";
import { useChatContext } from "context/ChatContext";
import PropertyRoutesMap from "./PropertyRoutesMap";
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

} from "react-icons/md";
import { TbAirConditioning } from "react-icons/tb";
import { FaRoute, FaMoneyBill } from "react-icons/fa6";
import { IoIosPricetag } from "react-icons/io";

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
    const { propertyDetails } = useChatContext();
    const [activeTab, setActiveTab] = useState('details');

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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
                <div className="flex border-b border-slate-200">
                    {['Details', 'Price History', 'Schools'].map((tab) => (
                        <button
                            key={tab}
                            className={`flex-1 py-3 text-sm font-medium 
                                ${activeTab.toLowerCase() === tab.toLowerCase()
                                    ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-600'
                                    : 'text-slate-600 hover:bg-slate-50'}`}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="p-4">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
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
                        <Section title="Price History" icon={MdHistory}>
                            {renderPriceHistory()}
                        </Section>
                    )}

                    {activeTab === 'schools' && (
                        <Section title="Nearby Schools" icon={MdSchool}>
                            {renderSchools()}
                        </Section>
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