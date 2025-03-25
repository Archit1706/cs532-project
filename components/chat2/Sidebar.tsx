import React from "react";
import { FaComments, FaHome, FaChartBar, FaHeart, FaQuestionCircle, FaSignOutAlt } from "react-icons/fa";

const Sidebar = () => {
    const menuItems = [
        { name: "Chat", icon: <FaComments />, active: true },
        { name: "Find Homes", icon: <FaHome /> },
        { name: "Market Trends", icon: <FaChartBar /> },
        { name: "My Preferences", icon: <FaHeart /> },
        { name: "Help", icon: <FaQuestionCircle /> },
    ];

    return (
        <div className="flex flex-col h-full justify-between p-4">
            {/* Logo */}
            <div className="text-2xl font-bold text-blue-600 mb-4">Keya</div>

            {/* Menu */}
            <nav className="flex flex-col gap-4">
                {menuItems.map((item) => (
                    <button
                        key={item.name}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-left text-sm font-medium hover:bg-blue-50 focus:outline-none transition-all ${item.active ? "bg-blue-100 text-blue-700" : "text-gray-700"}`}
                    >
                        {item.icon}
                        {item.name}
                    </button>
                ))}
            </nav>

            {/* Logout */}
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 font-medium hover:bg-red-50 rounded-lg">
                <FaSignOutAlt /> Logout
            </button>
        </div>
    );
};

export default Sidebar;
