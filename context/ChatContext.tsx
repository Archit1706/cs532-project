// context/ChatContext.tsx
import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { Message, Property, LocationData, FeatureExtraction } from '../types/chat';
import { fetchLocationData as fetchLocationDetails } from '../utils/locationUtils';

export const ChatContext = createContext<any>(null);
export const useChatContext = () => useContext(ChatContext);

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
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [marketTrends, setMarketTrends] = useState<any>(null);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [activeTab, setActiveTab] = useState<'restaurants' | 'transit' | 'properties' | 'market' | null>('properties');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [isTranslating, setIsTranslating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = async (message: string, clearInput: (msg: string) => void) => {
        if (!message.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            type: 'user',
            content: message,
        };

        setMessages((prev: Message[]) => [...prev, userMessage]);
        setInputMessage('');
        clearInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    session_id: sessionId,
                    zipCode,
                    feature_context: '{}',
                    location_context: '{}'
                }),
            });

            const data = await response.json();

            const botMessage: Message = {
                id: Date.now() + 1,
                type: 'bot',
                content: data.response,
            };

            setMessages((prev: Message[]) => [...prev, botMessage]);

            if (!sessionId && data.session_id) setSessionId(data.session_id);
        } catch (error: any) {
            setMessages((prev: Message[]) => [...prev, {
                id: Date.now() + 2,
                type: 'bot',
                content: `Error: I couldn't process your request. ${error.message || 'Please try again later.'}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLocationData = async (zip: string) => {
        try {
            const locationResult = await fetchLocationDetails(zip);
            setLocationData(locationResult);

            const propertiesResponse = await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zipCode: zip })
            });

            const propertiesData = await propertiesResponse.json();
            setProperties(propertiesData.results || []);
        } catch (error) {
            console.error('Failed to fetch location or property data:', error);
        }
    };

    useEffect(() => {
        if (zipCode.length === 5) {
            fetchLocationData(zipCode);
        }
    }, [zipCode]);

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
                messagesEndRef,
                handleSendMessage
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
