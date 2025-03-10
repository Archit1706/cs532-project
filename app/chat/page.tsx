"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
// At the top with other imports
import ReactMarkdown from 'react-markdown';

interface Message {
    id: number;
    type: 'user' | 'bot';
    content: string;
}

// Add error property to LocationResult interface
interface LocationResult {
    title: string;
    address: string;
    distance?: number;
    category?: string;
}

// Add error property to the data responses
interface LocationResponse {
    results: LocationResult[];
    error?: string;
}
interface LocationData {
    restaurants: LocationResult[];
    transit: LocationResult[];
    zipCode: string;
}

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            type: 'bot',
            content: 'I can help you search properties, track market trends, set preferences, and answer legal questions. What would you like to know?'
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [searchedZipCodes, setSearchedZipCodes] = useState<string[]>([]);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    
    // Zip code and location data
    const [zipCode, setZipCode] = useState<string>('02108'); // Default Boston zip code
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Check backend connectivity on component mount
    useEffect(() => {
        const checkBackendStatus = async () => {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                
                if (data.backend === 'connected') {
                    console.log('Backend connected:', data);
                    setBackendStatus('connected');
                } else {
                    console.error('Backend connection issue:', data);
                    setBackendStatus('error');
                }
            } catch (error) {
                console.error('Health check error:', error);
                setBackendStatus('error');
            }
        };
        
        checkBackendStatus();
        fetchLocationData('02108'); // Load default Boston data on mount
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Fetch location data based on zip code
    const fetchLocationData = async (zip: string) => {
        if (!zip || zip.length < 5) return;
        
        setIsLoadingLocation(true);
        setLocationError(null);
        
        try {
            // Fetch restaurants near the zip code
            const restaurantsResponse = await fetch('/api/location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    zipCode: zip,
                    type: 'Restaurants'
                }),
            });

            // Fetch transit stops near the zip code
            const transitResponse = await fetch('/api/location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    zipCode: zip,
                    type: 'Transit station'
                }),
            });

            // Check for errors but don't throw - we'll handle missing data gracefully
            if (!restaurantsResponse.ok) {
                console.warn(`Restaurant search failed: ${restaurantsResponse.status}`);
            }
            
            if (!transitResponse.ok) {
                console.warn(`Transit search failed: ${transitResponse.status}`);
            }

        // These are safe parsings that won't throw if the response returns a proper JSON error
// These are safe parsings that won't throw if the response returns a proper JSON error
    let restaurantsData: LocationResponse = { results: [] };
    let transitData: LocationResponse = { results: [] };
        
        if (restaurantsResponse.ok) {
            restaurantsData = await restaurantsResponse.json();
        } else {
            // Still try to get error message
            try {
                const errorData = await restaurantsResponse.json();
                restaurantsData = { results: [], error: errorData.error || "Failed to fetch restaurants" };
            } catch (e) {
                restaurantsData = { results: [], error: "Failed to fetch restaurants" };
            }
        }

                // Same for transit data
                if (transitResponse.ok) {
                    transitData = await transitResponse.json();
                } else {
                    try {
                        const errorData = await transitResponse.json();
                        transitData = { results: [], error: errorData.error || "Failed to fetch transit stations" };
                    } catch (e) {
                        transitData = { results: [], error: "Failed to fetch transit stations" };
                    }
                }
                
            // Handle case where we have valid responses but no data
            if (restaurantsData.results?.length === 0 && transitData.results?.length === 0) {

                    setLocationError(
                        "Unable to find location data for this zip code"
                    );
                    //setLocationError("No nearby restaurants or transit stations found for this zip code.");
            }

        // Update state with whatever data we have - even if partial
        setLocationData({
            restaurants: restaurantsData.results || [],
            transit: transitData.results || [],
            zipCode: zip
        });

        if (restaurantsData.error || transitData.error) {
            setLocationError(
                `${restaurantsData.error || ""} ${transitData.error || ""}`.trim() || 
                "Unable to find location data for this zip code"
            );
        } else {
            setLocationError(null);
        }
        } catch (error) {
            console.error('Error fetching location data:', error);
            setLocationError("Failed to fetch location data. Please try again.");
        } finally {
            setIsLoadingLocation(false);
        }
    };

    // Update handleZipCodeChange to track zip codes
    const handleZipCodeChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Add the zip code to the list if it's not already there
        if (!searchedZipCodes.includes(zipCode)) {
            setSearchedZipCodes(prev => [...prev, zipCode]);
        }
        
        fetchLocationData(zipCode);
    };


    

 // Update saveChatHistory function to accept messages as parameter
const saveChatHistory = async (messagesToSave = messages) => {
    if (messagesToSave.length <= 1) return; // Don't save if only system message
    
    try {
        const response = await fetch('/api/save_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                messages: messagesToSave,
                zipCodes: searchedZipCodes
            }),
        });
        
        const data = await response.json();
        console.log("Chat saved automatically:", data.file_key);
    } catch (error) {
        console.error('Error auto-saving chat:', error);
    }
};

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        // When creating user messages
        const userMessage: Message = {
            id: Date.now(), // Use timestamp instead of length
            type: 'user',
            content: inputMessage
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Prepare location context to send to the LLM
            let locationContext = '';
            if (locationData) {
                locationContext = `User's location: Zip code ${locationData.zipCode}. `;
                
                if (locationData.restaurants.length > 0) {
                    locationContext += `Nearby restaurants: ${locationData.restaurants.slice(0, 3).map(r => r.title).join(', ')}. `;
                }
                
                if (locationData.transit.length > 0) {
                    locationContext += `Nearby transit: ${locationData.transit.slice(0, 3).map(t => t.title).join(', ')}. `;
                }
            }
            
            console.log('Sending message to backend with location context:', locationContext);
            
            // Make API call to the Next.js API route
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    session_id: sessionId,
                    location_context: locationContext
                }),
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            
            // Save the session ID if it's the first message
            if (!sessionId && data.session_id) {
                setSessionId(data.session_id);
            }

            // Format the bot message
            // When creating bot messages
            const botMessage: Message = {
                id: Date.now() + 1, // Ensure uniqueness
                type: 'bot',
                content: data.response
            };
            
            //setMessages(prev => [...prev, botMessage]);

        // After receiving the response and updating messages
        setMessages(prev => {
            const updatedMessages = [...prev, botMessage];
            // Automatically save chat history after updating messages
            saveChatHistory(updatedMessages);
            return updatedMessages;
        }
    
    );

        } catch (error) {
            console.error('Error sending message:', error);
            
            // Show detailed error message
            const errorMessage: Message = {
                id: messages.length + 2,
                type: 'bot',
                content: `Error: I couldn't process your request. ${error instanceof Error ? error.message : 'Please try again later.'}`
            };
            
            setMessages(prev => [...prev, errorMessage]);
            setBackendStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    // Format message content with line breaks
    // Replace the formatMessageContent function with this:
    // Corrected formatMessageContent function

    // Fixed formatMessageContent function
    const formatMessageContent = (content: string) => {
      // Check if content likely contains markdown
      if (content.includes('#') || content.includes('**') || content.includes('*')) {
        return (
            <div className="markdown">
            <ReactMarkdown>
                {content}
            </ReactMarkdown>
            </div>
        );
      }
      
      // Fallback for non-markdown content
      return content.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < content.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="container mx-auto p-6 flex gap-6">
                {/* Left Panel: Chat UI */}
                <div className="w-1/2">
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200 flex flex-col h-[600px]">
                        {/* Backend Status */}
                        {backendStatus === 'error' && (
                            <div className="px-4 py-2 bg-rose-100 text-rose-700 text-sm border-b border-rose-200">
                                ⚠️ Backend connection issue. Chat responses may be unavailable.
                            </div>
                        )}
                        
                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-4 rounded-2xl ${message.type === 'user'
                                            ? 'bg-slate-900 text-white rounded-tr-none'
                                            : 'bg-white/95 text-slate-800 border border-slate-200 rounded-tl-none'
                                            }`}
                                    >
                                        {formatMessageContent(message.content)}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/95 border border-slate-200 p-4 rounded-2xl rounded-tl-none">
                                        <div className="flex space-x-2">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-slate-200">
                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Type your question here..."
                                    className="w-full p-4 pr-16 bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all duration-200"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200 disabled:bg-slate-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>


                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Location Info & Market Overview */}
                <div className="w-1/2 space-y-6">
                    {/* Zip Code Input */}
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200">
                        <form onSubmit={handleZipCodeChange} className="flex items-end gap-2">
                            <div className="flex-1">
                                <label htmlFor="zipCode" className="block text-slate-700 font-medium mb-2">
                                    Location (Zip Code) <span className="text-xs text-slate-500">US only</span>
                                </label>
                                <input
                                    id="zipCode"
                                    type="text"
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                    placeholder="Enter US zip code..."
                                    className="w-full p-3 bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all duration-200"
                                    maxLength={5}
                                    pattern="[0-9]{5}"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoadingLocation || zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)}
                                className="px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors duration-200 disabled:bg-slate-300"
                            >
                                {isLoadingLocation ? (
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                ) : "Update"}
                            </button>
                        </form>
                    </div>
                    
                    {/* Location Error */}
                    {locationError && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
                            <div className="flex items-center">
                                <span className="mr-2">⚠️</span>
                                <span>{locationError}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Location Data */}
                    {locationData && (
                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-800 mb-4">
                                Area Information: {locationData.zipCode}
                            </h2>
                            
                            {/* Restaurants */}
                            <div className="mb-5">
                                <h3 className="text-md font-medium text-slate-700 mb-2 flex items-center">
                                    <span className="mr-2">🍽️</span> Nearby Restaurants
                                </h3>
                                <div className="max-h-36 overflow-y-auto space-y-2 pr-2">
                                    {locationData.restaurants.length > 0 ? (
                                        locationData.restaurants.slice(0, 5).map((restaurant, index) => (
                                            <div key={index} className="p-2 bg-white rounded-lg border border-slate-200">
                                                <div className="font-medium text-slate-800">{restaurant.title}</div>
                                                <div className="text-sm text-slate-500">{restaurant.address}</div>
                                                {restaurant.distance && (
                                                    <div className="text-sm text-slate-600 mt-1">
                                                        {restaurant.distance.toFixed(1)} miles away
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-slate-500 text-sm p-2">No restaurants found nearby.</div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Transit */}
                            <div>
                                <h3 className="text-md font-medium text-slate-700 mb-2 flex items-center">
                                    <span className="mr-2">🚇</span> Public Transit Options
                                </h3>
                                <div className="max-h-36 overflow-y-auto space-y-2 pr-2">
                                    {locationData.transit.length > 0 ? (
                                        locationData.transit.slice(0, 5).map((station, index) => (
                                            <div key={index} className="p-2 bg-white rounded-lg border border-slate-200">
                                                <div className="font-medium text-slate-800">{station.title}</div>
                                                <div className="text-sm text-slate-500">{station.address}</div>
                                                {station.distance && (
                                                    <div className="text-sm text-slate-600 mt-1">
                                                        {station.distance.toFixed(1)} miles away
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-slate-500 text-sm p-2">No transit stations found nearby.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Market Overview */}
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4">Market Overview</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-white rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        {locationData?.zipCode ? `${locationData.zipCode} Area` : "Boston, MA"}
                                    </h3>
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                                        Updated today
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Median Home Price</span>
                                        <div>
                                            <span className="font-medium text-slate-800">$785,000</span>
                                            <span className="ml-2 text-emerald-600 text-sm">+3.2%</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Days on Market</span>
                                        <div>
                                            <span className="font-medium text-slate-800">24 days</span>
                                            <span className="ml-2 text-rose-600 text-sm">-5%</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Buyer Demand</span>
                                        <span className="font-medium text-slate-800">High</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link href="/find_homes" className="px-3 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer text-sm">
                                    🔥 Hottest Listings
                                </Link>
                                <Link href="/preferences" className="px-3 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer text-sm">
                                    💎 Set Preferences
                                </Link>
                                <Link href="/market-trends" className="px-3 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer text-sm">
                                    📊 Market Trends
                                </Link>
                                <Link href="/legal" className="px-3 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer text-sm">
                                    ⚖️ Legal Info
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Chat;