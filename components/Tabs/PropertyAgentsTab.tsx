// components/tabs/PropertyAgentTab.tsx
"use client";

import React from "react";
import { useChatContext } from "context/ChatContext";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { MdPhone, MdBusiness, MdPerson, MdAttachMoney } from "react-icons/md";

const getStarIcons = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(<FaStar key={i} className="text-yellow-400 inline-block mr-0.5" />);
        } else if (i === fullStars && hasHalfStar) {
            stars.push(<FaStarHalfAlt key={i} className="text-yellow-400 inline-block mr-0.5" />);
        } else {
            stars.push(<FaRegStar key={i} className="text-yellow-300 inline-block mr-0.5" />);
        }
    }

    return stars;
};

const PropertyAgentTab = () => {
    const { locationData } = useChatContext();

    if (!locationData?.agents || locationData.agents.length === 0) {
        return <div className="text-slate-700 text-sm p-2">No top agents found in this area.</div>;
    }

    return (
        <div className="overflow-x-auto bg-teal-50 shadow-md shadow-teal-200 p-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            <div className="grid grid-flow-col grid-rows-2 gap-4 min-w-max animate-fadeIn">
                {locationData.agents.map((agent: any, index: number) => (
                    <div
                        key={index}
                        className="w-96 p-4 bg-white rounded-lg border border-slate-200 flex-shrink-0 flex gap-4"
                    >
                        <img
                            src={agent.profilePhotoSrc}
                            alt={agent.fullName}
                            className="w-24 h-24 object-cover rounded-full border-2 border-emerald-500"
                        />

                        <div className="flex-grow flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-800">{agent.fullName}</h3>
                                    {agent.isTopAgent && (
                                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-md">Top Agent</span>
                                    )}
                                </div>
                                <div className="text-sm text-slate-600 flex items-center mt-1">
                                    <MdBusiness className="mr-1" /> {agent.businessName}
                                </div>
                                <div className="text-sm text-slate-600 flex items-center">
                                    <MdPhone className="mr-1" /> {agent.phoneNumber}
                                </div>
                                <div className="text-sm text-slate-600">
                                    Sales (last year): <strong>{agent.saleCountLastYear}</strong> | All time: <strong>{agent.saleCountAllTime}</strong>
                                </div>
                                <div className="text-sm text-slate-600">
                                    Price Range (3y):{" "}
                                    <strong>${agent.salePriceRangeThreeYearMin.toLocaleString()}</strong> -{" "}
                                    <strong>${agent.salePriceRangeThreeYearMax.toLocaleString()}</strong>
                                </div>
                                <div className="flex items-center text-sm text-slate-700 mt-2">
                                    {getStarIcons(agent.reviewStarsRating)}
                                    <span className="ml-1 text-slate-600">{agent.reviews}</span>
                                </div>
                                {agent.reviewExcerpt && (
                                    <p className="mt-2 text-sm italic text-slate-500">"{agent.reviewExcerpt}"</p>
                                )}
                            </div>
                            <a
                                href={`https://www.zillow.com${agent.reviewLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm mt-2 text-teal-600 hover:underline font-medium"
                            >
                                Read all reviews →
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PropertyAgentTab;
