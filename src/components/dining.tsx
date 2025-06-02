"use client"
import React, { useEffect, useRef, useState } from "react"
import { X, Phone, MapPin, Star } from "lucide-react"

// Define types for Google Maps objects and place data
interface Review {
  author_name: string
  rating: number
  text: string
  relative_time_description: string
}

interface Place {
  place_id: string
  name: string
  geometry?: {
    location: google.maps.LatLng
  }
  formatted_address?: string
  vicinity?: string
  formatted_phone_number?: string
  website?: string
  opening_hours?: {
    isOpen: () => boolean
    weekday_text?: string[]
  }
  rating?: number
  user_ratings_total?: number
  photos?: {
    getUrl: (options: { maxWidth: number, maxHeight: number }) => string
  }[]
  index?: number
  category?: string
  reviews?: Review[]
}

type GoogleMap = google.maps.Map
type GoogleMarker = google.maps.Marker
type GoogleInfoWindow = google.maps.InfoWindow

const placeTypes = [
  { id: "lodging", label: "Hotels", category: "Hotel", color: "#3B82F6" },
  { id: "restaurant", label: "Restaurants", category: "Restaurant", color: "#EF4444" },
  { id: "homestay", label: "Homestays", category: "Homestay", color: "#10B981" },
  { id: "hostel", label: "Hostels", category: "Hostel", color: "#F59E0B" },
  { id: "vacation_rental", label: "Vacation Rentals", category: "Vacation Rental", color: "#8B5CF6" },
] as const

const HotelExplorer = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const listingRef = useRef<HTMLDivElement>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<GoogleMap | null>(null)
  const [markers, setMarkers] = useState<GoogleMarker[]>([])
  const [infoWindow, setInfoWindow] = useState<GoogleInfoWindow | null>(null)
  const [processedPlaceIds, setProcessedPlaceIds] = useState<Set<string>>(new Set())
  const [isMapInitialized, setIsMapInitialized] = useState(false)
  const [isMapVisible, setIsMapVisible] = useState(false)
  const [location, setLocation] = useState("")
  const [searchLocation, setSearchLocation] = useState<google.maps.LatLng | null>(null)
  const [searchType, setSearchType] = useState<string>("lodging")

  const createMarker = (place: Place, map: GoogleMap) => {
    if (!place.geometry || !place.geometry.location) return null

    try {
      const placeType = placeTypes.find(pt => pt.category === place.category)
      const markerIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: placeType?.color || "#3B82F6",
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 12,
      }

      const marker = new window.google.maps.Marker({
        position: place.geometry.location,
        map,
        title: place.name,
        label: {
          text: place.index?.toString() || "",
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px'
        },
        icon: markerIcon,
        animation: window.google.maps.Animation.DROP
      })

      marker.addListener("click", () => {
        setSelectedPlace(place)
        setPreviewPlace(place)
        if (infoWindow) {
          infoWindow.setContent(
            `<div style="padding: 10px; max-width: 250px;">
              <h3 style="font-weight: bold; margin-bottom: 6px; font-size: 16px;">${place.name}</h3>
              <p style="font-size: 13px; margin: 4px 0;">${place.vicinity || place.formatted_address || ""}</p>
              <p style="font-size: 13px; margin: 4px 0;">Rating: ${place.rating?.toFixed(1) || "N/A"} ⭐</p>
              <p style="font-size: 13px; margin: 4px 0;">Reviews: ${place.user_ratings_total || 0}</p>
              ${place.formatted_phone_number ? `<p style="font-size: 13px; margin: 4px 0;">Phone: ${place.formatted_phone_number}</p>` : ""}
            </div>`
          )
          infoWindow.open(map, marker)
        }
        const listItem = document.getElementById(`place-${place.place_id}`)
        if (listItem && listingRef.current) {
          listingRef.current.scrollTop = listItem.offsetTop - listingRef.current.offsetTop
        }
      })

      setMarkers(prev => [...prev, marker])
      return marker
    } catch (err) {
      console.error("Error creating marker:", err)
      return null
    }
  }

  useEffect(() => {
    const initMap = () => {
      if (isMapInitialized) return
      if (window.google && window.google.maps) {
        setIsMapInitialized(true)
      } else {
        loadGoogleMapsScript()
      }
    }

    const loadGoogleMapsScript = () => {
      if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) return
      const script = document.createElement("script")
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE"
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`
      script.async = true
      script.defer = true
      window.initGoogleMaps = () => setIsMapInitialized(true)
      script.onerror = () => {
        setError("Failed to load Google Maps. Please check your connection and try again.")
        setIsLoading(false)
      }
      document.head.appendChild(script)
    }

    const fetchPlaces = (service: google.maps.places.PlacesService, locationCoords: google.maps.LatLng) => {
      const newProcessedPlaceIds = new Set<string>()
      let allResults: Place[] = []

      try {
        const request = {
          location: locationCoords,
          radius: 5000,
          type: searchType === "restaurant" ? "restaurant" : "lodging",
          keyword: searchType === "homestay" ? "homestay guesthouse" :
                   searchType === "hostel" ? "hostel" :
                   searchType === "vacation_rental" ? "vacation rental apartment" : undefined
        }

        service.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            let detailRequestsCompleted = 0
            const totalRequests = results.length

            results.forEach((place) => {
              if (newProcessedPlaceIds.has(place.place_id)) {
                detailRequestsCompleted++
                return
              }

              newProcessedPlaceIds.add(place.place_id)
              service.getDetails(
                {
                  placeId: place.place_id,
                  fields: [
                    "name", "place_id", "geometry", "formatted_address", "vicinity",
                    "formatted_phone_number", "website", "opening_hours",
                    "rating", "user_ratings_total", "photos", "reviews"
                  ]
                },
                (placeDetails, detailStatus) => {
                  detailRequestsCompleted++
                  if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                    const placeType = placeTypes.find(pt => pt.id === searchType)
                    const enrichedPlace: Place = {
                      ...placeDetails,
                      category: placeType?.category || "Place",
                      index: allResults.length + 1
                    }
                    allResults.push(enrichedPlace)
                  }

                  if (detailRequestsCompleted === totalRequests || (allResults.length > 5 && detailRequestsCompleted >= totalRequests * 0.5)) {
                    const sortedResults = [...allResults].sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    sortedResults.forEach((r, idx) => r.index = idx + 1)
                    setPlaces(sortedResults)
                    setProcessedPlaceIds(newProcessedPlaceIds)
                    setIsLoading(false)
                  }
                }
              )
            })

            setTimeout(() => {
              if (isLoading && allResults.length === 0) {
                setError("Could not load details. Please try again later.")
                setIsLoading(false)
              }
            }, 10000)
          } else {
            setError(`No ${placeTypes.find(pt => pt.id === searchType)?.label.toLowerCase() || "places"} found in ${location}. Please try another location.`)
            setIsLoading(false)
          }
        })
      } catch (err) {
        setError(`Error fetching ${placeTypes.find(pt => pt.id === searchType)?.label.toLowerCase() || "places"}: ${(err as Error).message}`)
        setIsLoading(false)
      }
    }

    initMap()

    if (isMapInitialized && searchLocation) {
      const map = new window.google.maps.Map(document.createElement('div'))
      const service = new window.google.maps.places.PlacesService(map)
      fetchPlaces(service, searchLocation)
    }

    return () => {
      markers.forEach(marker => marker.setMap(null))
    }
  }, [isMapInitialized, searchLocation, searchType])

  useEffect(() => {
    if (isMapVisible && mapRef.current && places.length > 0) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: selectedPlace?.geometry?.location || places[0]?.geometry?.location || { lat: 0, lng: 0 },
        zoom: selectedPlace ? 16 : 14,
        mapTypeId: "roadmap",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#e9e9e9" }, { lightness: 17 }] },
          { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }, { lightness: 20 }] }
        ]
      })

      setMapInstance(map)
      const infoWindowInstance = new window.google.maps.InfoWindow()
      setInfoWindow(infoWindowInstance)

      const placesToMark = selectedPlace ? [selectedPlace] : places
      placesToMark.forEach(place => createMarker(place, map))

      if (selectedPlace && infoWindow) {
        const marker = markers.find(m => m.getTitle() === selectedPlace.name)
        if (marker) {
          infoWindow.setContent(
            `<div style="padding: 10px; max-width: 250px;">
              <h3 style="font-weight: bold; margin-bottom: 6px; font-size: 16px;">${selectedPlace.name}</h3>
              <p style="font-size: 13px; margin: 4px 0;">${selectedPlace.vicinity || selectedPlace.formatted_address || ""}</p>
              <p style="font-size: 13px; margin: 4px 0;">Rating: ${selectedPlace.rating?.toFixed(1) || "N/A"} ⭐</p>
              <p style="font-size: 13px; margin: 4px 0;">Reviews: ${selectedPlace.user_ratings_total || 0}</p>
              ${selectedPlace.formatted_phone_number ? `<p style="font-size: 13px; margin: 4px 0;">Phone: ${selectedPlace.formatted_phone_number}</p>` : ""}
            </div>`
          )
          infoWindow.open(map, marker)
        }
      }
    }
  }, [isMapVisible, selectedPlace, places])

  const renderRatingStars = (rating?: number, interactive: boolean = false, onClickStar?: (star: number) => void) => {
    const effectiveRating = rating ?? 0
    const fullStars = Math.floor(effectiveRating)
    const hasHalfStar = effectiveRating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <button
            key={`star-${i}`}
            onClick={interactive && onClickStar ? () => onClickStar(i + 1) : undefined}
            className={`w-5 h-5 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            disabled={!interactive}
            aria-label={interactive ? `Set minimum rating to ${i + 1} stars` : undefined}
          >
            {i < fullStars ? (
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ) : i === fullStars && hasHalfStar ? (
              <span className="relative inline-block w-5 h-5">
                <Star className="w-5 h-5 text-yellow-400" />
                <Star
                  className="absolute left-0 top-0 w-5 h-5 fill-yellow-400 text-yellow-400"
                  style={{ clipPath: 'inset(0 50% 0 0)' }}
                />
              </span>
            ) : (
              <Star className="w-5 h-5 text-gray-200" />
            )}
          </button>
        ))}
        {effectiveRating > 0 && (
          <span className="ml-2 text-sm font-medium text-gray-600">{effectiveRating.toFixed(1)}</span>
        )}
      </div>
    )
  }

  const handlePlaceCardClick = (place: Place) => {
    setSelectedPlace(place)
    setPreviewPlace(place)
  }

  const handleShowInMapClick = (place: Place, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPlace(place)
    setIsMapVisible(true)
  }

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim()) {
      setError("Please enter a location.")
      return
    }
    setIsLoading(true)
    setError(null)
    setPlaces([])
    const map = new window.google.maps.Map(document.createElement('div'))
    const service = new window.google.maps.places.PlacesService(map)
    const request = {
      query: location,
      fields: ["name", "geometry"]
    }

    service.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const locationCoords = results[0].geometry?.location
        setSearchLocation(locationCoords)
      } else {
        setError("Failed to find location. Please try another location.")
        setIsLoading(false)
      }
    })
  }

  const handleSearchTypeToggle = (type: string) => {
    setSearchType(type)
    setPlaces([])
    setSelectedPlace(null)
    setPreviewPlace(null)
    setMarkers([])
    if (searchLocation) {
      setIsLoading(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 relative">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Discover Places
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Explore curated accommodations and dining with traveler reviews
          </p>
        </div>

        {/* Location Input Form */}
        <div className="mb-12 bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Search Location</h3>
          <form onSubmit={handleLocationSubmit} className="flex gap-4">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter a city or location (e.g., Pokhara, Nepal)"
              className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8 shadow-sm">
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        )}

        {/* Floating Map Popup */}
        <button
          onClick={() => setIsMapVisible(!isMapVisible)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        >
          {isMapVisible ? <X className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
        </button>
        {isMapVisible && (
          <div className="fixed bottom-20 right-6 w-[400px] h-[400px] bg-white rounded-xl shadow-xl overflow-hidden z-50 transition-all duration-300">
            <div ref={mapRef} className="w-full h-full"></div>
          </div>
        )}

        {/* Places Section */}
        <section ref={listingRef}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <h2 className="text-3xl font-bold text-gray-900">{placeTypes.find(pt => pt.id === searchType)?.label || "Places"}</h2>
              <div className="flex flex-wrap gap-2">
                {placeTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleSearchTypeToggle(type.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      searchType === type.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type.label} {places.length > 0 && searchType === type.id ? `(${places.length})` : ""}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-blue-600 font-medium">{places.length} {placeTypes.find(pt => pt.id === searchType)?.label.toLowerCase() || "places"} found</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xl font-medium text-gray-700">Finding the best {placeTypes.find(pt => pt.id === searchType)?.label.toLowerCase() || "places"}...</p>
              </div>
            </div>
          ) : places.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {places.slice(0, 12).map((place) => (
                <div
                  key={place.place_id}
                  id={`place-${place.place_id}`}
                  onClick={() => handlePlaceCardClick(place)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="relative h-64">
                    <img
                      src={place.photos?.[0]?.getUrl({ maxWidth: 600, maxHeight: 400 }) || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
                      alt={place.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945"
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-xl text-gray-900">{place.name}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-lg">{place.category}</span>
                    </div>
                    {renderRatingStars(place.rating)}
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="truncate">{place.vicinity || place.formatted_address || "Address not available"}</span>
                      </div>
                      {place.formatted_phone_number && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <Phone className="h-4 w-4 mr-2 text-blue-500" />
                          <a href={`tel:${place.formatted_phone_number}`} className="hover:text-blue-600">{place.formatted_phone_number}</a>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                      <button
                        onClick={(e) => handleShowInMapClick(place, e)}
                        className="bg-blue-100 text-blue-800 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                      >
                        Show in Map
                      </button>
                      {place.website && (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Book Now
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
              <p className="text-gray-600 text-lg font-medium">No {placeTypes.find(pt => pt.id === searchType)?.label.toLowerCase() || "places"} found.</p>
              <p className="text-gray-500 mt-2">Try searching for a different location.</p>
            </div>
          )}
        </section>

        {/* Place Preview Modal */}
        {previewPlace && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="relative">
                <button
                  onClick={() => setPreviewPlace(null)}
                  className="absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow hover:bg-white"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
                <img
                  src={previewPlace.photos?.[0]?.getUrl({ maxWidth: 1200, maxHeight: 600 }) || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
                  alt={previewPlace.name}
                  className="w-full h-96 object-cover rounded-t-2xl"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945"
                  }}
                />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-gray-900">{previewPlace.name}</h2>
                  <h3 className="text-xl font-semibold text-gray-900">Guest Reviews</h3>
                </div>
                <div className="flex items-center mb-6">
                  {renderRatingStars(previewPlace.rating)}
                  <span className="ml-2 text-gray-500">({previewPlace.user_ratings_total || 0} reviews)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                      <span>{previewPlace.vicinity || previewPlace.formatted_address || "Address not available"}</span>
                    </div>
                    {previewPlace.formatted_phone_number && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-5 w-5 mr-2 text-blue-500" />
                        <a href={`tel:${previewPlace.formatted_phone_number}`} className="hover:text-blue-600">
                          {previewPlace.formatted_phone_number}
                        </a>
                      </div>
                    )}
                    {previewPlace.website && (
                      <a
                        href={previewPlace.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium mt-4"
                      >
                        Book Now
                      </a>
                    )}
                  </div>
                  <div className="space-y-4">
                    {previewPlace.reviews && previewPlace.reviews.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {previewPlace.reviews.slice(0, 5).map((review, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-800">{review.author_name}</h4>
                              <span className="text-sm text-gray-500">{review.relative_time_description}</span>
                            </div>
                            <div className="mb-2">{renderRatingStars(review.rating)}</div>
                            <p className="text-gray-600 text-sm line-clamp-3">{review.text}</p>
                            {review.text.length > 150 && (
                              <button
                                onClick={() => alert(review.text)}
                                className="text-blue-600 text-sm font-medium hover:underline mt-1"
                              >
                                Read more
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No reviews available for this {previewPlace.category.toLowerCase()}.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HotelExplorer