"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { FaHome } from "react-icons/fa";
import { FaChartLine } from "react-icons/fa6";
import { MdOutlineLogout, MdOutlineLiveHelp, MdMenu, MdMenuOpen } from "react-icons/md";
import { IoSettingsOutline, IoChatbubbleOutline } from "react-icons/io5";


const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <aside className={`h-screen bg-gray-50 border-r border-gray-200 flex flex-col justify-between transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
            <div>
                {/* Logo and Collapse Button */}
                <div className="px-4 py-6 flex items-center justify-between">
                    {!collapsed && (
                        <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Image src="/realestate-ai-logo.png" height={42} width={42} alt="Logo" />
                            Keya
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(prev => !prev)}
                        className="text-gray-500 hover:text-gray-700 text-lg text-center rounded-lg p-2 transition duration-200"
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        {collapsed ? <MdMenu className='w-7 h-7' /> : <MdMenuOpen className='w-7 h-7' />}
                    </button>
                </div>

                {/* Menu */}
                <nav className="flex flex-col gap-2 px-2">
                    <Link href="/chat">
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${collapsed ? 'justify-center' : ''} bg-blue-50 text-blue-700 font-medium`}>
                            <IoChatbubbleOutline className="w-5 h-5" />
                            {!collapsed && <span className="transition-opacity duration-200">Chat</span>}
                        </div>
                    </Link>
                    <Link href="/find_homes">
                        <div className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 ${collapsed ? 'justify-center' : ''}`}>
                            <FaHome className="w-5 h-5" />
                            {!collapsed && <span className="transition-opacity duration-200">Find Homes</span>}
                        </div>
                    </Link>
                    <Link href="/market-trends">
                        <div className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 ${collapsed ? 'justify-center' : ''}`}>
                            <FaChartLine className="w-5 h-5" />
                            {!collapsed && <span className="transition-opacity duration-200">Market Trends</span>}
                        </div>
                    </Link>
                    <Link href="/preferences">
                        <div className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 ${collapsed ? 'justify-center' : ''}`}>
                            <IoSettingsOutline className="w-5 h-5" />
                            {!collapsed && <span className="transition-opacity duration-200">My Preferences</span>}
                        </div>
                    </Link>
                    <Link href="/help">
                        <div className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 ${collapsed ? 'justify-center' : ''}`}>
                            <MdOutlineLiveHelp className="w-5 h-5" />
                            {!collapsed && <span className="transition-opacity duration-200">Help</span>}
                        </div>
                    </Link>
                </nav>
            </div>

            {/* Logout */}
            <button className="px-2 pb-6 w-full cursor-pointer">
                <div className={`flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-500 ${collapsed ? 'justify-center' : ''}`}>
                    <MdOutlineLogout className="w-5 h-5" />
                    {!collapsed && <span className="transition-opacity duration-200">Logout</span>}
                </div>
            </button>
        </aside>
    );
};

export default Sidebar;
