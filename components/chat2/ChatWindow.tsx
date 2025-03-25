import React from "react";

const ChatWindow = () => {
    return (
        <div className="flex flex-col h-full p-6 space-y-4">
            {/* Header */}
            <div className="text-xl font-semibold text-gray-800 mb-2">Chat</div>
            <div className="text-sm text-gray-500 mb-4">August 21</div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mb-4">
                {[
                    "Search Properties",
                    "Track Market Trends",
                    "Answer Legal Questions",
                    "Filter Your Search Preferences",
                ].map((action) => (
                    <button
                        key={action}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-lg border border-blue-200"
                    >
                        {action}
                    </button>
                ))}
            </div>

            {/* Placeholder message */}
            <div className="bg-teal-100 text-teal-900 p-4 rounded-lg max-w-md">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.
            </div>

            {/* Message input */}
            <form className="mt-auto pt-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Write a message..."
                        className="w-full p-4 pr-12 bg-white border border-gray-300 rounded-xl shadow-sm"
                    />
                    <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatWindow;
