    // components/GoogleMapEnhanced.tsx
    "use client";

    import React, { useEffect, useRef, useState } from 'react';
    import { Property } from 'types/chat';
    import { extractZipCode, extractCityState, createGoogleMapsUrl } from '../utils/addressUtils';

    interface Props {
    property: Property;
    }

    const GoogleMapEnhanced: React.FC<Props> = ({ property }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [zipCode, setZipCode] = useState<string | null>(null);
    const [cityState, setCityState] = useState<{ city: string | null, state: string | null }>({ city: null, state: null });
    const [mapError, setMapError] = useState<boolean>(false);
    
    // Extract location information
    useEffect(() => {
        if (property.address) {
        const extractedZip = extractZipCode(property.address);
        const extractedCityState = extractCityState(property.address);
        
        setZipCode(extractedZip);
        setCityState(extractedCityState);
        }
    }, [property.address]);
    
    useEffect(() => {
        // Function to load the script for Google Maps components
        const loadGoogleMapsScript = () => {
        // Check if the script is already loaded
        if (document.querySelector('script[src*="extended-component-library"]')) {
            initializeComponents();
            return;
        }

        // Add API loader component
        const apiLoader = document.createElement('gmpx-api-loader');
        //apiLoader.setAttribute('key', 'AIzaSyB9wk1_bl66O-FEA9Fd9v2jmvtxGnqmm8A'); // Replace with your APIII key
        apiLoader.setAttribute('key', process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '');
        apiLoader.setAttribute('solution-channel', 'GMP_GE_mapsandplacesautocomplete_v2');
        mapContainerRef.current?.appendChild(apiLoader);

        // Load the extended component library
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js';
        script.onload = initializeComponents;
        script.onerror = () => setMapError(true);
        document.head.appendChild(script);
        };

        // Function to initialize map components after script load
        const initializeComponents = async () => {
        if (!mapContainerRef.current) return;

        try {
            // Wait for custom elements to be defined
            await customElements.whenDefined('gmp-map');
            
            // Create map element
            const mapElement = document.createElement('gmp-map');
            mapElement.setAttribute('zoom', '15');
            mapElement.setAttribute('map-id', 'DEMO_MAP_ID');
            
            // Add styling
            mapElement.style.width = '100%';
            mapElement.style.height = '400px';
            mapElement.style.borderRadius = '0.5rem';
            
            // Create marker element
            const markerElement = document.createElement('gmp-advanced-marker');
            mapElement.appendChild(markerElement);
            
            // Create place picker container and component
            const placePickerContainer = document.createElement('div');
            placePickerContainer.setAttribute('slot', 'control-block-start-inline-start');
            placePickerContainer.style.padding = '20px';
            
            const placePicker = document.createElement('gmpx-place-picker');
            // Set a more specific placeholder if we have location information
            if (cityState.city && cityState.state) {
            placePicker.setAttribute('placeholder', `Search places near ${cityState.city}, ${cityState.state}`);
            } else if (zipCode) {
            placePicker.setAttribute('placeholder', `Search places near ${zipCode}`);
            } else {
            placePicker.setAttribute('placeholder', 'Search nearby places');
            }
            
            placePickerContainer.appendChild(placePicker);
            mapElement.appendChild(placePickerContainer);
            
            // Clear previous content and add new elements
            mapContainerRef.current.innerHTML = '';
            mapContainerRef.current.appendChild(mapElement);
            
            // Initial geocoding of the property address
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: property.address }, (results, status) => {
            if (status === "OK" && results && results[0]) {
                const location = results[0].geometry.location;
                
                // Set map center
                mapElement.setAttribute('center', `${location.lat()},${location.lng()}`);
                
                // Set marker position
                markerElement.setAttribute('position', `${location.lat()},${location.lng()}`);
                
                // Set up info window
                const map = (mapElement as any).innerMap;
                const infowindow = new google.maps.InfoWindow({
                content: `
                    <div>
                    <strong>${typeof property.price === 'number' ? `$${property.price.toLocaleString()}` : property.price}</strong>
                    <br/>
                    <span>${property.address}</span>
                    </div>
                `,
                });
                
                // Open info window on marker
                infowindow.open(map, markerElement as unknown as google.maps.marker.AdvancedMarkerElement);
                
                // Set up place picker event
                placePicker.addEventListener('gmpx-placechange', () => {
                const place = (placePicker as any).value;
                if (!place.location) {
                    alert("No details available for input: '" + place.name + "'");
                    infowindow.close();
                    (markerElement as unknown as google.maps.marker.AdvancedMarkerElement).position = null;
                    return;
                }
                
                if (place.viewport) {
                    map.fitBounds(place.viewport);
                } else {
                    map.setCenter(place.location);
                    map.setZoom(17);
                }
                
                (markerElement as unknown as google.maps.marker.AdvancedMarkerElement).position = place.location;
                
                // Update info window with place info
                infowindow.setContent(`
                    <strong>${place.displayName}</strong><br>
                    <span>${place.formattedAddress || ''}</span>
                `);
                
                // Open info window on marker
                infowindow.open(map, markerElement as unknown as google.maps.marker.AdvancedMarkerElement);
       
                });
            } else {
                console.error("Geocode was not successful for the following reason: " + status);
                setMapError(true);
            }
            });
        } catch (error) {
            console.error("Failed to initialize map:", error);
            setMapError(true);
        }
        };

        // Load the Google Maps script
        try {
        loadGoogleMapsScript();
        } catch (error) {
        console.error("Failed to load Google Maps:", error);
        setMapError(true);
        }
        
        // Cleanup function
        return () => {
        // Remove the map element when component unmounts
        if (mapContainerRef.current) {
            mapContainerRef.current.innerHTML = '';
        }
        };
    }, [property, zipCode, cityState]);

    // Create a Google Maps URL for fallback view
    const googleMapsUrl = createGoogleMapsUrl(property.address);

    return (
        <div className="mt-4">
        <h3 className="font-semibold text-slate-800 mb-2">Property Location</h3>
        
        {mapError ? (
            // Fallback view when Google Maps fails to load
            <div className="w-full h-48 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex flex-col items-center justify-center">
            <svg className="w-10 h-10 text-slate-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-slate-600 mb-3 text-center">
                Interactive map unavailable
                <br />
                <span className="text-sm text-slate-500">{property.address}</span>
            </p>
            <a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm flex items-center gap-2"
            >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                View on Google Maps
            </a>
            </div>
        ) : (
            <>
            <div
                ref={mapContainerRef}
                className="w-full h-96 rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
            ></div>
            <div className="mt-2 text-sm text-slate-600">
                <p className="mb-2">Search for nearby places like schools, parks, restaurants, and more</p>
                
                {/* Quick search buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                <button 
                    onClick={() => {
                    const picker = document.querySelector('gmpx-place-picker') as any;
                    if (picker) picker.value = { name: "restaurants near " + (zipCode || property.address) };
                    }}
                    className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200 text-xs font-medium hover:bg-teal-100"
                >
                    Restaurants
                </button>
                <button
                    onClick={() => {
                    const picker = document.querySelector('gmpx-place-picker') as any;
                    if (picker) picker.value = { name: "schools near " + (zipCode || property.address) };
                    }}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-xs font-medium hover:bg-blue-100"
                >
                    Schools
                </button>
                <button
                    onClick={() => {
                    const picker = document.querySelector('gmpx-place-picker') as any;
                    if (picker) picker.value = { name: "parks near " + (zipCode || property.address) };
                    }}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium hover:bg-green-100"
                >
                    Parks
                </button>
                <button
                    onClick={() => {
                    const picker = document.querySelector('gmpx-place-picker') as any;
                    if (picker) picker.value = { name: "grocery stores near " + (zipCode || property.address) };
                    }}
                    className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-xs font-medium hover:bg-amber-100"
                >
                    Grocery
                </button>
                <button
                    onClick={() => {
                    const picker = document.querySelector('gmpx-place-picker') as any;
                    if (picker) picker.value = { name: "transit near " + (zipCode || property.address) };
                    }}
                    className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 text-xs font-medium hover:bg-purple-100"
                >
                    Transit
                </button>
                </div>
            </div>
            </>
        )}
        </div>
    );
    };

    export default GoogleMapEnhanced;