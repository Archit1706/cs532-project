// components/Tabs/AIWorkflow/TransitAmenitiesResults.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useChatContext } from 'context/ChatContext';
import { FaMapMarkerAlt, FaDirections, FaExternalLinkAlt, FaFilter, FaSearch, FaTimesCircle, FaCar, FaWalking, FaBicycle, FaBus, FaClock } from 'react-icons/fa';

interface TransitAmenitiesResultsProps {
  zipCode: string;
  query: string;
  features: any;
  onExport: (format: 'json' | 'pdf') => void;
}

interface Place {
  title: string;
  address: string;
  type?: string;
  category?: string;
  distance?: number;
  rating?: string;
  reviews_original?: string;
  image?: string;
  price?: string;
  directions?: string;
  placeId?: string; // For Google Maps Place ID
}

// Define travel modes for route display
enum TravelMode {
  DRIVING = "DRIVING",
  WALKING = "WALKING",
  BICYCLING = "BICYCLING",
  TRANSIT = "TRANSIT"
}

const TransitAmenitiesResults: React.FC<TransitAmenitiesResultsProps> = ({ zipCode, query, features, onExport }) => {
  const { locationData } = useChatContext();
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedTravelMode, setSelectedTravelMode] = useState<TravelMode>(TravelMode.DRIVING);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const mapScriptRef = useRef<HTMLScriptElement | null>(null);
  
  // Get amenity type from features
  const getAmenityType = () => {
    // First check the exact proximity.to from features
    if (features?.locationFeatures?.proximity?.to) {
      return features.locationFeatures.proximity.to;
    }
    
    // Then check the amenityType
    if (features?.locationFeatures?.amenityType) {
      return features.locationFeatures.amenityType;
    }
    
    // Extract from query as fallback with precise matching
    if (query.toLowerCase().includes('coffee')) {
      return 'coffee';
    }
    
    if (query.toLowerCase().includes('restaurant')) {
      return 'restaurant';
    }
    
    const amenityWords = ['school', 'grocery', 'park', 'hospital', 'library', 'gym'];
    for (const word of amenityWords) {
      if (query.toLowerCase().includes(word)) {
        return word;
      }
    }
    
    return 'restaurant'; // Default
  };

  // Load Google Maps and required libraries
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google?.maps) {
        setScriptLoaded(true);
        return;
      }
      
      if (document.getElementById('google-maps-script')) {
        return;
      }
      
      try {
        // Create script element
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleCallback`;
        script.async = true;
        script.defer = true;
        
        // Define callback function in window scope
        window.initGoogleCallback = () => {
          setScriptLoaded(true);
        };
        
        // Store reference and append to document
        mapScriptRef.current = script;
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };
    
    loadGoogleMaps();
    
    // Cleanup
    return () => {
      // Clean up markers and directions
      if (markersRef.current) {
        markersRef.current.forEach(marker => {
          if (marker) marker.setMap(null);
        });
        markersRef.current = [];
      }
      
      if (directionsRenderer.current) {
        directionsRenderer.current.setMap(null);
      }
      
      if (infoWindow.current) {
        infoWindow.current.close();
      }
    };
  }, []);

  // Geocode the zip code to get coordinates
  useEffect(() => {
    if (scriptLoaded && zipCode) {
      const geocodeZipCode = async () => {
        try {
          setIsLoading(true);
          const geocoder = new google.maps.Geocoder();
          const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: zipCode }, (results, status) => {
              if (status === 'OK' && results && results.length > 0) {
                resolve(results);
              } else {
                reject(new Error(`Geocoding failed: ${status}`));
              }
            });
          });
          
          const location = results[0].geometry.location;
          setMapCenter({
            lat: location.lat(),
            lng: location.lng()
          });
        } catch (error) {
          console.error('Error geocoding zip code:', error);
          // Fallback to Chicago coordinates
          setMapCenter({ lat: 41.8781, lng: -87.6298 });
        } finally {
          setIsLoading(false);
        }
      };
      
      geocodeZipCode();
    }
  }, [scriptLoaded, zipCode]);

  // Initialize map when script is loaded and coordinates are available
  useEffect(() => {
    if (scriptLoaded && mapRef.current && mapCenter) {
      const initializeMap = async () => {
        try {
          // Import required libraries
          const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
          const { InfoWindow } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
          
          // Create map instance
          googleMapRef.current = new Map(mapRef.current!, {
            center: mapCenter,
            zoom: 14,
            mapTypeControl: false,
            mapId: 'DEMO_MAP_ID'
          });
          
          // Initialize info window
          infoWindow.current = new InfoWindow();
          
          // Initialize directions service
          directionsService.current = new google.maps.DirectionsService();
          directionsRenderer.current = new google.maps.DirectionsRenderer({
            map: googleMapRef.current,
            suppressMarkers: false
          });
          
          setMapLoaded(true);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      };
      
      initializeMap();
    }
  }, [scriptLoaded, mapCenter]);

  // Load initial data based on amenity type
  useEffect(() => {
    if (mapLoaded && mapCenter) {
      const amenityType = getAmenityType();
      console.log("Amenity type detected:", amenityType);
      
      searchNearbyPlaces(amenityType);
    }
  }, [mapLoaded, mapCenter]);

  // Search for nearby places with the new Places API
  const searchNearbyPlaces = async (type: string) => {
    if (!googleMapRef.current || !mapCenter) return;
    
    setIsLoading(true);
    
    try {
        // Import libraries
        const { Place, SearchNearbyRankPreference } = 
          await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
        const { AdvancedMarkerElement } = 
          await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
        const { LatLngBounds } = 
          await google.maps.importLibrary("core") as google.maps.CoreLibrary;
        
        // Map amenity type to Google Places type
        let placeTypes: string[] = ['restaurant'];
        
        if (type.includes('coffee')) {
          placeTypes = ['cafe'];
        } else if (type.includes('school')) {
          placeTypes = ['school'];
        } else if (type.includes('grocery')) {
          placeTypes = ['grocery_or_supermarket'];
        } else if (type.includes('park')) {
          placeTypes = ['park'];
        } else if (type.includes('hospital')) {
          placeTypes = ['hospital'];
        } else if (type.includes('library')) {
          placeTypes = ['library'];
        }
        
        console.log(`Searching for ${placeTypes.join(', ')} near ${mapCenter.lat}, ${mapCenter.lng}`);
        
        // Create search request with increased radius (5000 meters = ~3 miles)
        const request = {
          fields: ['displayName', 'formattedAddress', 'location', 'rating', 'businessStatus', 'types', 'priceLevel', 'id', 'photos'],
          locationRestriction: {
            center: new google.maps.LatLng(mapCenter.lat, mapCenter.lng),
            radius: 6000, // Increased to ~4 miles
          },
          includedPrimaryTypes: placeTypes,
          maxResultCount: 20,
          rankPreference: SearchNearbyRankPreference.DISTANCE,
          language: 'en-US',
          region: 'us',
        };
      
      // Perform search
      const { places: searchResults } = await Place.searchNearby(request);
      
      if (searchResults && searchResults.length > 0) {
        console.log(`Found ${searchResults.length} places`);
        
        // Clear existing markers
        if (markersRef.current.length > 0) {
          markersRef.current.forEach(marker => marker.setMap(null));
          markersRef.current = [];
        }
        
        // Create bounds for map fitting
        const bounds = new LatLngBounds();
        
        // Convert to our Place format
        const newPlaces: Place[] = await Promise.all(searchResults.map(async (place) => {
          // Add marker
          const marker = new AdvancedMarkerElement({
            map: googleMapRef.current!,
            position: place.location,
            title: place.displayName,
          });
          
          // Add to markers ref
          markersRef.current.push(marker);
          
          // Extend bounds
          bounds.extend(place.location as google.maps.LatLng);
          
          // Calculate distance
          const distance = calculateDistance(
            mapCenter.lat,
            mapCenter.lng,
            place.location!.lat(),
            place.location!.lng()
          );
          
          // Get image if available
          let imageUrl;
          if (place.photos && place.photos.length > 0) {
            try {
              imageUrl = place.photos[0].getURI({
                maxWidth: 400,
                maxHeight: 300
              });
            } catch (error) {
              console.error('Error getting photo:', error);
            }
          }
          
          return {
            title: place.displayName || 'Unnamed Place',
            address: place.formattedAddress || 'No address',
            type: place.types ? place.types[0] : type,
            rating: place.rating ? place.rating.toString() : undefined,
            price: place.priceLevel ? '$'.repeat(Number(place.priceLevel)) : undefined,
            distance: distance,
            placeId: place.id,
            image: imageUrl
          };
        }));
        
        // Fit map to bounds
        googleMapRef.current!.fitBounds(bounds);
        
        // Update state
        setPlaces(newPlaces);
        setFilteredPlaces(newPlaces);
      } else {
        console.log(`No results for ${type}, falling back to restaurants`);
        
        // If not already searching for restaurants, try that as fallback
        if (!type.includes('restaurant')) {
          searchNearbyPlaces('restaurant');
        } else {
          // If we are already searching for restaurants with no results,
          // fallback to data from context
          fetchRestaurantsFallback();
        }
      }
    } catch (error) {
      console.error(`Error searching for ${type}:`, error);
      // Fallback to restaurants from context
      fetchRestaurantsFallback();
    } finally {
      setIsLoading(false);
    }
  };

// Updated getPlaceDetails function with fixed fields
const getPlaceDetails = async (placeId: string) => {
    if (!placeId) return null;
    
    try {
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      
      // Create place instance
      const place = new Place({
        id: placeId,
        requestedLanguage: 'en'
      });
      
      // Fetch details with CORRECT field names
      await place.fetchFields({ 
        fields: [
          'displayName', 
          'formattedAddress', 
          'location', 
          'rating',
          'userRatingCount',
          'editorialSummary',
          'websiteURI',
          'nationalPhoneNumber',
          'regularOpeningHours', // CORRECT field name 
          'photos',
          'priceLevel'
        ] 
      });
      
      return place;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  };

  // Fetch restaurant data as fallback
  const fetchRestaurantsFallback = async () => {
    console.log("Fetching restaurants as fallback");
    
    try {
      // Check if we already have restaurant data in context
      if (locationData?.restaurants?.length > 0) {
        console.log(`Using ${locationData.restaurants.length} restaurants from context`);
        setPlaces(locationData.restaurants);
        setFilteredPlaces(locationData.restaurants);
        return;
      }
      
      // Otherwise fetch restaurants from API
      const response = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          zipCode, 
          type: 'Restaurant' 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant data');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setPlaces(data.results);
        setFilteredPlaces(data.results);
        console.log(`Loaded ${data.results.length} restaurants as fallback`);
      } else {
        console.log("No restaurant results found");
        setPlaces([]);
        setFilteredPlaces([]);
      }
    } catch (error) {
      console.error('Error fetching restaurant fallback:', error);
      setPlaces([]);
      setFilteredPlaces([]);
    }
  };

  // Calculate distance between two points in miles
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distanceKm = R * c; // Distance in km
    return parseFloat((distanceKm * 0.621371).toFixed(2)); // Convert to miles and round to 2 decimal places
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // Show place details in info window
// Updated showPlaceInfo function with improved styling for better readability
const showPlaceInfo = async (place: Place, index: number) => {
    if (!infoWindow.current || !googleMapRef.current || !markersRef.current[index]) return;
    
    // Improved styling with better contrast and font weights
    let content = `
      <div style="max-width: 300px; padding: 10px; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #2d3748;">${place.title}</h3>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4a5568;">${place.address}</p>
        ${place.distance ? `<p style="margin: 0 0 5px 0; font-size: 14px; color: #4a5568;"><strong>Distance:</strong> ${place.distance} miles</p>` : ''}
        ${place.rating ? `<p style="margin: 0 0 5px 0; font-size: 14px; color: #4a5568;"><strong>Rating:</strong> ${place.rating}/5</p>` : ''}
    `;
    
    // If we have a place ID, try to get more details
    if (place.placeId) {
      const details = await getPlaceDetails(place.placeId);
      if (details) {
        content += details.editorialSummary ? 
          `<p style="margin: 8px 0; font-size: 14px; color: #4a5568;">${details.editorialSummary}</p>` : '';
        
        // Using regularOpeningHours instead of openingHours
        content += details.regularOpeningHours?.weekdayDescriptions ? 
          `<p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Hours:</strong> ${details.regularOpeningHours.weekdayDescriptions[0]}</p>` : '';
        
        content += details.nationalPhoneNumber ? 
          `<p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Phone:</strong> ${details.nationalPhoneNumber}</p>` : '';
        
        content += details.websiteURI ? 
          `<p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><a href="${details.websiteURI}" target="_blank" style="color: #4299e1; text-decoration: underline;">Visit Website</a></p>` : '';
      }
    }
    
    content += `</div>`;
    
    infoWindow.current.setContent(content);
    infoWindow.current.open({
      map: googleMapRef.current,
      anchor: markersRef.current[index]
    });
  };


  // Filter places based on search term
  const filterPlaces = (term: string) => {
    if (!term.trim()) {
      setFilteredPlaces(places);
      return;
    }
    
    const filtered = places.filter(place => 
      place.title.toLowerCase().includes(term.toLowerCase()) ||
      place.address.toLowerCase().includes(term.toLowerCase()) ||
      (place.type && place.type.toLowerCase().includes(term.toLowerCase())) ||
      (place.category && place.category.toLowerCase().includes(term.toLowerCase()))
    );
    
    setFilteredPlaces(filtered);
  };

  // Calculate route to selected place
  const calculateRoute = (place: Place, travelMode: TravelMode = TravelMode.DRIVING) => {
    if (!directionsService.current || !directionsRenderer.current || !googleMapRef.current || !mapCenter) return;
    
    try {
      // Use coordinates directly if available via placeId, otherwise geocode the address
      const getDestination = async () => {
        if (place.placeId) {
          const placeDetails = await getPlaceDetails(place.placeId);
          if (placeDetails && placeDetails.location) {
            return placeDetails.location;
          }
        }
        
        // Fallback to geocoding
        return new Promise<google.maps.LatLng>((resolve, reject) => {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: place.address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              resolve(results[0].geometry.location);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });
      };
      
      getDestination().then(destination => {
        // Create route request
        const request = {
          origin: new google.maps.LatLng(mapCenter.lat, mapCenter.lng),
          destination: destination,
          travelMode: google.maps.TravelMode[travelMode]
        };
        
        // Calculate route
        directionsService.current!.route(request, (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.current!.setDirections(result);
            
            // Extract route information
            const route = result.routes[0];
            if (route && route.legs && route.legs.length > 0) {
              const leg = route.legs[0];
              setRouteInfo({
                distance: leg.distance?.text || 'Unknown distance',
                duration: leg.duration?.text || 'Unknown duration'
              });
            }
            
            // Fit map to show the entire route
            if (googleMapRef.current && result.routes[0].bounds) {
              googleMapRef.current.fitBounds(result.routes[0].bounds);
            }
          } else {
            console.error('Directions request failed:', status);
            setRouteInfo(null);
          }
        });
      }).catch(error => {
        console.error('Error getting destination:', error);
        setRouteInfo(null);
      });
    } catch (error) {
      console.error('Error calculating route:', error);
      setRouteInfo(null);
    }
  };

  // Clear the current route
  const clearRoute = () => {
    if (directionsRenderer.current && googleMapRef.current) {
      directionsRenderer.current.setMap(null);
      directionsRenderer.current.setMap(googleMapRef.current);
    }
    // Reset selected place and route info
    setSelectedPlaceIndex(null);
    setRouteInfo(null);
  };

  // Open Google Maps directions in a new tab
  const openExternalDirections = (place: Place) => {
    const destination = encodeURIComponent(place.address);
    const origin = encodeURIComponent(zipCode);
    const mode = selectedTravelMode.toLowerCase();
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`, '_blank');
  };

  // Handle place card click
  const handlePlaceCardClick = (place: Place, index: number) => {
    setSelectedPlaceIndex(index);
    
    // Show info window for the place
    showPlaceInfo(place, index);
    
    // Pan to marker
    if (markersRef.current[index] && googleMapRef.current) {
      const position = markersRef.current[index].position;
      if (position) {
        googleMapRef.current.panTo(position);
        googleMapRef.current.setZoom(15);
      }
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-indigo-50 to-white rounded-xl shadow-sm animate-fadeIn">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <FaMapMarkerAlt className="text-indigo-600 mr-3 text-xl" />
            <h2 className="text-xl font-semibold text-slate-800">Transit & Amenities</h2>
          </div>
        </div>
        
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
          <p className="text-slate-800 mb-1">
            <span className="font-semibold">Query:</span> "{query}"
          </p>
          <p className="text-slate-800 mb-2">
            <span className="font-semibold">Location:</span> ZIP Code {zipCode}
          </p>
          
          <div className="flex items-center mt-2">
            <span className="text-slate-800 mr-2">Travel Mode:</span>
            <div className="flex border border-slate-200 rounded-md overflow-hidden">
              <button
                className={`px-2 py-1 flex items-center ${selectedTravelMode === TravelMode.DRIVING ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700'}`}
                onClick={() => setSelectedTravelMode(TravelMode.DRIVING)}
              >
                <FaCar className="mr-1" /> Car
              </button>
              <button
                className={`px-2 py-1 flex items-center ${selectedTravelMode === TravelMode.WALKING ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700'}`}
                onClick={() => setSelectedTravelMode(TravelMode.WALKING)}
              >
                <FaWalking className="mr-1" /> Walk
              </button>
              <button
                className={`px-2 py-1 flex items-center ${selectedTravelMode === TravelMode.BICYCLING ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700'}`}
                onClick={() => setSelectedTravelMode(TravelMode.BICYCLING)}
              >
                <FaBicycle className="mr-1" /> Bike
              </button>
              <button
                className={`px-2 py-1 flex items-center ${selectedTravelMode === TravelMode.TRANSIT ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700'}`}
                onClick={() => setSelectedTravelMode(TravelMode.TRANSIT)}
              >
                <FaBus className="mr-1" /> Transit
              </button>
            </div>
          </div>
          
          {/* Route information display */}
          {routeInfo && (
  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
    <div className="flex items-center text-blue-800">
      <FaClock className="mr-2" />
      <div>
        <p className="font-semibold mb-1">Route Information</p>
        <p className="text-sm">Distance: <span className="font-medium">{routeInfo.distance}</span> • Travel time: <span className="font-medium">{routeInfo.duration}</span></p>
      </div>
    </div>
  </div>
)}
        </div>
      </div>
      
      {/* Map Container */}
      <div className="w-full h-96 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 mb-4">
        {isLoading || !scriptLoaded ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full"></div>
        )}
      </div>
      
      {/* Search and Filter Controls */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search places..."
              className="w-full px-3 py-2 pl-10 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                filterPlaces(e.target.value);
              }}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => {
                  setSearchTerm('');
                  setFilteredPlaces(places);
                }}
              >
                <FaTimesCircle />
              </button>
            )}
          </div>
          
          {selectedPlaceIndex !== null && (
            <button
              className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center"
              onClick={clearRoute}
            >
              <FaTimesCircle className="mr-1" /> Clear Route
            </button>
          )}
        </div>
      </div>
      
      {/* Places List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-10">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600">Loading places...</p>
          </div>
        ) : filteredPlaces.length > 0 ? (
          filteredPlaces.map((place, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg border ${selectedPlaceIndex === index ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'} overflow-hidden cursor-pointer transition-all hover:shadow-md`}
              onClick={() => handlePlaceCardClick(place, index)}
            >
              {place.image ? (
                <div className="h-32 overflow-hidden">
                  <img
                    src={place.image}
                    alt={place.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x150?text=No+Image";
                    }}
                  />
                </div>
              ) : (
                <div className="h-32 bg-indigo-100 flex items-center justify-center">
                  <FaMapMarkerAlt className="text-indigo-500 text-4xl" />
                </div>
              )}
              
              <div className="p-4">
                <div className="font-semibold text-lg text-slate-900 mb-1">{place.title}</div>
                <div className="text-sm text-slate-700 mb-2">{place.address}</div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {place.type && (
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                      {place.type}
                    </span>
                  )}
                  {place.category && (
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                      {place.category}
                    </span>
                  )}
                  {place.distance !== undefined && (
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                      {place.distance} miles
                    </span>
                  )}
                  {place.rating && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                      ★ {place.rating}
                    </span>
                  )}
                  {place.price && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                      {place.price}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-2 py-1 bg-indigo-600 text-white rounded flex items-center justify-center text-sm hover:bg-indigo-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      calculateRoute(place, selectedTravelMode);
                    }}
                  >
                    <FaDirections className="mr-1" /> Route
                  </button>
                  
                  <button
                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded flex items-center justify-center text-sm hover:bg-slate-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      openExternalDirections(place);
                    }}
                  >
                    <FaExternalLinkAlt className="mr-1" /> Maps
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <FaSearch className="mx-auto text-3xl text-slate-300 mb-3" />
            <p className="text-slate-600">No places found. Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Declare initGoogleCallback in global scope
declare global {
  interface Window {
    initGoogleCallback: () => void;
    google: any;
  }
}

export default TransitAmenitiesResults;