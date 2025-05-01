// components/Tabs/AIWorkflow/TransitAmenitiesResults.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useChatContext } from 'context/ChatContext';
import { FaMapMarkerAlt, FaDirections, FaExternalLinkAlt, FaFilter, FaSearch, FaTimesCircle, FaCar, FaWalking, FaBicycle, FaBus } from 'react-icons/fa';

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

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  
  // Get amenity type from features
// Improved getAmenityType to be more precise
const getAmenityType = () => {
    // First check the exact proximity.to from features
    if (features?.locationFeatures?.proximity?.to) {
      return features.locationFeatures.proximity.to;
    }
    
    // Then check the amenityType
    if (features?.locationFeatures?.amenityType) {
      return features.locationFeatures.amenityType;
    }
    
    // Extract from query as fallback with more precise matching
    if (query.toLowerCase().includes('coffee')) {
      return 'coffee places';
    }
    
    if (query.toLowerCase().includes('restaurant')) {
      return 'restaurants';
    }
    
    const amenityWords = ['schools', 'grocery', 'park', 'hospital', 'library', 'gym'];
    for (const word of amenityWords) {
      if (query.toLowerCase().includes(word)) {
        return word;
      }
    }
    
    return 'restaurants'; // Default
  };
  // Fetch custom amenity data when needed
  const fetchCustomAmenityData = async (amenityType: string) => {
    setIsLoading(true);
    
    try {
      // Map amenity types to specific search terms for the API
      let searchType = amenityType;
      
      // Leave the original amenity type if it's already a specific search term
      if (!searchType.includes(' Shop') && !searchType.includes(' Stop')) {
        // Map common amenity types to specific search terms
        if (searchType.toLowerCase().includes('coffee')) {
          searchType = 'Coffee Shop';
        } else if (searchType.toLowerCase().includes('school')) {
          searchType = 'School';
        } else if (searchType.toLowerCase().includes('grocery')) {
          searchType = 'Grocery Store';
        } else if (searchType.toLowerCase().includes('hospital')) {
          searchType = 'Hospital';
        } else if (searchType.toLowerCase().includes('park')) {
          searchType = 'Park';
        } else if (searchType.toLowerCase().includes('library')) {
          searchType = 'Library';
        }
      }
      
      console.log(`Fetching data for '${searchType}' near ${zipCode}`);
      
      const response = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          zipCode, 
          type: searchType 
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${searchType} data`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setPlaces(data.results);
        setFilteredPlaces(data.results);
        console.log(`Loaded ${data.results.length} ${searchType} places`);
      } else {
        console.log(`No results for ${searchType}, falling back to search nearby places`);
        
        // Fallback to Google Places search if API returned no results
        if (window.google && window.google.maps && googleMapRef.current) {
          searchNearbyPlaces(amenityType);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${amenityType} data:`, error);
      
      // Fallback to Google Places search on error
      if (window.google && window.google.maps && googleMapRef.current) {
        searchNearbyPlaces(amenityType);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to load amenity data based on features
  useEffect(() => {
    if (locationData) {
      const amenityType = getAmenityType();
      console.log("Amenity type detected:", amenityType);
      
      // Always use the exact extracted amenity type for the search
      if (amenityType.includes('restaurant') || amenityType === 'food') {
        if (locationData.restaurants?.length > 0) {
          setPlaces(locationData.restaurants);
          setFilteredPlaces(locationData.restaurants);
          console.log(`Loaded ${locationData.restaurants.length} restaurants`);
        } else {
          fetchCustomAmenityData('Restaurant');
        }
      } else if (amenityType.includes('coffee') || amenityType.includes('cafe')) {
        // Specifically fetch coffee shops rather than using general restaurant data
        console.log("Fetching coffee shops data");
        fetchCustomAmenityData('Coffee Shop');
      } else if (amenityType.includes('transit') || amenityType.includes('bus') || 
                amenityType.includes('train') || amenityType.includes('transportation')) {
        if (locationData.transit?.length > 0) {
          setPlaces(locationData.transit);
          setFilteredPlaces(locationData.transit);
          console.log(`Loaded ${locationData.transit.length} transit options`);
        } else {
          fetchCustomAmenityData('Bus Stop');
        }
      } else {
        // For other amenity types, make a specific API call
        fetchCustomAmenityData(amenityType);
      }
    }
  }, [locationData, features, zipCode]);


  // Fix the useEffect cleanup function for Google Maps
useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps && mapRef.current && !googleMapRef.current) {
        initializeMap();
      } else if (!window.google || !window.google.maps) {
        loadGoogleMapsScript();
      }
    };
  
    const loadGoogleMapsScript = () => {
      if (!document.getElementById('google-maps-script')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.id = 'google-maps-script';
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        document.head.appendChild(script);
      }
    };
  
    const initializeMap = () => {
      const mapElement = mapRef.current;
      if (!mapElement) return;
      
      // Geocode zipCode to get coordinates
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: zipCode }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          
          // Initialize the map
          googleMapRef.current = new google.maps.Map(mapElement, {
            center: location,
            zoom: 14,
            mapTypeControl: false
          });
          
          // Initialize directions service and renderer
          directionsService.current = new google.maps.DirectionsService();
          directionsRenderer.current = new google.maps.DirectionsRenderer({
            map: googleMapRef.current,
            suppressMarkers: false
          });
          
          // Initialize info window
          infoWindow.current = new google.maps.InfoWindow();
          
          // Add markers for all places
          addMarkers();
          
          setMapLoaded(true);
        } else {
          console.error('Geocoding failed:', status);
        }
      });
    };
  
    loadGoogleMaps();
    
  // Improved cleanup function to prevent Node.removeChild errors
  return () => {
       // Only clean up map components, _do not_ remove the <script> tag itself
       markersRef.current.forEach(m => m.setMap(null));
       markersRef.current = [];
       if (directionsRenderer.current) {
         directionsRenderer.current.setMap(null);
         directionsRenderer.current = null;
       }
       if (infoWindow.current) {
         infoWindow.current.close();
       }
       googleMapRef.current = null;
     };
}, [zipCode]);

  // Add markers when places or map changes
  useEffect(() => {
    if (mapLoaded && googleMapRef.current) {
      addMarkers();
    }
  }, [filteredPlaces, mapLoaded]);

  // Add markers for all places
const addMarkers = () => {
  if (!googleMapRef.current || !mapLoaded) return;
  
  // Clear existing markers safely
  if (markersRef.current && markersRef.current.length > 0) {
    markersRef.current.forEach(marker => {
      if (marker) marker.setMap(null);
    });
    markersRef.current = [];
  }
  
  // Skip if no places
  if (!filteredPlaces || filteredPlaces.length === 0) return;
  
  // Add a marker for each place
  filteredPlaces.forEach((place, index) => {
    if (!place || !place.address || !googleMapRef.current) return;
    
    // Geocode the address to get coordinates
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: place.address }, (results, status) => {
      if (status === 'OK' && results && results[0] && googleMapRef.current) {
        const location = results[0].geometry.location;
        
        // Create marker
        const marker = new google.maps.Marker({
          position: location,
          map: googleMapRef.current,
          title: place.title,
          label: {
            text: String(index + 1),
            color: '#FFFFFF',
            fontWeight: 'bold'
          },
          animation: google.maps.Animation.DROP
        });
        
        // Add click handler
        marker.addListener('click', () => {
          setSelectedPlaceIndex(index);
          showPlaceInfo(place, marker);
        });
        
        // Store marker reference
        markersRef.current.push(marker);
      }
    });
  });
};
  // Show info window for a place
  const showPlaceInfo = (place: Place, marker: google.maps.Marker) => {
    if (!infoWindow.current || !googleMapRef.current) return;
    
    // Create info window content
    const content = `
      <div style="max-width: 250px; padding: 5px;">
        <h3 style="margin: 0 0 5px 0; font-size: 16px;">${place.title}</h3>
        <p style="margin: 0 0 5px 0; font-size: 12px;">${place.address}</p>
        ${place.distance ? `<p style="margin: 0; font-size: 12px;">Distance: ${place.distance} miles</p>` : ''}
        ${place.rating ? `<p style="margin: 0; font-size: 12px;">Rating: ${place.rating}/5 (${place.reviews_original})</p>` : ''}
      </div>
    `;
    
    infoWindow.current.setContent(content);
    infoWindow.current.open({
      map: googleMapRef.current,
      anchor: marker
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
    if (!directionsService.current || !directionsRenderer.current || !googleMapRef.current) return;
    
    // First geocode the destination address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: place.address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const destination = results[0].geometry.location;
        
        // Then geocode the origin (zip code)
        geocoder.geocode({ address: zipCode }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const origin = results[0].geometry.location;
            
            // Create route request
            const request = {
              origin: origin,
              destination: destination,
              travelMode: google.maps.TravelMode[travelMode]
            };
            
            // Calculate route
            directionsService.current!.route(request, (result, status) => {
              if (status === 'OK' && result) {
                directionsRenderer.current!.setDirections(result);
                
                // Fit map to show the entire route
                if (googleMapRef.current) {
                  googleMapRef.current.fitBounds(result.routes[0].bounds);
                }
              } else {
                console.error('Directions request failed:', status);
              }
            });
          }
        });
      }
    });
  };

  // Clear the current route
  const clearRoute = () => {
    if (directionsRenderer.current) {
      directionsRenderer.current.setMap(null);
      directionsRenderer.current.setMap(googleMapRef.current);
    }
    // Reset selected place
    setSelectedPlaceIndex(null);
  };

  // Open Google Maps directions in a new tab
  const openExternalDirections = (place: Place) => {
    const destination = encodeURIComponent(place.address);
    const origin = encodeURIComponent(zipCode);
    const mode = selectedTravelMode.toLowerCase();
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`, '_blank');
  };

  // Search for nearby places of a specific type (using Google Places API)
  const searchNearbyPlaces = (type: string) => {
    if (!googleMapRef.current || !window.google || !window.google.maps || !window.google.maps.places) return;
    
    const service = new google.maps.places.PlacesService(googleMapRef.current);
    
    const request = {
      query: `${type} near ${zipCode}`,
      fields: ['name', 'geometry', 'formatted_address']
    };
    
    service.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Convert to our Place format

        
        // Before mapping:
const center = googleMapRef.current?.getCenter();
const originLat = center?.lat();
const originLng = center?.lng();

const newPlaces: Place[] = results.map(result => {
  let distance: number | undefined;
  if (originLat != null && originLng != null && result.geometry?.location) {
    distance = calculateDistance(
      originLat,
      originLng,
      result.geometry.location.lat(),
      result.geometry.location.lng()
    );
  }
  return {
    title: result.name!,
    address: result.formatted_address!,
    type,
    distance
  };
});

        
        // Add to places and filtered places
        setPlaces(prevPlaces => [...prevPlaces, ...newPlaces]);
        setFilteredPlaces(prevFiltered => [...prevFiltered, ...newPlaces]);
        
        // Add markers for new places
        setTimeout(addMarkers, 100);
      }
    });
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

  // Handle place card click
  const handlePlaceCardClick = (index: number) => {
    setSelectedPlaceIndex(index);
    
    // Show info window
    if (markersRef.current[index]) {
      showPlaceInfo(filteredPlaces[index], markersRef.current[index]);
      
      // Pan to marker
      if (googleMapRef.current) {
        googleMapRef.current.panTo(markersRef.current[index].getPosition()!);
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
        </div>
      </div>
      
      {/* Map Container */}
      <div className="w-full h-96 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 mb-4">
        {isLoading ? (
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
              onClick={() => handlePlaceCardClick(index)}
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

export default TransitAmenitiesResults;