// components/layout/Sidebar.tsx
"use client";

// import { Home, LineChart, Settings, HelpCircle, LogOut, MessageCircle } from 'lucide-react';
import { FaHome } from "react-icons/fa";
import { FaChartLine } from "react-icons/fa6";
import { MdOutlineLogout, MdOutlineLiveHelp } from "react-icons/md";
import { IoSettingsOutline, IoChatbubbleOutline } from "react-icons/io5";
import Link from 'next/link';
import Image from "next/image";
import React from 'react';

const Sidebar = () => {
    return (
        <aside className="w-64 h-screen bg-gray-50 border-r border-gray-200 flex flex-col justify-between">
            <div>
                {/* Logo */}
                <div className="px-6 py-6">
                    <div className="text-3xl font-bold text-slate-900">
                        <span className="flex items-center gap-2">
                            <Image src={"/realestate-ai-logo.png"} height={42} width={42} alt="Logo" /> Keya
                        </span>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex flex-col gap-2 px-4">
                    <Link href="/chat">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 font-medium">
                            <IoChatbubbleOutline className="w-5 h-5" /> Chat
                        </div>
                    </Link>
                    <Link href="/find_homes">
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700">
                            <FaHome className="w-5 h-5" /> Find Homes
                        </div>
                    </Link>
                    <Link href="/market-trends">
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700">
                            <FaChartLine className="w-5 h-5" /> Market Trends
                        </div>
                    </Link>
                    <Link href="/preferences">
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700">
                            <IoSettingsOutline className="w-5 h-5" /> My Preferences
                        </div>
                    </Link>
                    <Link href="/help">
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700">
                            <MdOutlineLiveHelp className="w-5 h-5" /> Help
                        </div>
                    </Link>
                </nav>
            </div>

            <button className="px-4 pb-6 w-full cursor-pointer">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-500">
                    <MdOutlineLogout className="w-5 h-5" /> Logout
                </div>
            </button>
        </aside>
    );
};

export default Sidebar;