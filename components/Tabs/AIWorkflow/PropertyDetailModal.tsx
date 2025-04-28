"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Property } from 'types/chat';
import Link from 'next/link';
import { 
  FaHome, 
  FaBed, 
  FaBath, 
  FaRulerCombined, 
  FaMoneyBill, 
  FaCalendarAlt, 
  FaTimes,
  FaMapMarkerAlt,
  FaChartLine,
  FaSchool,
  FaHistory,
  FaRoute,
  FaLocationArrow,
  FaDirections,
  FaWalking,
  FaSubway,
  FaParking,
  FaBus,
  FaCar,
  FaBicycle,
  FaSearch,
  FaPlus,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { MdChat, MdInfo, MdClose, MdLocationCity, MdDirectionsTransit } from 'react-icons/md';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  propertyDetails?: any;
}

interface Destination {
  name: string;
  placeId: string;
  label: string;
  travelMode: 'DRIVING' | 'TRANSIT' | 'BICYCLING' | 'WALKING';
  distance?: string;
  duration?: string;
  url?: string;
  active?: boolean;
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ property, onClose, propertyDetails }) => {
  const [isLoading, setIsLoading] = useState(!propertyDetails);
  const [details, setDetails] = useState(propertyDetails);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'history' | 'schools' | 'transit'>('overview');
  const [showChatInfo, setShowChatInfo] = useState(true);
  
  // Maps and routing state
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeDestinationIndex, setActiveDestinationIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalDestination, setModalDestination] = useState<string>('');
  const [selectedTravelMode, setSelectedTravelMode] = useState<'DRIVING' | 'TRANSIT' | 'BICYCLING' | 'WALKING'>('DRIVING');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Map and Google Places references
  const mapRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const destinationContainerRef = useRef<HTMLDivElement>(null);
  
  const markerLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Load property details if not provided
  useEffect(() => {
    if (!propertyDetails && property.zpid) {
      setIsLoading(true);
      
      fetch('/api/property_details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zpid: property.zpid })
      })
      .then(res => res.json())
      .then(data => {
        setDetails(data.results);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading property details:', err);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [property.zpid, propertyDetails]);

  // Initialize maps
  useEffect(() => {
    // Check if Google Maps API is already loaded
    const initializeMap = () => {
      if (mapRef.current && window.google && activeTab === 'transit') {
        // Get geocoded location from address if lat/lng not available
        const geocodeAndInitMap = () => {
          const geocoder = new google.maps.Geocoder();
          const mapElement = mapRef.current;
          if (!mapElement) return;

          geocoder.geocode({ address: property.address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const location = results[0].geometry.location;

              // Initialize map
              mapInstance.current = new google.maps.Map(mapElement, {
                center: location,
                zoom: 14,
                mapTypeControl: false
              });

              // Initialize directions service
              directionsService.current = new google.maps.DirectionsService();
              directionsRenderer.current = new google.maps.DirectionsRenderer({
                map: mapInstance.current,
                suppressMarkers: true
              });

              // Add marker for property location
              new google.maps.Marker({
                position: location,
                map: mapInstance.current,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#4285F4",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2
                },
                zIndex: 1
              });
            }
          });
        };

        if (property.latitude && property.longitude) {
          const location = { lat: property.latitude, lng: property.longitude };

          // Initialize map
          mapInstance.current = new google.maps.Map(mapRef.current, {
            center: location,
            zoom: 14,
            mapTypeControl: false
          });

          // Initialize directions service
          directionsService.current = new google.maps.DirectionsService();
          directionsRenderer.current = new google.maps.DirectionsRenderer({
            map: mapInstance.current,
            suppressMarkers: true
          });

          // Add marker for property location
          new google.maps.Marker({
            position: location,
            map: mapInstance.current,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2
            },
            zIndex: 1
          });
        } else {
          geocodeAndInitMap();
        }
      }
    };

    // Check if Google Maps API is already loaded and transit tab is active
    if (window.google && window.google.maps && activeTab === 'transit') {
      initializeMap();
    } else if (activeTab === 'transit') {
      // Load Google Maps API if not loaded yet and tab is active
      if (!document.getElementById('google-maps-script')) {
        const script = document.createElement('script');

        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
        script.id = 'google-maps-script';
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        document.head.appendChild(script);
      }
    }

    return () => {
      // Clear markers
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
      }

      // Clear route
      if (directionsRenderer.current) {
        directionsRenderer.current.setMap(null);
      }
    };
  }, [property.address, property.latitude, property.longitude, activeTab]);

  // Initialize autocomplete when modal is shown
  useEffect(() => {
    // Initialize autocomplete when modal is shown
    if (showModal && window.google && window.google.maps && window.google.maps.places) {
      if (destinationInputRef.current) {
        autocompleteRef.current = new google.maps.places.Autocomplete(destinationInputRef.current, {
          types: ['establishment', 'geocode'],
          fields: ['place_id', 'geometry', 'name']
        });

        // Set bias to current map bounds
        if (mapInstance.current) {
          const bounds = mapInstance.current.getBounds();
          if (bounds) {
            autocompleteRef.current.setBounds(bounds);
          }
        }

        // Focus input
        destinationInputRef.current.focus();
      }
    }
  }, [showModal]);

  // Format price display
  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined) return 'Price not available';
    if (typeof price === 'string') {
      // Extract numeric value if it's a string like "$450,000"
      const numericValue = price.replace(/[^0-9]/g, '');
      return `${parseInt(numericValue).toLocaleString()}`;
    }
    return `${price.toLocaleString()}`;
  };

  // Destinations and routing functions
  const handleAddDestination = () => {
    setIsEditMode(false);
    setModalDestination('');
    setSelectedTravelMode('DRIVING');
    setErrorMessage('');
    setShowModal(true);
  };

  const handleEditDestination = (index: number) => {
    setIsEditMode(true);
    setModalDestination(destinations[index].name);
    setSelectedTravelMode(destinations[index].travelMode);
    setErrorMessage('');
    setActiveDestinationIndex(index);
    setShowModal(true);
  };

  const handleDeleteDestination = () => {
    if (activeDestinationIndex !== null) {
      const newDestinations = [...destinations];
      newDestinations.splice(activeDestinationIndex, 1);
      setDestinations(newDestinations);
      setShowModal(false);

      // Clear route for the deleted destination
      if (directionsRenderer.current) {
        directionsRenderer.current.setMap(null);
      }

      // Remove marker
      if (markersRef.current[activeDestinationIndex]) {
        markersRef.current[activeDestinationIndex].setMap(null);
        markersRef.current.splice(activeDestinationIndex, 1);
      }
    }
  };

  const handleModalSubmit = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    if (!place || !place.geometry || !place.geometry.location) {
      setErrorMessage('Please select a valid location');
      return;
    }

    if (destinations.length >= 10 && !isEditMode) {
      setErrorMessage('Maximum 10 destinations allowed');
      return;
    }

    // Check for duplicate destinations
    if (!isEditMode && destinations.some(dest => dest.placeId === place.place_id)) {
      setErrorMessage('Destination already added');
      return;
    }

    const getDirections = (destination: Destination) => {
      if (!directionsService.current || !mapInstance.current) return;

      const request = {
        origin: property.address,
        destination: { placeId: destination.placeId },
        travelMode: google.maps.TravelMode[destination.travelMode as keyof typeof google.maps.TravelMode],
        unitSystem: google.maps.UnitSystem.IMPERIAL
      };

      directionsService.current.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Update destination with distance and duration
          const route = result.routes[0];
          const leg = route.legs[0];

          const updatedDestinations = [...destinations];

          // Use existing index for edit mode, or add new destination
          const destIndex = isEditMode && activeDestinationIndex !== null ?
            activeDestinationIndex : updatedDestinations.length;

          // Update destination details
          const updatedDestination = {
            ...destination,
            distance: leg.distance?.text || '',
            duration: leg.duration?.text || ''
          };

          if (isEditMode && activeDestinationIndex !== null) {
            updatedDestinations[activeDestinationIndex] = updatedDestination;
          } else {
            updatedDestinations.push(updatedDestination);
          }

          setDestinations(updatedDestinations);

          // Add or update marker
          if (markersRef.current[destIndex]) {
            markersRef.current[destIndex].setMap(null);
          }

          const marker = new google.maps.Marker({
            position: leg.end_location,
            map: mapInstance.current,
            label: {
              text: destination.label,
              color: '#FFFFFF',
              fontWeight: 'bold'
            },
            icon: {
              path: 'M10 27c-.2 0-.2 0-.5-1-.3-.8-.7-2-1.6-3.5-1-1.5-2-2.7-3-3.8-2.2-2.8-3.9-5-3.9-8.8C1 4.9 5 1 10 1s9 4 9 8.9c0 3.9-1.8 6-4 8.8-1 1.2-1.9 2.4-2.8 3.8-1 1.5-1.4 2.7-1.6 3.5-.3 1-.4 1-.6 1Z',
              fillColor: '#EA4335',
              fillOpacity: 1,
              strokeColor: '#C5221F',
              strokeWeight: 1,
              scale: 1.2,
              anchor: new google.maps.Point(15, 29),
              labelOrigin: new google.maps.Point(10, 9)
            }
          });

          if (isEditMode && activeDestinationIndex !== null) {
            markersRef.current[activeDestinationIndex] = marker;
          } else {
            markersRef.current.push(marker);
          }

          // Display route
          if (directionsRenderer.current) {
            directionsRenderer.current.setDirections(result);
            directionsRenderer.current.setMap(mapInstance.current);
          }

          // Set this destination as active
          handleDestinationClick(isEditMode && activeDestinationIndex !== null ?
            activeDestinationIndex : updatedDestinations.length - 1);
        }
      });
    };

    // Create new destination
    const newDestination: Destination = {
      name: place.name || modalDestination,
      placeId: place.place_id || '',
      label: isEditMode && activeDestinationIndex !== null ?
        destinations[activeDestinationIndex].label :
        markerLabels[destinations.length % markerLabels.length],
      travelMode: selectedTravelMode,
      url: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(property.address)}&destination=${encodeURIComponent(place.name || modalDestination)}&destination_place_id=${place.place_id}&travelmode=${selectedTravelMode.toLowerCase()}`
    };

    // Get directions for the destination
    getDirections(newDestination);

    // Close modal
    setShowModal(false);
  };

  const handleDestinationClick = (index: number) => {
    if (!directionsService.current || !mapInstance.current) return;

    // Update active destination
    setActiveDestinationIndex(index);

    const destination = destinations[index];

    // Show route for selected destination
    const request = {
      origin: property.address,
      destination: { placeId: destination.placeId },
      travelMode: google.maps.TravelMode[destination.travelMode as keyof typeof google.maps.TravelMode]
    };

    directionsService.current.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result && directionsRenderer.current) {
        directionsRenderer.current.setDirections(result);
        directionsRenderer.current.setMap(mapInstance.current);

        // Fit bounds to show the entire route
        if (mapInstance.current && result.routes[0].bounds) {
          mapInstance.current.fitBounds(result.routes[0].bounds);
        }
      }
    });

    // Update markers appearance
    markersRef.current.forEach((marker, i) => {
      const isActive = i === index;
      marker.setIcon({
        path: 'M10 27c-.2 0-.2 0-.5-1-.3-.8-.7-2-1.6-3.5-1-1.5-2-2.7-3-3.8-2.2-2.8-3.9-5-3.9-8.8C1 4.9 5 1 10 1s9 4 9 8.9c0 3.9-1.8 6-4 8.8-1 1.2-1.9 2.4-2.8 3.8-1 1.5-1.4 2.7-1.6 3.5-.3 1-.4 1-.6 1Z',
        fillColor: isActive ? '#EA4335' : '#F1F3F4',
        fillOpacity: 1,
        strokeColor: isActive ? '#C5221F' : '#9AA0A6',
        strokeWeight: 1,
        scale: 1.2,
        anchor: new google.maps.Point(15, 29),
        labelOrigin: new google.maps.Point(10, 9)
      });
      marker.setLabel({
        text: destinations[i].label,
        color: isActive ? '#FFFFFF' : '#3C4043',
        fontWeight: 'bold'
      });
    });
  };

  const searchNearby = (searchTerm: string) => {
    const url = `https://www.google.com/maps/search/${searchTerm}+near+${encodeURIComponent(property.address)}`;
    window.open(url, '_blank');
  };

  const handleScroll = (direction: number) => {
    if (destinationContainerRef.current) {
      const scrollAmount = direction * 250; // Adjust scroll amount as needed
      destinationContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Property Details</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <FaTimes size={24} />
            </button>
          </div>
          <div className="flex justify-center p-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <div className="text-teal-600 font-medium">Loading property details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Property Details</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <FaTimes size={24} />
          </button>
        </div>

        {/* Property Header */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
          <div className="md:flex">
            {/* Property Image */}
            <div className="md:flex-shrink-0 relative">
              <img
                className="h-72 w-full object-cover md:w-96"
                src={property.imgSrc || "https://via.placeholder.com/400x300?text=No+Image"}
                alt={property.address}
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/400x300?text=No+Image";
                }}
              />
              {/* Price tag overlay */}
              <div className="absolute top-4 right-4 bg-emerald-600 text-white py-2 px-4 rounded-lg shadow-lg">
                <span className="text-xl font-bold">{formatPrice(property.price)}</span>
              </div>
            </div>
            
            {/* Property Summary */}
            <div className="p-6 w-full">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{property.address}</h3>
              
              <div className="flex items-center text-slate-600 mb-4">
                <FaMapMarkerAlt className="mr-2 text-emerald-600" />
                {details?.basic_info?.address?.city}, {details?.basic_info?.address?.state} {details?.basic_info?.address?.zipcode}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg flex items-center">
                  <FaBed className="text-emerald-600 mr-2 text-xl" />
                  <div>
                    <div className="text-xs text-slate-500">Beds</div>
                    <div className="font-semibold">{property.beds}</div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg flex items-center">
                  <FaBath className="text-emerald-600 mr-2 text-xl" />
                  <div>
                    <div className="text-xs text-slate-500">Baths</div>
                    <div className="font-semibold">{property.baths}</div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg flex items-center">
                  <FaRulerCombined className="text-emerald-600 mr-2 text-xl" />
                  <div>
                    <div className="text-xs text-slate-500">Square Feet</div>
                    <div className="font-semibold">
                      {typeof property.sqft === 'number' ? property.sqft.toLocaleString() : property.sqft}
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg flex items-center">
                  <FaHome className="text-emerald-600 mr-2 text-xl" />
                  <div>
                    <div className="text-xs text-slate-500">Type</div>
                    <div className="font-semibold">{property.type}</div>
                  </div>
                </div>
              </div>
              
              {details?.basic_info?.yearBuilt && (
                <div className="mt-4 text-slate-700">
                  <FaCalendarAlt className="inline-block mr-2 text-emerald-600" />
                  Year Built: {details.basic_info.yearBuilt}
                </div>
              )}

              {/* Chat button */}
              <div className="relative mt-4">
                {showChatInfo && (
                  <div className="bg-white p-4 rounded-lg shadow-lg border border-teal-200 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-teal-700">Chat with This Property</h3>
                      <button 
                        onClick={() => setShowChatInfo(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <MdClose />
                      </button>
                    </div>
                    <p className="text-slate-700 text-sm mb-2">
                      Start a conversation about this property to:
                    </p>
                    <ul className="text-sm text-slate-600 mb-3 list-disc pl-5">
                      <li>Get detailed property information</li>
                      <li>See historical price data</li>
                      <li>Access comparative market analysis</li>
                      <li>Learn about the neighborhood</li>
                      <li>Explore financing options</li>
                    </ul>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Link target='_blank' href={`/chat?propertyId=${property.zpid}`} className="flex-1">
                    <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md w-full justify-center">
                      <MdChat className="h-5 w-5" />
                      Chat with this property
                    </button>
                  </Link>
                  <button 
                    onClick={() => setShowChatInfo(!showChatInfo)}
                    className="bg-teal-100 text-teal-600 p-2 rounded-md hover:bg-teal-200"
                    title="Learn about chat features"
                  >
                    <MdInfo className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-1">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-100">
                    Location
                  </h3>
                  <div className="h-44 bg-slate-100 rounded-lg overflow-hidden mb-3">
                    {/* Map placeholder */}
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(property.address)}`}
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="text-slate-700">
                    <FaMapMarkerAlt className="inline-block mr-1 text-emerald-600" />
                    {details?.basic_info?.address?.streetAddress}, {details?.basic_info?.address?.city}, {details?.basic_info?.address?.state} {details?.basic_info?.address?.zipcode}
                  </p>
                </div>
              </div>
            </div>
          )}      

        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;