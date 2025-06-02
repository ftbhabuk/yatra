"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Hotel,
  MapPin,
  Star,
  Phone,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
  Map,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogClose, DialogHeader } from "@/components/ui/dialog";

interface Place {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    isOpen: () => boolean;
    weekday_text?: string[];
  };
  price_level?: number;
  rating?: number;
  user_ratings_total?: number;
  photos?: {
    getUrl: (options: { maxWidth: number }) => string;
  }[];
  types?: string[];
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

interface TripDetailViewerProps {
  data: any;
  userData?: any;
}

const TripDetailViewer: React.FC<TripDetailViewerProps> = ({
  data,
  userData,
}) => {
  const [hotels, setHotels] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Place | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const scriptLoadedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const tripData = data?.record?.tripPlan;
  const destination = tripData?.tripOverview?.destination;

  // Load Google Maps API script
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (scriptLoadedRef.current || window.google?.maps) {
        scriptLoadedRef.current = true;
        setMapLoaded(true);
        fetchMapsData();
        return;
      }

      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com/maps/api/js"]`
      );
      if (existingScript) {
        existingScript.onload = () => {
          scriptLoadedRef.current = true;
          setMapLoaded(true);
          fetchMapsData();
        };
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        setMapLoaded(true);
        fetchMapsData();
      };
      script.onerror = () => {
        setError("Failed to load Google Maps. Please check your connection and try again.");
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    const fetchMapsData = () => {
      if (!window.google?.maps) return;

      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

      const destinationRequest = {
        query: destination,
        fields: ["geometry"],
      };
      service.textSearch(destinationRequest, (results, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results &&
          results.length > 0
        ) {
          const place = results[0];
          const location = place.geometry?.location;
          if (location) {
            service.nearbySearch(
              {
                location,
                radius: 5000,
                type: "lodging",
                rankBy: window.google.maps.places.RankBy.PROMINENCE,
              },
              (results, status) => {
                if (
                  status === window.google.maps.places.PlacesServiceStatus.OK &&
                  results
                ) {
                  const hotelPromises = results.slice(0, 10).map(
                    (place) =>
                      new Promise((resolve) => {
                        service.getDetails(
                          {
                            placeId: place.place_id,
                            fields: [
                              "place_id",
                              "name",
                              "formatted_address",
                              "vicinity",
                              "formatted_phone_number",
                              "website",
                              "opening_hours",
                              "price_level",
                              "rating",
                              "user_ratings_total",
                              "photos",
                              "types",
                              "geometry",
                            ],
                          },
                          (placeDetails, detailStatus) => {
                            if (
                              detailStatus ===
                                window.google.maps.places.PlacesServiceStatus.OK &&
                              placeDetails
                            ) {
                              resolve(placeDetails);
                            } else {
                              resolve(null);
                            }
                          }
                        );
                      })
                  );
                  Promise.all(hotelPromises).then((hotels) => {
                    setHotels(hotels.filter((h) => h !== null) as Place[]);
                    setIsLoading(false);
                  });
                } else {
                  setIsLoading(false);
                }
              }
            );
          } else {
            setError("Failed to find destination location. Please try again later.");
            setIsLoading(false);
          }
        } else {
          setError("Failed to find destination location. Please try again later.");
          setIsLoading(false);
        }
      });
    };

    loadGoogleMapsScript();

    return () => {
      // No need to remove the script as it can be reused
    };
  }, [destination]);

  // Initialize or update map when dialog is shown
  useEffect(() => {
    if (!showMap || !selectedHotel || !mapRef.current || !mapLoaded) return;
    
    // Check if mapRef.current is non-null before proceeding
    const mapContainer = mapRef.current;
    if (!mapContainer) {
      console.error("Map container ref is not available.");
      return;
    }

    // We need to ensure the map container is visible before initializing the map
    // Use setTimeout to wait for the dialog animation to complete
    const timer = setTimeout(() => {
      try {
        const lat = selectedHotel.geometry?.location.lat();
        const lng = selectedHotel.geometry?.location.lng();
        
        if (lat === undefined || lng === undefined) {
          console.error("Selected hotel has no valid coordinates");
          return;
        }
        
        const mapOptions = {
          center: { lat, lng },
          zoom: 15,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "on" }],
            },
            {
              featureType: "transit",
              elementType: "labels",
              stylers: [{ visibility: "on" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e9e9e9" }],
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#f5f5f5" }],
            },
          ],
        };

        // Always create a new map instance when the dialog opens/hotel changes
        // First, clear the existing map instance if it exists
        if (googleMapRef.current) {
          // Optional: Properly clean up the old map instance if needed, 
          // but simply creating a new one usually works for visibility issues.
          // googleMapRef.current = null; // Or specific cleanup methods if available
        }
        
        // Create new map instance attached to the container
        googleMapRef.current = new window.google.maps.Map(mapContainer, mapOptions);

        // Trigger resize immediately after creation
        window.google.maps.event.trigger(googleMapRef.current, 'resize');
        googleMapRef.current.setCenter({ lat, lng }); // Re-center immediately

        // Clear existing marker if any before creating a new one
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        // Create a new marker
        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: googleMapRef.current,
          title: selectedHotel.name,
          animation: window.google.maps.Animation.DROP,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#4f46e5",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 10,
          },
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${selectedHotel.name}</h3>
              <p style="margin: 0; font-size: 14px;">${selectedHotel.vicinity || selectedHotel.formatted_address || ""}</p>
            </div>
          `,
        });

        // Open info window by default
        infoWindow.open({
          anchor: markerRef.current,
          map: googleMapRef.current,
        });

        // Add click listener to marker
        window.google.maps.event.addListener(markerRef.current, "click", () => {
          infoWindow.open({
            anchor: markerRef.current,
            map: googleMapRef.current,
          });
        });
        
        // Trigger resize event slightly after map setup to ensure rendering
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          // Also explicitly tell the map instance to check its bounds
          if (googleMapRef.current) {
            googleMapRef.current.setCenter({ lat, lng }); // Re-center just in case
            googleMapRef.current.setZoom(15); // Re-zoom just in case
            window.google.maps.event.trigger(googleMapRef.current, 'resize'); // Trigger map-specific resize
          }
        }, 100); // Short delay after map setup

      } catch (err) {
        console.error("Error initializing map:", err);
      }
    }, 350); // Slightly increased delay for dialog animation
    
    return () => clearTimeout(timer);
  }, [selectedHotel, showMap, mapLoaded]); // Dependencies remain the same

  const handleHotelClick = (hotel: Place) => {
    setSelectedHotel(hotel);
    setShowMap(true);
  };

  const handleCloseMap = () => {
    setShowMap(false);
    // Don't destroy the map, just hide it
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 330; // Approximate card width + margin
      const currentScroll = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.scrollTo({
        left: direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!tripData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No trip data available. Please check the data structure and try again.
        </AlertDescription>
      </Alert>
    );
  }

  const getValidImageSrc = (url?: string): string => {
    if (url && url !== "N/A" && (url.startsWith("http") || url.startsWith("/"))) {
      return url;
    }
    return "/placeholder.jpg";
  };

  const renderRatingStars = (rating?: number) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {halfStar && (
          <span className="relative">
            <Star className="w-4 h-4 text-yellow-400" />
            <Star
              className="absolute left-0 top-0 w-4 h-4 fill-yellow-400 text-yellow-400 overflow-hidden"
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const HotelsContent = () => (
    <div className="relative">
      {/* Elegant scroll buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md border border-gray-100 hover:bg-indigo-50 transition-colors -ml-3"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5 text-indigo-600" />
      </button>
      
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md border border-gray-100 hover:bg-indigo-50 transition-colors -mr-3"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5 text-indigo-600" />
      </button>
      
      {/* Scrollable hotel cards container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4 scroll-smooth"
        style={{ 
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none',  // IE and Edge
          WebkitOverflowScrolling: 'touch',
          '::WebkitScrollbar': { display: 'none' } // Safari and Chrome
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center w-full min-h-64">
            <div className="text-center">
              <svg
                className="animate-spin h-10 w-10 text-indigo-500 mx-auto mb-2"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-lg font-medium">Loading hotels...</p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : hotels.length === 0 ? (
          <Alert>
            <AlertDescription>No hotels found for {destination}. Please try a different location.</AlertDescription>
          </Alert>
        ) : (
          hotels.map((hotel) => (
            <Card
              key={hotel.place_id}
              className="snap-start min-w-[300px] overflow-hidden group hover:shadow-xl transition-shadow border-none shadow-md cursor-pointer"
              onClick={() => handleHotelClick(hotel)}
            >
              <div className="relative h-48 w-full">
                <Image
                  src={hotel.photos?.[0]?.getUrl({ maxWidth: 600 }) || getValidImageSrc()}
                  alt={hotel.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-3 left-3">{renderRatingStars(hotel.rating)}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute bottom-3 right-3 bg-white/90 hover:bg-indigo-50 border-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHotelClick(hotel);
                  }}
                >
                  <Map className="h-4 w-4 mr-1" /> View Map
                </Button>
              </div>

              <CardHeader className="bg-white">
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-indigo-600" />
                  {hotel.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${hotel.name} ${hotel.vicinity || hotel.formatted_address}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hotel.vicinity || hotel.formatted_address || "Address not available"}
                  </a>
                </CardDescription>
              </CardHeader>

              <CardContent className="bg-white pt-0">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {hotel.types?.slice(0, 5).map((type, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-indigo-50 text-indigo-700 border-indigo-200"
                        >
                          {type.replace(/_/g, " ")}
                        </Badge>
                      )) || <span className="text-gray-500">N/A</span>}
                    </div>
                  </div>
                  {hotel.opening_hours && (
                    <p className="text-sm text-gray-600">
                      {hotel.opening_hours.isOpen() ? "Open Now" : "Closed"}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="bg-white pt-0 flex gap-2 flex-wrap">
                {hotel.website && (
                  <Button
                    variant="default"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a href={hotel.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Book Now
                    </a>
                  </Button>
                )}
                {hotel.formatted_phone_number && (
                  <Button
                    variant="outline"
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a href={`tel:${hotel.formatted_phone_number.replace(/\s+/g, "")}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Custom scrollbar indicator */}
      {hotels.length > 0 && !isLoading && !error && (
        <div className="flex justify-center mt-4 space-x-1">
          {hotels.map((_, index) => (
            <div 
              key={index} 
              className="h-1.5 w-8 rounded-full bg-gray-200" 
              style={{
                background: index === 0 ? "linear-gradient(90deg, #4f46e5 0%, #a5b4fc 100%)" : ""
              }}
            />
          ))}
        </div>
      )}
      
      {/* Hotel map dialog - Using a fixed layout to ensure map displays properly */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center">
              <Hotel className="w-5 h-5 text-indigo-600 mr-2" />
              {selectedHotel?.name || "Hotel Location"}
            </DialogTitle>
            <DialogClose className="absolute right-4 top-4" onClick={handleCloseMap}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 h-full max-h-[80vh]">
            {/* Hotel details in sidebar */}
            <div className="md:col-span-1 p-4 overflow-y-auto border-r md:h-full">
              {selectedHotel?.photos?.[0] && (
                <div className="relative h-40 w-full rounded-lg overflow-hidden mb-4">
                  <Image
                    src={selectedHotel.photos[0].getUrl({ maxWidth: 400 })}
                    alt={selectedHotel.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="font-medium text-lg">{selectedHotel?.name}</h3>
                <p className="text-gray-600 text-sm flex items-start gap-1 mt-1">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span>{selectedHotel?.vicinity || selectedHotel?.formatted_address}</span>
                </p>
                
                {selectedHotel?.formatted_phone_number && (
                  <p className="text-gray-600 text-sm flex items-center gap-1 mt-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    {selectedHotel.formatted_phone_number}
                  </p>
                )}
                
                <div className="mt-2">
                  {renderRatingStars(selectedHotel?.rating)}
                  {selectedHotel?.user_ratings_total && (
                    <p className="text-xs text-gray-500 mt-1">
                      Based on {selectedHotel.user_ratings_total} reviews
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {selectedHotel?.website && (
                  <Button
                    variant="default"
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    asChild
                  >
                    <a href={selectedHotel.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  asChild
                >
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedHotel?.name} ${selectedHotel?.vicinity || selectedHotel?.formatted_address}`
                    )}&query_place_id=${selectedHotel?.place_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </div>
            
            {/* The map - taking the full height */}
            <div className="md:col-span-2 bg-gray-100 flex flex-col">
              {!mapLoaded ? (
                <div className="flex items-center justify-center h-full min-h-96">
                  <div className="text-center">
                    <svg
                      className="animate-spin h-10 w-10 text-indigo-500 mx-auto mb-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p>Loading map...</p>
                  </div>
                </div>
              ) : (
                <div 
                  ref={mapRef} 
                  className="w-full h-full min-h-96" // Ensure parent provides height
                  id="hotel-map" 
                  style={{ minHeight: '400px', height: '100%', width: '100%' }} // Explicit height/width
                ></div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      <HotelsContent />
    </div>
  );
};

export default TripDetailViewer;