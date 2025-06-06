
"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Phone, MapPin, Star, ChevronLeft, ChevronRight, BedDouble, Utensils, Home, Building, Tent } from "lucide-react";

interface Review {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
}

interface Place {
  place_id: string;
  name: string;
  geometry?: { location: google.maps.LatLng };
  formatted_address?: string;
  vicinity?: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: { isOpen: () => boolean; weekday_text?: string[] };
  rating?: number;
  user_ratings_total?: number;
  photos?: { getUrl: (options: { maxWidth: number; maxHeight: number }) => string }[];
  index?: number;
  category?: string;
  reviews?: Review[];
}

type GoogleMap = google.maps.Map;
type GoogleMarker = google.maps.Marker;
type GoogleInfoWindow = google.maps.InfoWindow;

const placeTypes = [
  { id: "lodging", label: "Hotels", category: "Hotel", color: "blue-500", Icon: BedDouble },
  { id: "restaurant", label: "Restaurants", category: "Restaurant", color: "red-500", Icon: Utensils },
  { id: "homestay", label: "Homestays", category: "Homestay", color: "emerald-500", Icon: Home },
  { id: "hostel", label: "Hostels", category: "Hostel", color: "amber-500", Icon: Building },
  { id: "vacation_rental", label: "Vacation Rentals", category: "Vacation Rental", color: "violet-500", Icon: Tent },
] as const;

const useHoverScroll = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, width } = el.getBoundingClientRect();
      const mouseX = e.clientX - left;
      const scrollSpeed = 0.5;

      if (mouseX < width * 0.15) {
        el.scrollLeft -= scrollSpeed * (width * 0.15 - mouseX);
      } else if (mouseX > width * 0.85) {
        el.scrollLeft += scrollSpeed * (mouseX - width * 0.85);
      }
    };

    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return scrollRef;
};

const PlaceCategoryRow = ({ typeInfo, places, onPlaceClick, onShowInMapClick }: { 
  typeInfo: typeof placeTypes[number]; 
  places: Place[]; 
  onPlaceClick: (place: Place) => void; 
  onShowInMapClick: (place: Place, e: React.MouseEvent) => void; 
}) => {
  const scrollRef = useHoverScroll();
  const { color, Icon, category } = typeInfo;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (places.length === 0) return null;

  const headingText = {
    Hotel: "Serene Stays & Luxurious Hotels",
    Restaurant: "Culinary Delights & Finest Dining",
    Homestay: "Cozy Homestays & Local Charm",
    Hostel: "Vibrant Hostels for the Modern Traveler",
    "Vacation Rental": "Your Perfect Vacation Rentals",
  };

  return (
    <div className="mb-12 relative">
      <div className="flex justify-between items-center mb-4">
        <div className={`flex items-center space-x-2 border-l-4 border-${color} pl-3`}>
          <Icon className={`w-6 h-6 text-${color}`} />
          <h2 className="text-2xl font-semibold text-gray-800">{headingText[category]}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => scroll("left")} className="p-1.5 rounded-full bg-white shadow-sm hover:bg-gray-100 transition transform hover:scale-105">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={() => scroll("right")} className="p-1.5 rounded-full bg-white shadow-sm hover:bg-gray-100 transition transform hover:scale-105">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex space-x-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 scrollbar-hide">
        {places.map((place) => (
          <PlaceCard key={place.place_id} place={place} color={color} onPlaceClick={onPlaceClick} onShowInMapClick={onShowInMapClick} />
        ))}
      </div>
    </div>
  );
};

const PlaceCard = ({ place, color, onPlaceClick, onShowInMapClick }: { 
  place: Place; 
  color: string; 
  onPlaceClick: (place: Place) => void; 
  onShowInMapClick: (place: Place, e: React.MouseEvent) => void; 
}) => (
  <div
    onClick={() => onPlaceClick(place)}
    className={`w-72 flex-shrink-0 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-b-4 border-${color} hover:border-${color.replace("500", "600")}`}
  >
    <div className="relative h-44">
      <img
        src={place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }) || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
        alt={place.name}
        className="w-full h-full object-cover rounded-t-lg transition-transform duration-500 hover:scale-105"
        onError={(e) => {
          e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-3">
        <h3 className="font-semibold text-lg text-white truncate">{place.name}</h3>
      </div>
      <div className={`absolute top-2 right-2 bg-${color} text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm`}>{place.category}</div>
    </div>
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
          <span className="text-sm font-medium text-gray-700">{place.rating?.toFixed(1) || "N/A"}</span>
          <span className="text-xs text-gray-500 ml-1.5">({place.user_ratings_total || 0})</span>
        </div>
        {place.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`bg-${color} hover:bg-${color.replace("500", "600")} text-white py-1.5 px-3 rounded-md text-xs font-medium transition-colors`}
          >
            Book
          </a>
        )}
      </div>
      <div className="flex items-start text-gray-600 text-xs">
        <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0 text-gray-400" />
        <span className="line-clamp-1">{place.vicinity || place.formatted_address || "Address not available"}</span>
      </div>
    </div>
    <div className="p-2 bg-gray-50 text-center">
      <button
        onClick={(e) => onShowInMapClick(place, e)}
        className={`text-xs font-medium text-${color} hover:text-${color.replace("500", "600")} transition-colors`}
      >
        Show in Map
      </button>
    </div>
  </div>
);

const HotelExplorer = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<Record<string, Place[]>>({
    Hotel: [], Restaurant: [], Homestay: [], Hostel: [], "Vacation Rental": [],
  });
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<GoogleMap | null>(null);
  const [markers, setMarkers] = useState<GoogleMarker[]>([]);
  const [infoWindow, setInfoWindow] = useState<GoogleInfoWindow | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [location, setLocation] = useState("");
  const [searchLocation, setSearchLocation] = useState<google.maps.LatLng | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setPreviewPlace(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const createMarker = (place: Place, map: GoogleMap) => {
    if (!place.geometry || !place.geometry.location) return null;
    try {
      const placeType = placeTypes.find((pt) => pt.category === place.category);
      const markerIcon = {
        path: `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z`,
        fillColor: placeType?.color ? `var(--color-${placeType.color})` : "#3B82F6",
        fillOpacity: 1,
        strokeWeight: 0,
        rotation: 0,
        scale: 1.5,
        anchor: new google.maps.Point(12, 24),
      };

      const marker = new window.google.maps.Marker({
        position: place.geometry.location,
        map,
        title: place.name,
        icon: markerIcon,
        animation: window.google.maps.Animation.DROP,
      });

      marker.addListener("click", () => {
        setPreviewPlace(place);
        if (infoWindow) {
          infoWindow.setContent(
            `<div class="p-2 max-w-xs font-sans">
              <h3 class="font-bold text-base mb-1 text-gray-800">${place.name}</h3>
              <p class="text-xs text-gray-600">${place.vicinity || ""}</p>
            </div>`
          );
          infoWindow.open(map, marker);
        }
      });

      setMarkers((prev) => [...prev, marker]);
      return marker;
    } catch (err) {
      console.error("Error creating marker:", err);
      return null;
    }
  };

  useEffect(() => {
    const initMap = () => {
      if (isMapInitialized) return;
      if (window.google && window.google.maps) {
        setIsMapInitialized(true);
      } else {
        const script = document.createElement("script");
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        window.initGoogleMaps = () => setIsMapInitialized(true);
        script.onerror = () => {
          setError("Failed to load Google Maps. Please check your API key and connection.");
          setIsLoading(false);
        };
        document.head.appendChild(script);
      }
    };

    const fetchPlacesForType = (service: google.maps.places.PlacesService, locationCoords: google.maps.LatLng, placeTypeInfo: typeof placeTypes[number]) => {
      return new Promise<void>((resolve, reject) => {
        const request = {
          location: locationCoords,
          radius: 5000,
          type: placeTypeInfo.id,
          keyword: placeTypeInfo.id === "homestay" ? "homestay guesthouse" :
                   placeTypeInfo.id === "hostel" ? "hostel" :
                   placeTypeInfo.id === "vacation_rental" ? "vacation rental apartment" : undefined,
        };

        service.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const detailPromises = results.map((place) =>
              new Promise<Place | null>((resolve) => {
                service.getDetails(
                  {
                    placeId: place.place_id,
                    fields: ["name", "place_id", "geometry", "formatted_address", "vicinity", "formatted_phone_number", "website", "opening_hours", "rating", "user_ratings_total", "photos", "reviews"],
                  },
                  (placeDetails, detailStatus) => {
                    if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                      resolve({ ...placeDetails, category: placeTypeInfo.category });
                    } else {
                      resolve(null);
                    }
                  }
                );
              })
            );
            Promise.all(detailPromises).then((detailedPlaces) => {
              const validPlaces = detailedPlaces.filter((p): p is Place => p !== null);
              setPlaces((prevPlaces) => ({
                ...prevPlaces,
                [placeTypeInfo.category]: [...prevPlaces[placeTypeInfo.category], ...validPlaces].sort((a, b) => (b.rating || 0) - (a.rating || 0)),
              }));
              resolve();
            });
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve();
          } else {
            reject(new Error(`Nearby search failed for ${placeTypeInfo.label} with status: ${status}`));
          }
        });
      });
    };

    initMap();

    if (isMapInitialized && searchLocation) {
      setIsLoading(true);
      setPlaces({ Hotel: [], Restaurant: [], Homestay: [], Hostel: [], "Vacation Rental": [] });
      const map = new window.google.maps.Map(document.createElement("div"));
      const service = new window.google.maps.places.PlacesService(map);
      const searchPromises = placeTypes.map((type) => fetchPlacesForType(service, searchLocation, type));

      Promise.all(searchPromises).then(() => {
        setIsLoading(false);
      }).catch((err) => {
        setError(`Error fetching places: ${(err as Error).message}`);
        setIsLoading(false);
      });
    }

    return () => {
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [isMapInitialized, searchLocation]);

  useEffect(() => {
    if (isMapVisible && mapRef.current) {
      const allPlaces = Object.values(places).flat();
      if (allPlaces.length > 0) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: selectedPlace?.geometry?.location || searchLocation || { lat: 0, lng: 0 },
          zoom: selectedPlace ? 16 : 13,
          mapTypeId: "roadmap",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#e9e9e9" }, { lightness: 17 }] },
            { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }, { lightness: 20 }] },
          ],
        });
        setMapInstance(map);
        const infoWindowInstance = new window.google.maps.InfoWindow({
          pixelOffset: new google.maps.Size(0, -10),
        });
        setInfoWindow(infoWindowInstance);

        markers.forEach((marker) => marker.setMap(null));
        setMarkers([]);

        allPlaces.forEach((place) => createMarker(place, map));

        if (selectedPlace) {
          map.setCenter(selectedPlace.geometry.location);
          map.setZoom(16);
        }
      }
    }
  }, [isMapVisible, selectedPlace, places, searchLocation]);

  const renderRatingStars = (rating?: number) => {
    const effectiveRating = rating ?? 0;
    const fullStars = Math.floor(effectiveRating);
    const hasHalfStar = effectiveRating % 1 >= 0.5;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={`star-${i}`}
            className={`w-4 h-4 ${i < fullStars ? "text-yellow-400 fill-yellow-400" : i === fullStars && hasHalfStar ? "text-yellow-400" : "text-gray-300"}`}
            style={i === fullStars && hasHalfStar ? { clipPath: "inset(0 50% 0 0)" } : {}}
          />
        ))}
        {effectiveRating > 0 && <span className="ml-1 text-xs text-gray-600">{effectiveRating.toFixed(1)}</span>}
      </div>
    );
  };

  const handlePlaceCardClick = (place: Place) => {
    setPreviewPlace(place);
    setShowAllReviews(false);
  };

  const handleShowInMapClick = (place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlace(place);
    setIsMapVisible(true);
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setPlaces({ Hotel: [], Restaurant: [], Homestay: [], Hostel: [], "Vacation Rental": [] });
    if (!isMapInitialized) {
      setError("Map service is not available yet. Please wait a moment and try again.");
      setIsLoading(false);
      return;
    }

    const service = new window.google.maps.places.PlacesService(document.createElement("div"));
    service.textSearch({ query: location, fields: ["name", "geometry"] }, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.[0]?.geometry?.location) {
        setSearchLocation(results[0].geometry.location);
      } else {
        setError(`Could not find "${location}". Please try another location.`);
        setIsLoading(false);
      }
    });
  };

  const totalPlacesFound = Object.values(places).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">Discover Your Journey</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">Explore vibrant hotels, restaurants, and unique stays for your adventure.</p>
        </header>

        <div className="sticky top-4 z-30 py-3">
          <form onSubmit={handleLocationSubmit} className="max-w-xl mx-auto flex gap-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-100">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Pokhara, Nepal"
              className="flex-1 p-2 pl-4 bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400 text-sm"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-6 rounded-full font-medium hover:from-blue-600 hover:to-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {error && (
          <div className="max-w-xl mx-auto bg-red-100 border border-red-200 text-red-800 px-4 py-2 rounded-lg my-4 text-sm text-center">
            <strong>Error:</strong> {error}
          </div>
        )}

        <button
          onClick={() => setIsMapVisible(!isMapVisible)}
          className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-colors z-50"
        >
          {isMapVisible ? <X className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
        </button>
        {isMapVisible && (
          <div className="fixed bottom-16 right-4 w-[90vw] max-w-sm h-80 bg-white rounded-lg shadow-xl overflow-hidden z-30 border border-gray-100">
            <div ref={mapRef} className="w-full h-full">
              {!searchLocation && <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm">Search for a location to display the map.</div>}
            </div>
          </div>
        )}

        <main className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600">Discovering places for you...</p>
            </div>
          ) : totalPlacesFound > 0 ? (
            <>
              {placeTypes.map((typeInfo) => (
                <PlaceCategoryRow
                  key={typeInfo.id}
                  typeInfo={typeInfo}
                  places={places[typeInfo.category]}
                  onPlaceClick={handlePlaceCardClick}
                  onShowInMapClick={handleShowInMapClick}
                />
              ))}
            </>
          ) : (
            searchLocation && !isLoading && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm max-w-xl mx-auto">
                <h3 className="text-lg font-medium text-gray-800">No places found.</h3>
                <p className="text-gray-500 text-sm mt-1">Your search for "{location}" didn't return any results. Try a different location.</p>
              </div>
            )
          )}
        </main>

        {previewPlace && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div ref={modalRef} className="bg-white rounded-xl max-w-xl w-full max-h-[70vh] overflow-y-auto shadow-xl flex flex-col">
              <div className="relative">
                <img
                  src={previewPlace.photos?.[0]?.getUrl({ maxWidth: 800, maxHeight: 300 }) || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
                  alt={previewPlace.name}
                  className="w-full h-48 object-cover rounded-t-xl"
                />
                <button onClick={() => setPreviewPlace(null)} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full hover:bg-black/80 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 p-3 bg-gradient-to-t from-black/60 to-transparent w-full">
                  <h2 className="text-lg font-semibold text-white truncate">{previewPlace.name}</h2>
                </div>
              </div>
              <div className="p-4 flex-grow">
                <div className="flex items-center mb-2">
                  {renderRatingStars(previewPlace.rating)}
                  <span className="ml-2 text-xs text-gray-500">({previewPlace.user_ratings_total || 0} reviews)</span>
                </div>
                <div className="space-y-2 text-gray-700 text-xs">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="line-clamp-1">{previewPlace.vicinity || previewPlace.formatted_address || "Address not available"}</span>
                  </div>
                  {previewPlace.formatted_phone_number && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`tel:${previewPlace.formatted_phone_number}`} className="hover:text-indigo-600 text-xs">
                        {previewPlace.formatted_phone_number}
                      </a>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-800 mb-2 border-b pb-1">Guest Reviews</h3>
                  <div className="space-y-3">
                    {previewPlace.reviews && previewPlace.reviews.length > 0 ? (
                      <>
                        <div className="bg-gray-50 p-2 rounded-md border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-xs text-gray-800">{previewPlace.reviews[0].author_name}</h4>
                            <span className="text-xs text-gray-500">{previewPlace.reviews[0].relative_time_description}</span>
                          </div>
                          <div className="mb-1">{renderRatingStars(previewPlace.reviews[0].rating)}</div>
                          <p className="text-gray-600 text-xs line-clamp-2">{previewPlace.reviews[0].text}</p>
                          {previewPlace.reviews[0].text.length > 100 && (
                            <button
                              onClick={() => alert(previewPlace.reviews[0].text)}
                              className="text-indigo-600 text-xs hover:underline mt-1"
                            >
                              Read more
                            </button>
                          )}
                        </div>
                        {previewPlace.reviews.length > 1 && (
                          <button
                            onClick={() => setShowAllReviews(!showAllReviews)}
                            className="text-indigo-600 text-xs font-medium hover:underline"
                          >
                            {showAllReviews ? "Hide Reviews" : `Show ${previewPlace.reviews.length - 1} more reviews`}
                          </button>
                        )}
                        {showAllReviews &&
                          previewPlace.reviews.slice(1).map((review, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded-md border border-gray-100 animate-fade-in">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-xs text-gray-800">{review.author_name}</h4>
                                <span className="text-xs text-gray-500">{review.relative_time_description}</span>
                              </div>
                              <div className="mb-1">{renderRatingStars(review.rating)}</div>
                              <p className="text-gray-600 text-xs line-clamp-2">{review.text}</p>
                              {review.text.length > 100 && (
                                <button
                                  onClick={() => alert(review.text)}
                                  className="text-indigo-600 text-xs hover:underline mt-1"
                                >
                                  Read more
                                </button>
                              )}
                            </div>
                          ))}
                      </>
                    ) : (
                      <p className="text-gray-500 italic text-xs">No reviews available.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-b-xl flex justify-end items-center space-x-2">
                <button
                  onClick={(e) => {
                    handleShowInMapClick(previewPlace, e);
                    setPreviewPlace(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1.5 px-3 rounded-md font-medium text-xs transition-colors"
                >
                  Show on Map
                </button>
                {previewPlace.website && (
                  <a
                    href={previewPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`bg-${placeTypes.find((pt) => pt.category === previewPlace.category)?.color} hover:bg-${placeTypes.find((pt) => pt.category === previewPlace.category)?.color.replace("500", "600")} text-white py-1.5 px-4 rounded-md font-medium text-xs transition-colors`}
                  >
                    Book Now
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelExplorer;