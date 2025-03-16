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
  const [zipCode, setZipCode] = useState<string>(''); // Changed to empty by default
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null); // Added for property details view

  const [searchedZipCodes, setSearchedZipCodes] = useState<string[]>([]);
  // const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Zip code and location data
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);


  // Add to your state variables
  const [activeTab, setActiveTab] = useState<'restaurants' | 'transit' | 'properties' | 'market' | null>('restaurants');
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState<boolean>(false);

  interface Property {
    imgSrc?: string;
    address: string;
    price: number | string;
    beds: number;
    baths: number;
    sqft: number | string;
    type: string;
  }


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
  // Use a single useEffect for scroll behavior
  useEffect(() => {
    if (messagesEndRef.current) {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
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



    // Also fetch properties data
    try {
      setIsLoadingProperties(true);
      const propertiesResponse = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCode: zip
        }),
      });

      const propertiesData = await propertiesResponse.json();
      console.log("Properties data:", propertiesData);

      setProperties(propertiesData.results || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoadingProperties(false);
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
        <div className="w-2/5">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200 flex flex-col h-[600px]">
            {/* Messages Container */}
            <div id="chat-container" className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll">
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

            {/* Quick question buttons */}
            <div className="p-3 border-t border-slate-200 flex flex-wrap gap-2">
              <button
                onClick={() => setInputMessage("What's the market like in this area?")}
                className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
              >
                Market trends?
              </button>
              <button
                onClick={() => setInputMessage("What are property taxes like here?")}
                className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
              >
                Property taxes?
              </button>
              <button
                onClick={() => setInputMessage("Are home prices rising or falling here?")}
                className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
              >
                Price trends?
              </button>
            </div>

            {/* Message Input with Zip Code */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your question here..."
                    className="w-full p-4 pr-16 bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl"
                  />
                  <button
                    type="submit"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>

                <div className="w-32">
                  <div className="bg-teal-500 text-white rounded-xl overflow-hidden">
                    <input
                      id="zipCode"
                      type="text"
                      value={zipCode}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 5) {
                          setZipCode(value);
                          // Auto-fetch when 5 digits entered
                          if (value.length === 5) {
                            fetchLocationData(value);
                          }
                        }
                      }}
                      placeholder="Zip code..."
                      className="w-full p-3 bg-transparent placeholder-white/80 text-white border-none focus:ring-0 outline-none text-center"
                      maxLength={5}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-3/5 space-y-4">
          {selectedProperty ? (
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200 animate-fadeIn relative">
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100"
              >
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-xl font-semibold text-slate-800 mb-4">Property Listing</h2>

              {/* Full Property Details */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="h-64 overflow-hidden">
                  <img
                    src={selectedProperty.imgSrc || "https://via.placeholder.com/800x400?text=No+Image"}
                    alt={selectedProperty.address}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="font-bold text-2xl text-slate-800">
                    {typeof selectedProperty.price === 'number' ? `$${selectedProperty.price.toLocaleString()}` : selectedProperty.price}
                  </div>
                  <div className="text-slate-600 mb-3">{selectedProperty.address}</div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-slate-800">{selectedProperty.beds}</div>
                      <div className="text-slate-600 text-sm">Beds</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-slate-800">{selectedProperty.baths}</div>
                      <div className="text-slate-600 text-sm">Baths</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-slate-800">{typeof selectedProperty.sqft === 'number' ? selectedProperty.sqft.toLocaleString() : selectedProperty.sqft}</div>
                      <div className="text-slate-600 text-sm">Sq Ft</div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="font-semibold text-slate-800 mb-2">Property Type</div>
                    <div className="text-slate-600">{selectedProperty.type}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : locationData ? (
            <>
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200 animate-fadeIn">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">
                  Area Information: {locationData.zipCode}
                </h2>

                {/* Thick tabs with counters */}
                <div className="flex border-b border-slate-200 mb-4">
                  <button
                    onClick={() => setActiveTab(activeTab === 'properties' ? null : 'properties')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'properties'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    🏠 Properties
                    <span className="ml-2 bg-slate-200 px-2 py-1 rounded-full text-xs">
                      {properties.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab(activeTab === 'restaurants' ? null : 'restaurants')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'restaurants'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    🍽️ Restaurants
                    <span className="ml-2 bg-slate-200 px-2 py-1 rounded-full text-xs">
                      {locationData.restaurants.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab(activeTab === 'transit' ? null : 'transit')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'transit'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    🚇 Transit
                    <span className="ml-2 bg-slate-200 px-2 py-1 rounded-full text-xs">
                      {locationData.transit.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab(activeTab === 'market' ? null : 'market')}
                    className={`flex items-center px-6 py-3 font-medium rounded-t-lg ${activeTab === 'market'
                        ? 'bg-white text-slate-800 border-t border-l border-r border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    📊 Market
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab && (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-2 animate-fadeIn">
                    {/* Properties Tab */}
                    {activeTab === 'properties' && (
                      isLoadingProperties ? (
                        <div className="flex justify-center p-4">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                        </div>
                      ) : properties.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {properties.slice(0, 6).map((property, index) => (
                            <div
                              key={index}
                              onClick={() => setSelectedProperty(property)}
                              className="bg-white rounded-lg border border-slate-200 overflow-hidden h-64 flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"

                            >
                              {property.imgSrc ? (
                                <div className="h-32 overflow-hidden">
                                  <img
                                    src={property.imgSrc}
                                    alt={property.address}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://via.placeholder.com/300x200?text=No+Image";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="h-32 bg-slate-100 flex items-center justify-center">
                                  <span className="text-slate-400">No image available</span>
                                </div>
                              )}
                              <div className="p-3 flex-1 flex flex-col">
                                <div className="font-medium text-slate-800 text-lg">
                                  {typeof property.price === 'number' ? `$${property.price.toLocaleString()}` : property.price}
                                </div>
                                <div className="text-xs text-slate-700 line-clamp-2 mb-1">{property.address}</div>
                                <div className="flex flex-wrap gap-2 mt-auto">
                                  <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">{property.beds} beds</span>
                                  <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">{property.baths} baths</span>
                                  <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">
                                    {typeof property.sqft === 'number' ? `${property.sqft.toLocaleString()} sqft` : `${property.sqft} sqft`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-700 text-sm p-2">No properties found in this area.</div>
                      )
                    )}

                    {/* Restaurants Tab */}
                    {activeTab === 'restaurants' && (
                      locationData.restaurants.length > 0 ? (
                        locationData.restaurants.slice(0, 5).map((restaurant, index) => (
                          <div key={index} className="p-3 bg-white rounded-lg border border-slate-200">
                            <div className="font-medium text-slate-800">{restaurant.title}</div>
                            <div className="text-sm text-slate-700">{restaurant.address}</div>
                            {restaurant.distance && (
                              <div className="text-sm text-slate-700 mt-1">
                                {restaurant.distance.toFixed(1)} miles away
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-700 text-sm p-2">No restaurants found nearby.</div>
                      )
                    )}

                    {/* Transit Tab */}
                    {activeTab === 'transit' && (
                      locationData.transit.length > 0 ? (
                        locationData.transit.slice(0, 5).map((station, index) => (
                          <div key={index} className="p-3 bg-white rounded-lg border border-slate-200">
                            <div className="font-medium text-slate-800">{station.title}</div>
                            <div className="text-sm text-slate-700">{station.address}</div>
                            {station.distance && (
                              <div className="text-sm text-slate-700 mt-1">
                                {station.distance.toFixed(1)} miles away
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-700 text-sm p-2">No transit stations found nearby.</div>
                      )
                    )}

                    {/* Market Tab */}
                    {activeTab === 'market' && (
                      <div className="p-4 bg-white rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-slate-800">
                            {locationData.zipCode} Area
                          </h3>
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                            Updated today
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700">Median Home Price</span>
                            <div>
                              <span className="font-medium text-slate-800">$785,000</span>
                              <span className="ml-2 text-emerald-600 text-sm">+3.2%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700">Days on Market</span>
                            <div>
                              <span className="font-medium text-slate-800">24 days</span>
                              <span className="ml-2 text-rose-600 text-sm">-5%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700">Buyer Demand</span>
                            <span className="font-medium text-slate-800">High</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Links/Actions Panel */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Explore More</h2>
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
            </>
          ) : (
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Welcome to RealEstateAI</h2>
              <p className="text-slate-600 mb-6">
                Ask our assistant about properties, market trends, or neighborhoods by chatting on the left.
                Enter a zip code to see local information.
              </p>
              <div className="flex justify-center">
                <div className="animate-bounce text-5xl">👈</div>
              </div>
            </div>
          )}
        </div>
      </div>


      <style jsx global>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-in-out;
            }
            
            .line-clamp-2 {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
          `}</style>
    </div>
  );
}
export default Chat;