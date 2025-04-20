// context/ChatContext.tsx
import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { Message, Property, LocationData, FeatureExtraction } from '../types/chat';
import { fetchLocationData as fetchLocationDetails } from '../utils/locationUtils';
import { extractFeaturesWithLLM } from '../utils/llmFeatureExtractor';

export const ChatContext = createContext<any>(null);
export const useChatContext = () => useContext(ChatContext);

interface UIComponentLink {
  type: 'market' | 'property' | 'restaurants' | 'transit' | 'propertyDetail';
  label: string;
  data?: any;
}

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [messages, setMessages] = useState<Message[]>([{
        id: 1,
        type: 'bot',
        content: 'I can help you search properties, track market trends, set preferences, and answer legal questions. What would you like to know?'
    }]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
    const [zipCode, setZipCode] = useState('');
    const [properties, setProperties] = useState<Property[]>([]);
    const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [marketTrends, setMarketTrends] = useState<any>(null);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [activeTab, setActiveTab] = useState<'explore' | 'saved' | 'updates'>('explore');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isLoadingProperties, setIsLoadingProperties] = useState(false);
    const [isLoadingMarketTrends, setIsLoadingMarketTrends] = useState<boolean>(false);
    const [isPropertyChat, setIsPropertyChat] = useState(false);
    const [propertyDetails, setPropertyDetails] = useState<any>(null);
    const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleUILink = (link: UIComponentLink) => {
        console.log('UI link clicked:', link);
        
        // Set the appropriate tab based on link type
        setActiveTab('explore');
        
        // Handle specific component activations
        switch(link.type) {
            case 'market':
                console.log('Activating market trends tab');
                setActiveTab('explore');
                break;
            case 'property':
                console.log('Activating properties tab');
                // If data includes a specific property, select it
                if (link.data && typeof link.data === 'object') {
                    setSelectedProperty(link.data);
                }
                break;
            case 'restaurants':
                console.log('Activating restaurants tab');
                setActiveTab('explore');
                break;
            case 'transit':
                console.log('Activating transit tab');
                setActiveTab('explore');
                break;
            case 'propertyDetail':
                console.log('Viewing specific property details', link.data);
                // If data includes a property ID, load property details
                if (link.data && link.data.zpid) {
                    loadPropertyChat(link.data.zpid);
                }
                break;
            default:
                console.warn('Unknown UI link type:', link.type);
        }
    };

    const createLinkableContent = (message: string) => {
        // Define patterns to detect UI link mentions
        const patterns = [
            {
                regex: /\[\[market(?:\s+trends)?\]\]/gi,
                replacement: '<a href="#" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="market">market trends</a>'
            },
            {
                regex: /\[\[properties\]\]/gi,
                replacement: '<a href="#" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="property">properties</a>'
            },
            {
                regex: /\[\[restaurants\]\]/gi,
                replacement: '<a href="#" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="restaurants">restaurants</a>'
            },
            {
                regex: /\[\[transit\]\]/gi,
                replacement: '<a href="#" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="transit">transit options</a>'
            }
        ];
        
        // Process each pattern
        let processedContent = message;
        patterns.forEach(pattern => {
            processedContent = processedContent.replace(pattern.regex, pattern.replacement);
        });
        
        // Also create property links for specific properties being discussed
        if (selectedProperty) {
            const propertyPattern = new RegExp(`\\b(this|the current|the selected|your) (property|condo|home|house)\\b`, 'gi');
            processedContent = processedContent.replace(propertyPattern, 
                `<a href="#" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertyDetail" data-zpid="${selectedProperty.zpid}">$1 $2</a>`);
        }
        
        return processedContent;
    };

    const fetchMarketTrends = async (location?: string, zipCode?: string) => {
        console.log('Fetching market trends for:', location || zipCode);

        setIsLoadingMarketTrends(true);

        // Use non-blocking pattern
        fetch('/api/market_trends', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location: location,
                zipCode: zipCode
            }),
        }).then(async response => {
            if (!response.ok) {
                throw new Error(`Market trends API returned ${response.status}`);
            }

            const data = await response.json();
            console.log('Market trends data:', data);

            setMarketTrends(data);
            
            // Update questions based on new market data
            setTimeout(generateFollowUpQuestions, 300);
            
        }).catch(error => {
            console.error('Error fetching market trends:', error);
        }).finally(() => {
            setIsLoadingMarketTrends(false);
        });
    };

    const fetchLocationData = async (zip: string) => {
        try {
            // Fetch location data and update UI immediately when it arrives
            fetchLocationDetails(zip).then(locationResult => {
                setLocationData(locationResult);
                console.log('Location data loaded:', locationResult);
                
                // Generate questions as soon as location data is available
                if (locationResult) {
                    setTimeout(generateFollowUpQuestions, 300);
                }
            }).catch(err => {
                console.error('Failed to fetch location details:', err);
            });

            // Start fetching properties in parallel
            setIsLoadingProperties(true);
            fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zipCode: zip })
            }).then(async propertiesResponse => {
                console.log('Properties response:', propertiesResponse);
                const propertiesData = await propertiesResponse.json();
                setProperties(propertiesData.results || []);
                setIsLoadingProperties(false);
                console.log('Properties loaded:', propertiesData.results?.length || 0);
                
                // Generate new follow-up questions after properties data is loaded
                setTimeout(generateFollowUpQuestions, 300);
            }).catch(err => {
                console.error('Failed to fetch properties:', err);
                setIsLoadingProperties(false);
            });
            
        } catch (error) {
            console.error('Failed to initiate data fetching:', error);
            setIsLoadingProperties(false);
        }
    };

    const loadPropertyChat = async (propertyId: string) => {
        try {
            setIsPropertyChat(true);
            setSelectedProperty(null);
            const res = await fetch('/api/property_details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zpid: propertyId })
            });
            const json = await res.json();
            setPropertyDetails(json.results);
            console.log('Property details loaded:', json.results);

            if (json.results && json.results.basic_info) {
                const basic = json.results.basic_info;
                const mockProperty = {
                    id: propertyId,
                    address: basic.address?.full || '',
                    price: basic.price,
                    beds: basic.bedrooms,
                    baths: basic.bathrooms,
                    sqft: basic.livingArea,
                    type: basic.homeType,
                    imgSrc: json.results.images?.[0] || '',
                    zpid: propertyId,
                };
                setSelectedProperty(mockProperty);
                if (json.results.basic_info?.address?.zipcode) {
                    setZipCode(json.results.basic_info.address.zipcode);
                }
            }
            
            // Generate property-specific follow-up questions
            setTimeout(generateFollowUpQuestions, 300);
        } catch (error) {
            console.error('Failed to load property details:', error);
        }
    };

    const debugFeatureExtraction = async (message: string) => {
        try {
            console.log('🔍 DEBUG: Feature extraction for:', message);
            const features = await extractFeaturesWithLLM(message);
            console.group('📊 FEATURE EXTRACTION DEBUG');
            console.log(JSON.stringify(features, null, 2));
            console.groupEnd();
            return features;
        } catch (error) {
            console.error('Feature extraction debug error:', error);
            return null;
        }
    };

    const generateFollowUpQuestions = async () => {
        if (messages.length < 2) return; // Only generate after some conversation

        try {
            const recentMessages = messages.slice(-4); // Get last 4 messages
            const conversationContext = recentMessages.map(msg => 
                `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n');

            // Create context based on UI state
            let uiContext = "Current UI state:";
            if (properties.length > 0) uiContext += ` Showing ${properties.length} properties in the UI.`;
            if (locationData?.restaurants?.length) uiContext += ` Showing ${locationData.restaurants.length} restaurants nearby.`;
            if (locationData?.transit?.length) uiContext += ` Showing ${locationData.transit.length} transit options nearby.`;
            if (marketTrends) uiContext += ` Showing market trends for ${marketTrends.location}.`;
            if (selectedProperty) uiContext += ` User is viewing details for a ${selectedProperty.beds}bd ${selectedProperty.baths}ba ${selectedProperty.type}.`;
            if (zipCode) uiContext += ` Current zip code is ${zipCode}.`;

            const promptForQuestions = `
            Based on this conversation and UI state, suggest 3 natural follow-up questions the user might want to ask next:
            
            ${conversationContext}
            
            ${uiContext}
            
            Generate 3 brief, conversational follow-up questions (each under 70 characters) that would make sense as the next question.
            Return only the questions, one per line, with no numbering or explanation.
            `;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: promptForQuestions,
                    session_id: sessionId,
                    is_system_query: true
                }),
            });

            const data = await response.json();
            
            // Extract questions from response
            const questions = data.response.split('\n')
                .map((line: string) => line.trim())
                .filter((line: string) => line && line.length > 0 && line.length < 70 && (line.endsWith('?') || line.includes('?')))
                .slice(0, 3); // Take max 3 questions
                
            if (questions.length > 0) {
                setDynamicQuestions(questions);
            }
        } catch (error) {
            console.error('Failed to generate follow-up questions:', error);
            // Fallback to default questions if generation fails
            setDynamicQuestions([
                "What's the market like in this area?",
                "What are property taxes like here?", 
                "Are home prices rising or falling here?"
            ]);
        }
    };

// Improved handleSendMessage with immediate query display
// Update this in ChatContext.tsx

const handleSendMessage = async (message: string, clearInput: (msg: string) => void) => {
    if (!message.trim()) return;

    // Generate IDs for this message sequence
    const requestId = Date.now();
    const userMsgId = requestId;
    const loadingMsgId = requestId + 1;
    const finalResponseId = requestId + 2;
    
    // IMMEDIATELY display user message
    const userMessage: Message = {
        id: userMsgId,
        type: 'user',
        content: message,
    };
    
    // Update UI with user message immediately
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInputMessage('');
    clearInput('');
    
    // Wait a moment for UI to update before starting the loading state
    setTimeout(() => {
        setIsLoading(true);
        
        // Automatically scroll to bottom after user message is added
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, 50);

    // Extract features for smarter response handling
    const features = await debugFeatureExtraction(message);

    // Determine what kind of request this is
    const isDataRequest = features?.queryType === 'property_search' || 
                         features?.actionRequested === 'show_listings' ||
                         features?.actionRequested === 'analyze_market' ||
                         features?.actionRequested === 'show_restaurants' ||
                         features?.actionRequested === 'show_transit';

    // If zip code not set, any new question is likely a data request
    const needsZipCode = !zipCode && (message.toLowerCase().includes('property') || 
                                      message.toLowerCase().includes('home') ||
                                      message.toLowerCase().includes('market') ||
                                      message.toLowerCase().includes('area'));

    // Track if we're showing a loading message to avoid duplicate requests
    let showingLoadingMessage = false;

    if ((isDataRequest || needsZipCode) && zipCode) {
        showingLoadingMessage = true;
        let loadingMessage = "Got it! ";
        
        if (needsZipCode) {
            loadingMessage += "First, please enter a zip code in the box below so I can find properties in your area.";
        } else if (features?.actionRequested === 'show_listings' || features?.queryType === 'property_search') {
            loadingMessage += "I'm fetching properties that match your criteria. This will just take a moment...";
            setActiveTab('explore');
        } else if (features?.actionRequested === 'analyze_market') {
            loadingMessage += "I'm gathering the latest market data for this area. One moment please...";
            setActiveTab('explore');
        } else if (features?.actionRequested === 'show_restaurants') {
            loadingMessage += "Looking up restaurants in this area...";
            setActiveTab('explore');
        } else if (features?.actionRequested === 'show_transit') {
            loadingMessage += "Checking transit options nearby...";
            setActiveTab('explore');
        }
        
        const immediateResponse: Message = {
            id: loadingMsgId,
            type: 'bot',
            content: loadingMessage
        };
        
        setMessages(prev => [...prev, immediateResponse]);
        
        // Scroll to the loading message
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 50);
    }

    try {
        // Create a detailed UI context object
        const uiContext = {
            currentProperty: selectedProperty ? {
                zpid: selectedProperty.zpid,
                address: selectedProperty.address,
                price: selectedProperty.price,
                beds: selectedProperty.beds,
                baths: selectedProperty.baths,
                type: selectedProperty.type
            } : null,
            propertyDetails: propertyDetails ? {
                address: propertyDetails.basic_info?.address?.full || null,
                price: propertyDetails.basic_info?.price || null,
                yearBuilt: propertyDetails.basic_info?.yearBuilt || null,
                propertyTaxes: propertyDetails.taxes && propertyDetails.taxes.length > 0 ? 
                    propertyDetails.taxes[0].taxPaid : null,
            } : null,
            propertiesCount: properties.length,
            activeTab: activeTab,
            zipCode: zipCode,
            hasRestaurants: (locationData?.restaurants?.length ?? 0) > 0,
            restaurantCount: locationData?.restaurants?.length || 0,
            hasTransit: (locationData?.transit?.length ?? 0) > 0,
            transitCount: locationData?.transit?.length || 0,
            hasMarketData: marketTrends !== null,
            marketLocation: marketTrends?.location || null
        };

        console.log('Sending UI context to LLM:', uiContext);

        // Only make the API call once
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                session_id: sessionId,
                zipCode,
                // Add extracted features and current UI state to provide context
                feature_context: JSON.stringify({
                    extracted: features,
                    ui_context: uiContext
                }),
                location_context: zipCode || '{}'
            }),
        });

        const data = await response.json();
        
        // Process the response to make UI elements clickable
        const processedResponse = createLinkableContent(data.response);

        // Replace loading message if it exists
        if (showingLoadingMessage) {
            setMessages((prev: Message[]) => {
                // Remove the loading message by filtering out the message with loadingMsgId
                const withoutLoading = prev.filter(msg => msg.id !== loadingMsgId);
                // Add the real response with the finalResponseId
                return [...withoutLoading, {
                    id: finalResponseId,
                    type: 'bot',
                    content: processedResponse,
                    rawContent: data.response
                }];
            });
        } else {
            // Add as normal if no loading message was shown
            const botMessage: Message = {
                id: finalResponseId,
                type: 'bot',
                content: processedResponse,
                rawContent: data.response
            };
            setMessages((prev: Message[]) => [...prev, botMessage]);
        }

        if (!sessionId && data.session_id) setSessionId(data.session_id);
        
        // Generate new follow-up questions after response is received
        setTimeout(generateFollowUpQuestions, 500);
        
        // Scroll to bottom after response is added
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    } catch (error: any) {
        setMessages((prev: Message[]) => [...prev, {
            id: Date.now() + 3,
            type: 'bot',
            content: `Error: I couldn't process your request. ${error.message || 'Please try again later.'}`
        }]);
        
        // Scroll to error message
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 50);
    } finally {
        setIsLoading(false);
    }
};

    useEffect(() => {
        if (zipCode.length === 5) {
            console.log('Starting parallel data fetching for zip code:', zipCode);
            
            // Start both data fetching operations in parallel
            // They'll update the UI as results come in
            fetchLocationData(zipCode);
            fetchMarketTrends(zipCode, zipCode);
            
            // Add a "searching" message if one doesn't exist already
            setMessages(prevMessages => {
                // Check if the last message is already a bot message about searching
                const lastMessage = prevMessages[prevMessages.length - 1];
                if (lastMessage?.type === 'bot' && 
                    (lastMessage.content.includes("fetching") || 
                     lastMessage.content.includes("gathering") || 
                     lastMessage.content.includes("searching"))) {
                    return prevMessages;
                }
                
                // Otherwise add a new searching message
                return [...prevMessages, {
                    id: Date.now(),
                    type: 'bot',
                    content: "I'm fetching information for this area. The data will appear in the panel on the right as it becomes available."
                }];
            });
        }
    }, [zipCode]);

    useEffect(() => {
        if (propertyDetails && propertyDetails.nearbyHomes && propertyDetails.nearbyHomes.length > 0) {
            setNearbyProperties(
                propertyDetails.nearbyHomes.map((home: any) => ({
                    id: home.zpid,
                    address: home.address?.streetAddress || '',
                    price: home.price || 0,
                    beds: home.bedrooms || 0,
                    baths: home.bathrooms || 0,
                    sqft: home.livingArea || 0,
                    type: home.homeType || 'property',
                    imgSrc: home.miniCardPhotos?.[0]?.url || '',
                    zpid: home.zpid || '',
                }))
            );
        }
    }, [propertyDetails]);

    // Initialize dynamic questions on first load
    useEffect(() => {
        setDynamicQuestions([
            "What's the market like in this area?",
            "What are property taxes like here?", 
            "Are home prices rising or falling here?"
        ]);
    }, []);

    return (
        <ChatContext.Provider
            value={{
                messages, setMessages,
                inputMessage, setInputMessage,
                isLoading, setIsLoading,
                sessionId, setSessionId,
                backendStatus, setBackendStatus,
                zipCode, setZipCode,
                properties, setProperties,
                locationData, setLocationData,
                marketTrends, setMarketTrends,
                selectedProperty, setSelectedProperty,
                activeTab, setActiveTab,
                selectedLanguage, setSelectedLanguage,
                isTranslating, setIsTranslating,
                isLoadingProperties, setIsLoadingProperties,
                isLoadingMarketTrends, setIsLoadingMarketTrends,
                propertyDetails, setPropertyDetails,
                isPropertyChat, setIsPropertyChat,
                nearbyProperties, setNearbyProperties,
                dynamicQuestions, setDynamicQuestions,
                handleUILink, createLinkableContent,
                fetchMarketTrends,
                fetchLocationData,
                loadPropertyChat,
                messagesEndRef,
                handleSendMessage,
                generateFollowUpQuestions,
                debugFeatureExtraction // Expose for debugging
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};