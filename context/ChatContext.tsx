// context/ChatContext.tsx
import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { Message, Property, LocationData, FeatureExtraction, Agent } from '../types/chat';
import { fetchLocationData as fetchLocationDetails } from '../utils/locationUtils';
import { extractFeaturesWithLLM } from '../utils/llmFeatureExtractor';
// Add the import for property tab IDs
import { PROPERTY_TAB_IDS } from '../components/SinglePropertyOverview';


export const ChatContext = createContext<any>(null);
export const useChatContext = () => useContext(ChatContext);
// Define the section IDs for use in links (same as in InfoPanel.tsx)
export const SECTION_IDS = {
    PROPERTIES: 'properties-section',
    MARKET: 'market-trends-section',
    AMENITIES: 'local-amenities-section',
    TRANSIT: 'transit-section',
    AGENTS: 'agents-section',
};


interface UIComponentLink {
    element: any;
    type: 'market' | 'property' | 'restaurants' | 'transit' | 'propertyDetail' | 'propertyMarket' | 'propertyDetails' | 'propertyPriceHistory' | 'propertySchools' | 'propertyMarketAnalysis' | 'agents';
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
    const [activeTab, setActiveTab] = useState<'explore' | 'saved' | 'updates' | 'market' | 'properties' | 'restaurants' | 'transit' | 'ai'>('explore');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isLoadingProperties, setIsLoadingProperties] = useState(false);
    const [isLoadingMarketTrends, setIsLoadingMarketTrends] = useState<boolean>(false);
    const [isPropertyChat, setIsPropertyChat] = useState(false);
    const [propertyDetails, setPropertyDetails] = useState<any>(null);
    const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);

    const [propertyContext, setPropertyContext] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Add new state variables
    const [workflowState, setWorkflowState] = useState<string | null>(null);
    const [previousWorkflows, setPreviousWorkflows] = useState<Array<{ query: string, zipCode: string, timestamp: number }>>([]);

    const [agentContacts, setAgentContacts] = useState<Agent[]>([]);
    const [selectedAgentContact, setSelectedAgentContact] = useState<Agent | null>(null);
    const [agentMessages, setAgentMessages] = useState<{ [agentId: string]: Message[] }>({});


    // Add this function to add an agent to contacts
const addAgentToContacts = (agent: Agent) => {
    // Check if agent is already in contacts
    if (!agentContacts.some(contact => contact.encodedZuid === agent.encodedZuid)) {
      setAgentContacts(prev => [...prev, agent]);
    }
    // Set as the selected agent contact
    setSelectedAgentContact(agent);
  };

  // Add this function to send a message to an agent
const sendMessageToAgent = (agentId: string, message: string) => {
    const newMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: message,
    };
    
    // Add message to the agent's conversation
    setAgentMessages(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), newMessage]
    }));
    
    // Simulate a reply after a delay (for mock implementation)
    setTimeout(() => {
      const replyMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Thank you for your message. This is a mock reply from the agent.`,
      };
      
      setAgentMessages(prev => ({
        ...prev,
        [agentId]: [...(prev[agentId] || []), replyMessage]
      }));
    }, 1000);
  };

    // Update handleUILink function in ChatContext.tsx

    // Add to the UI context for backend
    const buildUIContext = () => {
        return {
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
            propertyContext: propertyContext, // Include full property context
            propertiesCount: properties.length,
            activeTab: activeTab,
            zipCode: zipCode,
            hasRestaurants: (locationData?.restaurants?.length ?? 0) > 0,
            restaurantCount: locationData?.restaurants?.length || 0,
            hasTransit: (locationData?.transit ?? []).length > 0,
            transitCount: locationData?.transit?.length || 0,
            hasMarketData: marketTrends !== null,
            marketLocation: marketTrends?.location || null,
            propertyTabsLinks: {
                details: `#${PROPERTY_TAB_IDS.DETAILS}`,
                priceHistory: `#${PROPERTY_TAB_IDS.PRICE_HISTORY}`,
                schools: `#${PROPERTY_TAB_IDS.SCHOOLS}`,
                marketAnalysis: `#${PROPERTY_TAB_IDS.MARKET_ANALYSIS}`
            }
        };
    };

    // Add new functions to manage workflow persistence
    const persistWorkflow = (query: string) => {
        if (zipCode) {
            // Store current workflow in history if we're changing workflows
            if (workflowState && workflowState !== query) {
                setPreviousWorkflows(prev => [
                    { query: workflowState, zipCode, timestamp: Date.now() },
                    ...prev.slice(0, 4) // Keep last 5 workflows
                ]);
            }
            setWorkflowState(query);
        }
    };

    const restorePreviousWorkflow = (index: number) => {
        if (previousWorkflows[index]) {
            const { query, zipCode: prevZipCode } = previousWorkflows[index];

            // Only change zip code if different
            if (prevZipCode !== zipCode) {
                setZipCode(prevZipCode);
            }

            // Set the workflow state and update the UI
            setWorkflowState(query);
            setPreviousWorkflows(prev => prev.filter((_, i) => i !== index));
            setActiveTab('ai'); // Ensure we're on the AI tab

            return true;
        }
        return false;
    };

/*
    const handleUILink = (link: UIComponentLink) => {
        console.log('UI link clicked:', link);

        // Handle property tab links
        if (['propertyDetails', 'propertyPriceHistory', 'propertySchools', 'propertyMarketAnalysis'].includes(link.type)) {
            // First ensure we're on a property details page
            if (isPropertyChat && propertyDetails) {
                // Map to the tab ID
                let tabId;
                switch (link.type) {
                    case 'propertyDetails':
                        tabId = PROPERTY_TAB_IDS.DETAILS;
                        break;
                    case 'propertyPriceHistory':
                        tabId = PROPERTY_TAB_IDS.PRICE_HISTORY;
                        break;
                    case 'propertySchools':
                        tabId = PROPERTY_TAB_IDS.SCHOOLS;
                        break;
                    case 'propertyMarketAnalysis':
                        tabId = PROPERTY_TAB_IDS.MARKET_ANALYSIS;
                        break;
                }

                // Switch to the tab
                if (tabId) {
                    // Use custom event to trigger tab change
                    document.dispatchEvent(new CustomEvent('switchToPropertyTab', {
                        detail: { tabId }
                    }));

                    // Scroll to the tab element
                    setTimeout(() => {
                        const element = document.getElementById(tabId);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 100);
                }
            } else if (selectedProperty) {
                // If we're not in property chat mode, load the property first
                console.log('Loading property before switching to tab');
                loadPropertyChat(selectedProperty.zpid);

                // Then switch to the tab after a delay
                setTimeout(() => {
                    const tabId = link.type === 'propertyDetails' ? PROPERTY_TAB_IDS.DETAILS :
                        link.type === 'propertyPriceHistory' ? PROPERTY_TAB_IDS.PRICE_HISTORY :
                            link.type === 'propertySchools' ? PROPERTY_TAB_IDS.SCHOOLS :
                                PROPERTY_TAB_IDS.MARKET_ANALYSIS;

                    console.log(`Switching to property tab: ${link.type} (${tabId})`);
                    document.dispatchEvent(new CustomEvent('switchToPropertyTab', {
                        detail: { tabId }
                    }));
                }, 1000);
            }

            return;
        }

        // FIX: First ensure we're in 'explore' tab when handling other link types
        setActiveTab('explore');

        // Handle other link types (market, restaurants, etc.)
        switch (link.type) {
            case 'market':
                console.log('Activating market trends tab');
                // First ensure market trends data is loaded
                if (!marketTrends && zipCode) {
                    fetchMarketTrends(undefined, zipCode);
                }

                // Scroll to the market section after a short delay to ensure UI is updated
                setTimeout(() => {
                    const marketSection = document.getElementById(SECTION_IDS.MARKET);
                    if (marketSection) {
                        marketSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
                break;

            case 'property':
                console.log('Activating properties tab');

                // If data includes a specific property, select it
                if (link.data && typeof link.data === 'object') {
                    setSelectedProperty(link.data);
                }

                // Scroll to the properties section
                setTimeout(() => {
                    const propertiesSection = document.getElementById(SECTION_IDS.PROPERTIES);
                    if (propertiesSection) {
                        propertiesSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
                break;

            case 'restaurants':
                console.log('Activating restaurants tab');
                if (locationData?.restaurants?.length === 0 && zipCode) {
                    fetchLocationData(zipCode);
                }

                // Scroll to the restaurants section
                setTimeout(() => {
                    const amenitiesSection = document.getElementById(SECTION_IDS.AMENITIES);
                    if (amenitiesSection) {
                        amenitiesSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
                break;

            case 'transit':
                console.log('Activating transit tab');
                if (locationData?.transit?.length === 0 && zipCode) {
                    fetchLocationData(zipCode);
                }

                // Scroll to the transit section
                setTimeout(() => {
                    const transitSection = document.getElementById(SECTION_IDS.TRANSIT);
                    if (transitSection) {
                        transitSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
                break;

            case 'propertyMarket':
                console.log('Viewing property market analysis');
                if (isPropertyChat && propertyDetails) {
                    setTimeout(() => {
                        console.log('Dispatching switchToPropertyMarketTab event');
                        document.dispatchEvent(new CustomEvent('switchToPropertyMarketTab'));
                    }, 100);
                } else if (selectedProperty) {
                    console.log('Loading property before switching to market tab');
                    loadPropertyChat(selectedProperty.zpid);

                    setTimeout(() => {
                        console.log('Dispatching switchToPropertyMarketTab event after loading property');
                        document.dispatchEvent(new CustomEvent('switchToPropertyMarketTab'));
                    }, 1000);
                }
                break;

            case 'agents':
                console.log('Activating agents tab');
                if (locationData?.agents?.length === 0 && zipCode) {
                    fetchLocationData(zipCode);
                }

                // Scroll to the agents section
                setTimeout(() => {
                    const agentsSection = document.getElementById(SECTION_IDS.AGENTS);
                    if (agentsSection) {
                        agentsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
                break;

            default:
                console.warn('Unknown UI link type:', link.type);
        }
    };
*/

    // Add this improved handleUILink function to your ChatContext.tsx

// Updated handleUILink function for cross-tab navigation
// Add this improved handleUILink function to your ChatContext.tsx

// Updated handleUILink function for cross-tab navigation
const handleUILink = (link: UIComponentLink) => {
    console.log('UI link clicked:', link);
    
    // Extract data attributes from the link element
    const forceTabSwitch = link.element?.dataset.forceTab === 'true';
    const targetTab = link.element?.dataset.tab;
    const propertyTab = link.element?.dataset.propertyTab;
    const section = link.element?.dataset.section;
    
    // If forceTabSwitch is true and a target tab is specified, switch to that tab
    if (forceTabSwitch && targetTab) {
        console.log(`Forcing tab switch to: ${targetTab}`);
        setActiveTab(targetTab as any);
    }
    
    // Handle property-specific links
    if (propertyTab && (isPropertyChat || selectedProperty)) {
        // If we're not already in property chat mode, load the property first
        if (!isPropertyChat && selectedProperty) {
            console.log('Loading property before switching tabs');
            loadPropertyChat(selectedProperty.zpid);
            
            // Set a timeout to allow property to load
            setTimeout(() => {
                // Dispatch event to switch to the specific property tab
                console.log(`Switching to property tab: ${propertyTab}`);
                document.dispatchEvent(new CustomEvent('switchToPropertyTab', {
                    detail: { 
                        tabId: propertyTab,
                        section: section // Pass section if specified (for scrolling to subsections)
                    }
                }));
            }, 1000);
        } else {
            // We're already in property chat, just switch tabs
            console.log(`Switching to property tab: ${propertyTab}`);
            document.dispatchEvent(new CustomEvent('switchToPropertyTab', {
                detail: { 
                    tabId: propertyTab,
                    section: section
                }
            }));
        }
        return;
    }
    
    // Handle main section links when we're in the explore tab
    if (activeTab === 'explore' || forceTabSwitch) {
        switch (link.type) {
            case 'market':
                scrollToSection(SECTION_IDS.MARKET);
                break;
            case 'property':
                scrollToSection(SECTION_IDS.PROPERTIES);
                break;
            case 'restaurants':
                scrollToSection(SECTION_IDS.AMENITIES);
                break;
            case 'transit':
                scrollToSection(SECTION_IDS.TRANSIT);
                break;
            case 'agents':
                scrollToSection(SECTION_IDS.AGENTS);
                break;
            default:
                console.warn('Unknown UI link type:', link.type);
        }
    }
};


// Helper function to scroll to a section with a small delay to ensure rendering
const scrollToSection = (sectionId: string) => {
    setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.warn(`Section not found: ${sectionId}`);
        }
    }, 100);
};
    // Update the createLinkableContent function
    // Enhanced createLinkableContent function
// 2. Update the createLinkableContent function to better handle HTML content
const createLinkableContent = (message: string) => {
    if (!message || typeof message !== 'string') {
        return message;
    }

    // Check if the message already contains HTML with data-ui-link attributes
    if (message.includes('data-ui-link')) {
        console.log("Message already contains UI links, skipping processing");
        return message;
    }

    // Process the UI links in the message
    return processUILinks(message);
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

            // Set a timeout for API call
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("API timeout")), 5000);
            });

            // Make the API call with timeout
            try {
                const responsePromise = fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: promptForQuestions,
                        language: selectedLanguage,
                        session_id: sessionId,
                        is_system_query: true
                    }),
                });

                const result = await Promise.race([responsePromise, timeoutPromise]);

                if (!(result instanceof Response)) {
                    throw new Error("API call did not return a valid response");
                }

                const data = await result.json();


                // Extract questions from response
                const questions = data.response.split('\n')
                    .map((line: string) => line.trim())
                    .filter((line: string) => line && line.length > 0 && line.length < 70 && (line.endsWith('?') || line.includes('?')))
                    .slice(0, 3); // Take max 3 questions

                if (questions.length > 0) {
                    setDynamicQuestions(questions);
                    return;
                }
            } catch (error) {
                console.error('API call for questions failed:', error);
                // Continue to fallback
            }

            // If we get here, either API failed or didn't return valid questions
            console.log('Using fallback question generation');
            const fallbackQuestions = generateFallbackQuestions();
            setDynamicQuestions(fallbackQuestions);

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

    // Generate relevant default questions based on context without using the API
    const generateFallbackQuestions = () => {
        const questions = [];

        // Add property-specific questions if we're viewing a property
        if (selectedProperty || propertyDetails) {
            // Get basic property info
            const property = selectedProperty || (propertyDetails?.basic_info ? {
                beds: propertyDetails.basic_info.bedrooms,
                baths: propertyDetails.basic_info.bathrooms,
                type: propertyDetails.basic_info.homeType,
                price: propertyDetails.basic_info.price
            } : null);

            if (property) {
                // Add property-specific questions
                questions.push(`What's the price history of this ${property.type?.toLowerCase() || 'property'}?`);
                questions.push(`Are there good schools near this property?`);
                questions.push(`How does this compare to similar ${property.type?.toLowerCase() || 'properties'}?`);
            }
        }

        // Add area-specific questions if we have a zip code
        if (zipCode) {
            questions.push(`What's the market trend in ${zipCode}?`);
            questions.push(`Are there good restaurants in this area?`);
            questions.push(`How's the transit access in ${zipCode}?`);
        }

        // Add general questions
        const generalQuestions = [
            "What amenities are available in this neighborhood?",
            "What's the average price per square foot here?",
            "How is the real estate market performing currently?",
            "Are there any new developments planned in this area?",
            "What are property taxes like in this area?",
            "What's the walkability score of this neighborhood?",
            "How do the local schools rate?",
            "Is this area prone to natural disasters?",
            "What's the crime rate in this neighborhood?",
            "Are home prices rising or falling in this area?",
            "What's the commute time to downtown?",
            "Are there any parks or green spaces nearby?"
        ];

        // Fill remaining spots with general questions
        while (questions.length < 3 && generalQuestions.length > 0) {
            // Get a random question
            const randomIndex = Math.floor(Math.random() * generalQuestions.length);
            const question = generalQuestions.splice(randomIndex, 1)[0];
            questions.push(question);
        }

        // Take only the first 3 questions
        return questions.slice(0, 3);
    };

    // ChatContext.tsx - handleSendMessage function update
    const handleSendMessage = async (message: string, clearInput: (msg: string) => void) => {
        if (!message.trim()) return;

        // Generate a unique ID for this messaging sequence
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

        // If it's a property search or market analysis, activate the AI Workflow tab
        if (features && (features.queryType === 'property_search' || features.queryType === 'market_info' ||
            features.actionRequested === 'show_listings' || features.actionRequested === 'analyze_market')) {
            setTimeout(() => {
                setActiveTab('ai');
            }, 500);
        }

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

        // Add this after the feature extraction
        if (features && (features.queryType === 'property_search' || features.queryType === 'market_info' ||
            features.actionRequested === 'show_listings' || features.actionRequested === 'analyze_market')) {
            setTimeout(() => {
                setActiveTab('ai');
                // Persist this workflow
                persistWorkflow(message);
            }, 500);
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
                hasRestaurants: (locationData?.restaurants ?? []).length > 0,
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
                    language: selectedLanguage,
                    session_id: sessionId,
                    zipCode,
                    // Add extracted features and enhanced UI state
                    feature_context: JSON.stringify({
                        extracted: features,
                        ui_context: buildUIContext()
                    }),
                    location_context: zipCode || '{}'
                }),
            });

            const data = await response.json();

            // Important: Since we're using dangerouslySetInnerHTML directly, don't modify the response
            // This ensures links stay intact instead of being processed twice
            console.log('Raw response from backend:', data.response);

            // Replace loading message if it exists
            if (showingLoadingMessage) {
                setMessages((prev: Message[]) => {
                    // Remove the loading message by filtering out the message with loadingMsgId
                    const withoutLoading = prev.filter(msg => msg.id !== loadingMsgId);
                    // Add the real response with the finalResponseId
                    return [...withoutLoading, {
                        id: finalResponseId,
                        type: 'bot',
                        content: data.response, // Use the raw content directly
                        rawContent: data.response // Keep a copy of the original response
                    }];
                });
            } else {
                // Add as normal if no loading message was shown
                const botMessage: Message = {
                    id: finalResponseId,
                    type: 'bot',
                    content: data.response, // Use the raw content directly
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
                debugFeatureExtraction, // Expose for debugging
                propertyContext, setPropertyContext,
                workflowState,
                setWorkflowState,
                previousWorkflows,
                persistWorkflow,
                restorePreviousWorkflow,
                agentContacts,
                selectedAgentContact,
                setSelectedAgentContact,
                agentMessages,
                addAgentToContacts,
                sendMessageToAgent,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};


// This is the revised implementation for ChatContext.tsx

// 1. First, update the processUILinks function to correctly handle all link patterns
const processUILinks = (text: string) => {
    console.log("Processing UI links in text:", text);
    if (!text) return text;

    // Define patterns to detect UI link mentions
    const linkPatterns = [
        // Main sections in Explore tab
        {
            regex: /\[\[market(?:\s+trends)?\]\]/gi,
            replacement: `<a href="#${SECTION_IDS.MARKET}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="market" data-tab="explore" data-force-tab="true">market trends</a>`
        },
        {
            regex: /\[\[properties\]\]/gi,
            replacement: `<a href="#${SECTION_IDS.PROPERTIES}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="property" data-tab="explore" data-force-tab="true">properties</a>`
        },
        {
            regex: /\[\[restaurants\]\]|\[\[local\s+amenities\]\]/gi,
            replacement: `<a href="#${SECTION_IDS.AMENITIES}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="restaurants" data-tab="explore" data-force-tab="true">local amenities</a>`
        },
        {
            regex: /\[\[transit\]\]/gi,
            replacement: `<a href="#${SECTION_IDS.TRANSIT}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="transit" data-tab="explore" data-force-tab="true">transit options</a>`
        },
        {
            regex: /\[\[agents\]\]/gi,
            replacement: `<a href="#${SECTION_IDS.AGENTS}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="agents" data-tab="explore" data-force-tab="true">top agents</a>`
        },
        
        // Property tab links
        {
            regex: /\[\[property\s+details\]\]/gi,
            replacement: `<a href="#${PROPERTY_TAB_IDS.DETAILS}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertyDetails" data-property-tab="details" data-force-tab="true">property details</a>`
        },
        {
            regex: /\[\[price\s+history\]\]/gi,
            replacement: `<a href="#${PROPERTY_TAB_IDS.PRICE_HISTORY}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertyPriceHistory" data-property-tab="priceHistory" data-force-tab="true">price history</a>`
        },
        {
            regex: /\[\[property\s+schools\]\]|\[\[schools\]\]/gi,
            replacement: `<a href="#${PROPERTY_TAB_IDS.SCHOOLS}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertySchools" data-property-tab="schools" data-force-tab="true">schools</a>`
        },
        {
            regex: /\[\[property\s+market(?:\s+analysis)?\]\]|\[\[market\s+analysis\]\]/gi,
            replacement: `<a href="#${PROPERTY_TAB_IDS.MARKET_ANALYSIS}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertyMarketAnalysis" data-property-tab="marketAnalysis" data-force-tab="true">market analysis</a>`
        },
        {
            regex: /\[\[property\s+description\]\]/gi,
            replacement: `<a href="#${PROPERTY_TAB_IDS.DETAILS}" class="text-teal-600 hover:text-teal-800 underline" data-ui-link="propertyDescription" data-property-tab="details" data-section="description" data-force-tab="true">property description</a>`
        }
    ];

    // Process each pattern
    let processedText = text;

    linkPatterns.forEach(pattern => {
        processedText = processedText.replace(pattern.regex, pattern.replacement);
    });

    console.log("Processed text:", processedText);
    return processedText;
};

// 2. Update the createLinkableContent function to better handle HTML content
const createLinkableContent = (message: string) => {
    if (!message || typeof message !== 'string') {
        return message;
    }

    // Check if the message already contains HTML with data-ui-link attributes
    if (message.includes('data-ui-link')) {
        console.log("Message already contains UI links, skipping processing");
        return message;
    }

    // Process the UI links in the message
    return processUILinks(message);
};
