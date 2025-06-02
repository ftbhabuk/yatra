<!-- this one has all necessary needed components -->

"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Hotel,
  MapPin,
  Calendar,
  DollarSign,
  Utensils,
  BadgeInfo,
  Clock,
  Sun,
  Plane,
  Bus,
  ShieldAlert,
  Luggage,
  Info,
  Heart,
  Download,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Star,
  Coffee,
  Sunrise,
  Sunset,
  Umbrella,
  Thermometer,
  Users,
  Phone,
  Globe,
  Map,
} from "lucide-react"

interface Place {
  place_id: string
  name: string
  formatted_address?: string
  vicinity?: string
  formatted_phone_number?: string
  website?: string
  opening_hours?: {
    isOpen: () => boolean
    weekday_text?: string[]
  }
  price_level?: number
  rating?: number
  user_ratings_total?: number
  photos?: {
    getUrl: (options: { maxWidth: number }) => string
  }[]
  types?: string[]
  geometry?: {
    location: {
      lat: () => number
      lng: () => number
    }
  }
}

interface Route {
  summary: string
  distance: string
  duration: string
  travelMode: string
}

interface ActivityLocation {
  name: string
  location: string
  lat?: number
  lng?: number
}

interface TripDetailViewerProps {
  data: any
  userData?: any
}

const TripDetailViewer: React.FC<TripDetailViewerProps> = ({ data, userData }) => {
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const [placePhotoUrl, setPlacePhotoUrl] = useState<string | null>(null)
  const [hotels, setHotels] = useState<Place[]>([])
  const [restaurants, setRestaurants] = useState<Place[]>([])
  const [transitStations, setTransitStations] = useState<Place[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [activityPhotos, setActivityPhotos] = useState<{ [key: string]: string | null }>({})
  const [activityLocations, setActivityLocations] = useState<ActivityLocation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showMap, setShowMap] = useState<boolean>(false)
  const hotelMapRef = useRef<HTMLDivElement>(null)
  const restaurantMapRef = useRef<HTMLDivElement>(null)
  const itineraryMapRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  const tripData = data?.record?.tripPlan
  const formData = data?.record?.formData
  const userDataFromForm = formData?.user
  const destination = tripData?.tripOverview?.destination

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (scriptLoadedRef.current || window.google?.maps) {
        fetchMapsData()
        return
      }

      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com/maps/api/js"]`
      )
      if (existingScript) {
        existingScript.onload = () => {
          scriptLoadedRef.current = true
          fetchMapsData()
        }
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        scriptLoadedRef.current = true
        fetchMapsData()
      }
      script.onerror = () => {
        setError("Failed to load Google Maps. Please check your connection and try again.")
        setIsLoading(false)
      }
      document.head.appendChild(script)
    }

    const fetchMapsData = () => {
      if (!window.google?.maps) return

      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      )
      const directionsService = new window.google.maps.DirectionsService()

      const destinationRequest = {
        query: destination,
        fields: ["photos", "geometry"],
      }
      service.textSearch(destinationRequest, (results, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results &&
          results.length > 0
        ) {
          const place = results[0]
          if (place.photos && place.photos.length > 0) {
            setPlacePhotoUrl(place.photos[0].getUrl({ maxWidth: 1200 }))
          }
          const location = place.geometry?.location
          if (location) {
            service.nearbySearch(
              {
                location,
                radius: 5000,
                type: "lodging",
                rankBy: window.google.maps.places.RankBy.PROMINENCE,
              },
              (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
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
                              detailStatus === window.google.maps.places.PlacesServiceStatus.OK &&
                              placeDetails
                            ) {
                              resolve(placeDetails)
                            } else {
                              resolve(null)
                            }
                          }
                        )
                      })
                  )
                  Promise.all(hotelPromises).then((hotels) => {
                    setHotels(hotels.filter((h) => h !== null) as Place[])
                  })
                }
              }
            )

            service.nearbySearch(
              {
                location,
                radius: 5000,
                type: "restaurant",
                rankBy: window.google.maps.places.RankBy.PROMINENCE,
              },
              (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                  const restaurantPromises = results.slice(0, 10).map(
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
                              detailStatus === window.google.maps.places.PlacesServiceStatus.OK &&
                              placeDetails
                            ) {
                              resolve(placeDetails)
                            } else {
                              resolve(null)
                            }
                          }
                        )
                      })
                  )
                  Promise.all(restaurantPromises).then((restaurants) => {
                    setRestaurants(restaurants.filter((r) => r !== null) as Place[])
                  })
                }
              }
            )

            service.nearbySearch(
              {
                location,
                radius: 10000,
                type: "transit_station",
                rankBy: window.google.maps.places.RankBy.PROMINENCE,
              },
              (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                  const transitPromises = results.slice(0, 5).map(
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
                              "rating",
                              "user_ratings_total",
                              "photos",
                              "types",
                              "geometry",
                            ],
                          },
                          (placeDetails, detailStatus) => {
                            if (
                              detailStatus === window.google.maps.places.PlacesServiceStatus.OK &&
                              placeDetails
                            ) {
                              resolve(placeDetails)
                            } else {
                              resolve(null)
                            }
                          }
                        )
                      })
                  )
                  Promise.all(transitPromises).then((transits) => {
                    setTransitStations(transits.filter((t) => t !== null) as Place[])
                  })
                }
              }
            )

            const travelModes = [
              window.google.maps.TravelMode.DRIVING,
              window.google.maps.TravelMode.TRANSIT,
            ]
            const routePromises = travelModes.map(
              (mode) =>
                new Promise((resolve) => {
                  directionsService.route(
                    {
                      origin: "Kathmandu, Nepal",
                      destination,
                      travelMode: mode,
                      provideRouteAlternatives: true,
                    },
                    (result, status) => {
                      if (status === window.google.maps.DirectionsStatus.OK && result) {
                        resolve(
                          result.routes.map((route) => ({
                            summary: route.summary || `Via ${mode.toLowerCase()}`,
                            distance: route.legs[0].distance.text,
                            duration: route.legs[0].duration.text,
                            travelMode: mode,
                          }))
                        )
                      } else {
                        resolve([])
                      }
                    }
                  )
                })
            )
            Promise.all(routePromises).then((routesArray) => {
              setRoutes(routesArray.flat() as Route[])
            })

            const activityLocs: ActivityLocation[] = []
            tripData?.dailyItinerary?.forEach((day: any, dayIndex: number) => {
              day.activities?.forEach((activity: any, actIndex: number) => {
                const activityQuery = `${activity.activity} ${destination}`
                activityLocs.push({ name: activity.activity, location: activity.location })
                service.textSearch(
                  { query: activityQuery, fields: ["photos", "geometry"] },
                  (results, status) => {
                    if (
                      status === window.google.maps.places.PlacesServiceStatus.OK &&
                      results &&
                      results.length > 0
                    ) {
                      const place = results[0]
                      if (place.photos && place.photos.length > 0) {
                        setActivityPhotos((prev) => ({
                          ...prev,
                          [`${dayIndex}-${actIndex}`]: place.photos[0].getUrl({ maxWidth: 200 }),
                        }))
                      }
                      if (place.geometry?.location) {
                        setActivityLocations((prev) =>
                          prev.map((loc, idx) =>
                            idx === activityLocs.length - 1
                              ? {
                                  ...loc,
                                  lat: place.geometry!.location.lat(),
                                  lng: place.geometry!.location.lng(),
                                }
                              : loc
                          )
                        )
                      }
                    }
                  }
                )
              })
            })
            setActivityLocations(activityLocs)
          }
        } else {
          setError("Failed to find destination location. Please try again later.")
        }
        setIsLoading(false)
      })
    }

    loadGoogleMapsScript()

    return () => {
      const script = document.querySelector(
        `script[src*="maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}"]`
      )
      if (script) script.remove()
    }
  }, [destination, tripData?.dailyItinerary])

  const initializeMap = (
    mapElement: HTMLDivElement | null,
    places: Place[] | ActivityLocation[],
    isActivityMap: boolean = false,
    selectedPlace?: Place | ActivityLocation
  ) => {
    if (!mapElement || !window.google?.maps || places.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()
    const validPlaces = places.filter((place) =>
      isActivityMap
        ? (place as ActivityLocation).lat && (place as ActivityLocation).lng
        : (place as Place).geometry?.location
    )

    if (validPlaces.length === 0) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    mapInstanceRef.current = new window.google.maps.Map(mapElement, {
      zoom: 12,
      mapTypeId: "roadmap",
      center: validPlaces[0].geometry
        ? {
            lat: (validPlaces[0] as Place).geometry!.location.lat(),
            lng: (validPlaces[0] as Place).geometry!.location.lng(),
          }
        : {
            lat: (validPlaces[0] as ActivityLocation).lat!,
            lng: (validPlaces[0] as ActivityLocation).lng!,
          },
    })

    validPlaces.forEach((place) => {
      const position = isActivityMap
        ? { lat: (place as ActivityLocation).lat!, lng: (place as ActivityLocation).lng! }
        : {
            lat: (place as Place).geometry!.location.lat(),
            lng: (place as Place).geometry!.location.lng(),
          }
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        title: place.name,
        icon: selectedPlace && place.name === selectedPlace.name 
          ? {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            }
          : undefined
      })
      markersRef.current.push(marker)
      bounds.extend(position)
    })

    if (selectedPlace) {
      const position = isActivityMap
        ? { lat: (selectedPlace as ActivityLocation).lat!, lng: (selectedPlace as ActivityLocation).lng! }
        : {
            lat: (selectedPlace as Place).geometry!.location.lat(),
            lng: (selectedPlace as Place).geometry!.location.lng(),
          }
      mapInstanceRef.current?.setCenter(position)
      mapInstanceRef.current?.setZoom(15)
    } else {
      mapInstanceRef.current?.fitBounds(bounds)
      if (validPlaces.length === 1) {
        mapInstanceRef.current?.setZoom(15)
      }
    }
  }

  const handlePlaceClick = (
    place: Place | ActivityLocation,
    mapRef: React.RefObject<HTMLDivElement>,
    places: Place[] | ActivityLocation[],
    isActivityMap: boolean = false
  ) => {
    setShowMap(true)
    setTimeout(() => {
      initializeMap(mapRef.current, places, isActivityMap, place)
    }, 0)
  }

  useEffect(() => {
    if (showMap && hotelMapRef.current && hotels.length > 0) {
      initializeMap(hotelMapRef.current, hotels)
    }
  }, [hotels, showMap])

  useEffect(() => {
    if (showMap && restaurantMapRef.current && restaurants.length > 0) {
      initializeMap(restaurantMapRef.current, restaurants)
    }
  }, [restaurants, showMap])

  useEffect(() => {
    if (showMap && itineraryMapRef.current && activityLocations.length > 0) {
      initializeMap(itineraryMapRef.current, activityLocations, true)
    }
  }, [activityLocations, showMap])

  if (!tripData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No trip data available. Please check the data structure and try again.
        </AlertDescription>
      </Alert>
    )
  }

  const firstName =
    userData?.name?.split(" ")[0] || userDataFromForm?.name?.split(" ")[0] || "Traveler"

  const createGoogleMapsUrl = (query: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }

  const toggleDay = (dayNumber: number) => {
    setExpandedDay((prevDay) => (prevDay === dayNumber ? null : dayNumber))
  }

  const getValidImageSrc = (url?: string): string => {
    if (url && url !== "N/A" && (url.startsWith("http") || url.startsWith("/"))) {
      return url
    }
    return "/placeholder.jpg"
  }

  const renderPriceLevel = (priceLevel?: number) => {
    if (priceLevel === undefined) return "Price not available"
    return "$$$$".substring(0, priceLevel)
  }

  const renderRatingStars = (rating?: number) => {
    if (!rating) return null
    const fullStars = Math.floor(rating)
    const halfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)
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
    )
  }

  const TripOverview = () => (
    <Card className="mb-8 overflow-hidden border-none shadow-lg">
      <div className="relative h-64 w-full">
        <Image
          src={getValidImageSrc(placePhotoUrl || tripData.tripOverview.imageUrl)}
          alt={tripData.tripOverview.destination}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
          <div className="p-6 text-white">
            <h2 className="text-3xl font-serif font-bold">
              {tripData.tripOverview.destination}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
              >
                <Sun className="w-3 h-3 mr-1" />
                {tripData.tripOverview.bestTimeToVisit}
              </Badge>
              <Badge
                variant="outline"
                className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
              >
                <DollarSign className="w-3 h-3 mr-1" />
                {tripData.tripOverview.budgetCategory}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="pt-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Destination</p>
              <p className="font-medium">{tripData.tripOverview.destination}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">{tripData.tripOverview.duration} days</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <Sun className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Best Time to Visit</p>
              <p className="font-medium">{tripData.tripOverview.bestTimeToVisit}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Budget Category</p>
              <p className="font-medium">{tripData.tripOverview.budgetCategory}</p>
            </div>
          </div>
        </div>

        {tripData.tripOverview.weatherInfo && (
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                <Umbrella className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-indigo-900 mb-1">Weather Information</h3>
                <p className="text-indigo-700">{tripData.tripOverview.weatherInfo}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Sunrise className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm text-indigo-700">Spring: Mild & Pleasant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm text-indigo-700">Summer: Warm & Rainy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sunset className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm text-indigo-700">Autumn: Clear & Cool</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm text-indigo-700">Winter: Cold & Dry</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const CostBreakdown = () => (
    <Card className="mb-8 border-none shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cost Breakdown
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Estimated expenses for your {tripData.tripOverview.duration}-day trip
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="pt-6 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(tripData.costBreakdown || {}).map(([category, cost]) => (
            <div
              key={category}
              className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-gray-500 capitalize">{category}</p>
              <p className="text-lg font-semibold">${cost}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-indigo-50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-700">Total Estimated Cost</p>
            <p className="text-2xl font-bold text-indigo-900">
              ${tripData.tripOverview.totalEstimatedCost}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-700">Per Person</p>
            <p className="text-lg font-semibold text-indigo-900">
              ${Math.round(tripData.tripOverview.totalEstimatedCost / (formData?.travelers || 1))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TransportationSection = () => (
    <div className="space-y-8">
      <Card className="border-none shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Airport Transfer
            </CardTitle>
            <CardDescription className="text-blue-100">
              Options for getting to and from the airport
            </CardDescription>
          </CardHeader>
        </div>
        <CardContent className="pt-6 bg-white">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { option: "Private Taxi", cost: 30, duration: "30-45 min", image: "/taxi.jpg" },
              { option: "Shuttle Bus", cost: 15, duration: "60-90 min", image: "/shuttle.jpg" },
            ].map((item, index) => (
              <Card key={index} className="border overflow-hidden group hover:shadow-lg transition-all">
                <div className="relative h-48 w-full bg-gray-200">
                  <Image
                    src={item.image}
                    alt={item.option}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-gray-800 hover:bg-white">
                      ${item.cost}
                    </Badge>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-medium text-lg text-gray-900">{item.option}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {index === 0
                      ? "Convenient and direct transportation to your accommodation"
                      : "Budget-friendly option with multiple stops"}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{item.duration}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      asChild
                    >
                      <Link
                        href={createGoogleMapsUrl(
                          `${item.option} ${destination} airport transfer`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        View Map
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="w-5 h-5" />
              Local Transport
            </CardTitle>
            <CardDescription className="text-purple-100">
              Getting around {destination}
            </CardDescription>
          </CardHeader>
        </div>
        <CardContent className="pt-6 bg-white">
          <div className="flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4 scrollbar-hide">
            {transitStations.map((station, index) => (
              <Card
                key={index}
                className="snap-start min-w-[300px] border overflow-hidden group hover:shadow-lg transition-all"
                onClick={() => handlePlaceClick(station, hotelMapRef, transitStations)}
              >
                <div className="relative h-48 w-full bg-gray-200">
                  <Image
                    src={
                      station.photos?.[0]?.getUrl({ maxWidth: 600 }) ||
                      `/transit-${index % 2 === 0 ? "bus" : "train"}.jpg`
                    }
                    alt={station.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-gray-800 hover:bg-white">
                      ${index === 0 ? "1-2" : "2-5"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-medium text-lg text-gray-900">{station.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {station.vicinity || "Transit station in the area"}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Bus className="w-4 h-4" />
                      <span>{station.types?.includes("bus_station") ? "Bus" : "Transit"}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      asChild
                    >
                      <Link
                        href={createGoogleMapsUrl(`${station.name} ${destination}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        View Map
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {routes.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Routes from Kathmandu</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {routes.map((route, index) => (
                  <div key={index} className="flex justify-between text-blue-700">
                    <span>{route.summary} ({route.travelMode.toLowerCase()})</span>
                    <span>{route.distance}, {route.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify_View Mapcenter">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Transportation Tips</h3>
                <p className="text-blue-700">
                  Negotiate taxi fares before starting your journey. Local buses are very affordable
                  but can be crowded during peak hours.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const EssentialInfoSection = () => (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Emergency Contacts
              </CardTitle>
            </CardHeader>
          </div>
          <CardContent className="pt-4 bg-white">
            <div className="space-y-3">
              {Object.entries(tripData.essentialInfo?.emergencyContacts || {}).map(
                ([service, contact]) => (
                  <div key={service} className="flex justify-between py-3 border-b last:border-0">
                    <span className="capitalize font-medium">{service}:</span>
                    <span className="font-mono text-indigo-600">{contact}</span>
                  </div>
                )
              )}
            </div>

            <div className="mt-6 p-4 bg-red-50 rounded-lg">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 mb-1">Save These Numbers</h3>
                  <p className="text-red-700 text-sm">
                    We recommend saving these emergency numbers in your phone before your trip.
                    Keep a physical copy in your wallet or bag as well.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Luggage className="w-5 h-5" />
                Packing List
              </CardTitle>
            </CardHeader>
          </div>
          <CardContent className="pt-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tripData.essentialInfo?.packingList?.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-5 h-5 rounded-full border border-green-500 flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900 mb-1">Packing Tips</h3>
                  <p className="text-green-700 text-sm">
                    Pack layers as temperatures can vary significantly between day and night. Don't
                    forget a reusable water bottle and comfortable walking shoes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <div className="relative h-48 w-full">
          <Image
            src="/placeholder.jpg"
            alt="Local Customs"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 flex items-end">
            <CardHeader className="text-white z-10">
              <CardTitle>Local Customs & Safety</CardTitle>
              <CardDescription className="text-gray-200">
                Important information to respect local culture and stay safe
              </CardDescription>
            </CardHeader>
          </div>
        </div>
        <CardContent className="pt-6 bg-white">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-1 text-indigo-700">
                <Info className="w-4 h-4" /> Local Customs
              </h3>
              <div className="space-y-2">
                {tripData.essentialInfo?.localCustoms?.map((custom, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-lg bg-gray-50"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    </div>
                    <span className="text-gray-700">{custom}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-1 text-indigo-700">
                <ShieldAlert className="w-4 h-4" /> Safety Tips
              </h3>
              <div className="space-y-2">
                {tripData.essentialInfo?.safetyTips?.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-lg bg-gray-50"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    </div>
                    <span className="text-gray-700">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center gap-1 text-indigo-700">
              <BadgeInfo className="w-4 h-4" /> Visa Requirements
            </h3>
            <p className="text-indigo-700">{tripData.essentialInfo?.visaRequirements}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const HotelsTabContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center w-full">
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
          hotels.map((hotel, index) => (
            <Card
              key={hotel.place_id}
              className="snap-start min-w-[300px] overflow-hidden group hover:shadow-xl transition-shadow border-none shadow-md cursor-pointer"
              onClick={() => handlePlaceClick(hotel, hotelMapRef, hotels)}
            >
              <div className="relative h-48 w-full">
                <Image
                  src={
                    hotel.photos?.[0]?.getUrl({ maxWidth: 600 }) ||
                    getValidImageSrc(tripData.hotels?.[index]?.imageUrl)
                  }
                  alt={hotel.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-lg text-sm font-semibold shadow-md">
                  {renderPriceLevel(hotel.price_level)}
                </div>
                <div className="absolute bottom-3 left-3">{renderRatingStars(hotel.rating)}</div>
              </div>

              <CardHeader className="bg-white">
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-indigo-600" />
                  {hotel.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <a
                    href={createGoogleMapsUrl(
                      `${hotel.name} ${hotel.vicinity || hotel.formatted_address}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
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
                  >
                    <a href={`tel:${hotel.formatted_phone_number.replace(/\s+/g, "")}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call {hotel.formatted_phone_number}
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Heart className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      <div className="relative">
        <Button
          onClick={() => setShowMap(!showMap)}
          className="mb-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <Map className="w-4 h-4 mr-2" />
          {showMap ? "Hide Map" : "Show Map"}
        </Button>
        <div
          className={`h-[500px] bg-gray-200 rounded-lg transition-all duration-300 ${
            showMap ? "block" : "hidden"
          }`}
        >
          <div ref={hotelMapRef} className="w-full h-full"></div>
        </div>
      </div>
    </div>
  )

  const RestaurantsTabContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center w-full">
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
              <p className="text-lg font-medium">Loading restaurants...</p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : restaurants.length === 0 ? (
          <Alert>
            <AlertDescription>No restaurants found for {destination}. Please try a different location.</AlertDescription>
          </Alert>
        ) : (
          restaurants.map((restaurant, index) => (
            <Card
              key={restaurant.place_id}
              className="snap-start min-w-[300px] overflow-hidden group hover:shadow-xl transition-shadow border-none shadow-md cursor-pointer"
              onClick={() => handlePlaceClick(restaurant, restaurantMapRef, restaurants)}
            >
              <div className="relative h-48 w-full">
                <Image
                  src={
                    restaurant.photos?.[0]?.getUrl({ maxWidth: 600 }) ||
                    getValidImageSrc(tripData.restaurants?.[index]?.imageUrl)
                  }
                  alt={restaurant.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-lg text-sm font-semibold shadow-md">
                  {renderPriceLevel(restaurant.price_level)}
                </div>
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-indigo-600 hover:bg-indigo-700">
                    {restaurant.types?.includes("restaurant")
                      ? restaurant.types[0].replace(/_/g, " ")
                      : "Local"}
                    Cuisine
                  </Badge>
                </div>
              </div>

              <CardHeader className="bg-white">
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-indigo-600" />
                  {restaurant.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <a
                    href={createGoogleMapsUrl(
                      `${restaurant.name} ${restaurant.vicinity || restaurant.formatted_address}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {restaurant.vicinity || restaurant.formatted_address || "Address not available"}
                  </a>
                </CardDescription>
              </CardHeader>

              <CardContent className="bg-white pt-0">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Must Try:</p>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.types?.slice(0, 3).map((type, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg_gray-50 text-gray-700 border-gray-200"
                        >
                          {type.replace(/_/g, " ")}
                        </Badge>
                      )) || <span className="text-gray-500">N/A</span>}
                    </div>
                  </div>
                  {restaurant.opening_hours && (
                    <p className="text-sm text-gray-600">
                      {restaurant.opening_hours.isOpen() ? "Open Now" : "Closed"}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="bg-white pt-0 flex gap-2 flex-wrap">
                {restaurant.website && (
                  <Button
                    variant="default"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    asChild
                  >
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
                {restaurant.formatted_phone_number && (
                  <Button
                    variant="outline"
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    asChild
                  >
                    <a href={`tel:${restaurant.formatted_phone_number.replace(/\s+/g, "")}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call {restaurant.formatted_phone_number}
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      <div className="relative">
        <Button
          onClick={() => setShowMap(!showMap)}
          className="mb-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <Map className="w-4 h-4 mr-2" />
          {showMap ? "Hide Map" : "Show Map"}
        </Button>
        <div
          className={`h-[500px] bg-gray-200 rounded-lg transition-all duration-300 ${
            showMap ? "block" : "hidden"
          }`}
        >
          <div ref={restaurantMapRef} className="w-full h-full"></div>
        </div>
      </div>
    </div>
  )

  const ItineraryTabContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        {tripData.dailyItinerary?.map((day) => (
          <Card key={day.day} className="border-none shadow-md overflow-hidden">
            <div
              className="relative h-24 w-full cursor-pointer"
              onClick={() => toggleDay(day.day)}
            >
              <Image
                src="/placeholder.jpg"
                alt={`Day ${day.day}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                <CardHeader className="text-white z-10 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Day {day.day} - {day.date}
                    </CardTitle>
                    {expandedDay === day.day ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </CardHeader>
              </div>
            </div>

            {(expandedDay === day.day || day.day === 1) && (
              <CardContent className="pt-6 bg-white">
                <div className="space-y-6">
                  {day.activities?.map((activity, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors group cursor-pointer"
                      onClick={() => handlePlaceClick(
                        { name: activity.activity, location: activity.location, lat: activityLocations[day.day - 1]?.lat, lng: activityLocations[day.day - 1]?.lng },
                        itineraryMapRef,
                        activityLocations,
                        true
                      )}
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={getValidImageSrc(
                            activityPhotos[`${day.day - 1}-${index}`] || activity.imageUrl
                          )}
                          alt={activity.activity}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                            {activity.activity}
                          </p>
                          <span className="text-sm text-gray-500">{activity.duration}</span>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Clock className="w-4 h-4" />
                          {activity.time}
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          <a
                            href={createGoogleMapsUrl(
                              `${activity.activity} ${activity.location}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            {activity.location}
                          </a>
                        </div>

                        <div className="mt-2 text-sm flex justify-between items-center">
                          <span className="text-gray-500">Cost: ${activity.cost || "N/A"}</span>
                          {activity.notes && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0"
                            >
                              <Info className="w-3 h-3 mr-1" />
                              View Notes
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {day.day === 1 && (
                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-indigo-900 mb-1">Daily Itinerary Tips</h3>
                        <p className="text-indigo-700">
                          Click on each day to expand and see the detailed activities. All times are
                          approximate and can be adjusted based on your preferences.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
      <div className="relative">
        <Button
          onClick={() => setShowMap(!showMap)}
          className="mb-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <Map className="w-4 h-4 mr-2" />
          {showMap ? "Hide Map" : "Show Map"}
        </Button>
        <div
          className={`h-[500px] bg-gray-200 rounded-lg transition-all duration-300 ${
            showMap ? "block" : "hidden"
          }`}
        >
          <div ref={itineraryMapRef} className="w-full h-full"></div>
        </div>
      </div>
    </div>
  )

  const UserPreferencesSection = () => (
    <Card className="mb-8 border-none shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-green-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Travel Preferences
          </CardTitle>
          <CardDescription className="text-teal-100">
            How we customized this trip for you
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="pt-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formData?.dateFlexibility && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date Flexibility</p>
                <p className="font-medium">{formData.dateFlexibility}</p>
              </div>
            </div>
          )}

          {formData?.preferredSeason && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Sun className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Preferred Season</p>
                <p className="font-medium">{formData.preferredSeason}</p>
              </div>
            </div>
          )}

          {formData?.budgetIncludes && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget Includes</p>
                <p className="font-medium">{formData.budgetIncludes}</p>
              </div>
            </div>
          )}

          {formData?.splurgeCategories && formData.splurgeCategories.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Splurge Categories</p>
                <p className="font-medium">{formData.splurgeCategories.join(", ")}</p>
              </div>
            </div>
          )}

          {formData?.accommodationType && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Hotel className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Accommodation Type</p>
                <p className="font-medium">{formData.accommodationType}</p>
              </div>
            </div>
          )}

          {formData?.locationPreference && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Location Preference</p>
                <p className="font-medium">{formData.locationPreference}</p>
              </div>
            </div>
          )}

          {formData?.transportationTypes && formData.transportationTypes.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Bus className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transportation Types</p>
                <p className="font-medium">{formData.transportationTypes.join(", ")}</p>
              </div>
            </div>
          )}

          {formData?.activityIntensity && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Activity Intensity</p>
                <p className="font-medium">{formData.activityIntensity}</p>
              </div>
            </div>
          )}
        </div>

        {(formData?.mustSeeAttractions ||
          (formData?.cuisineTypes && formData.cuisineTypes.length > 0) ||
          (formData?.diningStyles && formData.diningStyles.length > 0) ||
          (formData?.dietaryRestrictions && formData.dietaryRestrictions.length > 0) ||
          formData?.structuredVsFreeTime ||
          formData?.morningVsEveningPerson ||
          formData?.specialRequirements) && (
          <div className="mt-6 p-4 bg-teal-50 rounded-lg">
            <h3 className="font-medium text-teal-900 mb-3">Additional Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData?.mustSeeAttractions && (
                <div>
                  <p className="text-sm text-teal-700 font-medium">Must-See Attractions</p>
                  <p className="text-sm text-teal-600">{formData.mustSeeAttractions}</p>
                </div>
              )}

              {formData?.cuisineTypes && formData.cuisineTypes.length > 0 && (
                <div>
                  <p className="text-sm text-teal-700 font-medium">Cuisine Types</p>
                  <p className="text-sm text-teal-600">{formData.cuisineTypes.join(", ")}</p>
                </div>
              )}

              {formData?.diningStyles && formData.diningStyles.length > 0 && (
                <div>
                  <p className="text-sm text-teal-700 font-medium">Dining Styles</p>
                  <p className="text-sm text-teal-600">{formData.diningStyles.join(", ")}</p>
                </div>
              )}

              {formData?.dietaryRestrictions && formData.dietaryRestrictions.length > 0 && (
                <div>
                  <p className="text-sm text-teal-700 font-medium">Dietary Restrictions</p>
                  <p className="text-sm text-teal-600">{formData.dietaryRestrictions.join(", ")}</p>
                </div>
              )}

              {formData?.structuredVsFreeTime && (
                <div>
                  <p className="text-sm text-teal-700 font-medium">Structured vs Free Time</p>
                  <p className="text-sm text-teal-600">{formData.structuredVsFreeTime}</p>
                </div>
              )}

              {formData?.morningVsEveningPerson && (
                <div>
                  <p className="text-sm text-teal-700 font-medium">Morning vs Evening Person</p>
                  <p className="text-sm text-teal-600">{formData.morningVsEveningPerson}</p>
                </div>
              )}

              {formData?.specialRequirements && (
                <div className="md:col-span-2">
                  <p className="text-sm text-teal-700 font-medium">Special Requirements</p>
                  <p className="text-sm text-teal-600">{formData.specialRequirements}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-7xl mx-auto p-4">
      <TripOverview />
      <CostBreakdown />
      {formData && <UserPreferencesSection />}
      <Tabs defaultValue="itinerary" className="mb-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-white shadow-lg rounded-lg overflow-hidden border-none">
          <TabsTrigger
            value="itinerary"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white py-3"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Itinerary
          </TabsTrigger>
          <TabsTrigger
            value="hotels"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white py-3"
          >
            <Hotel className="w-4 h-4 mr-2" />
            Hotels
          </TabsTrigger>
          <TabsTrigger
            value="restaurants"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white py-3"
          >
            <Utensils className="w-4 h-4 mr-2" />
            Dining
          </TabsTrigger>
          <TabsTrigger
            value="transport"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white py-3"
          >
            <Bus className="w-4 h-4 mr-2" />
            Transport
          </TabsTrigger>
          <TabsTrigger
            value="essentials"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white py-3"
          >
            <Luggage className="w-4 h-4 mr-2" />
            Essentials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itinerary" className="mt-6">
          <ItineraryTabContent />
        </TabsContent>
        <TabsContent value="hotels" className="mt-6">
          <HotelsTabContent />
        </TabsContent>
        <TabsContent value="restaurants" className="mt-6">
          <RestaurantsTabContent />
        </TabsContent>
        <TabsContent value="transport" className="mt-6">
          <TransportationSection />
        </TabsContent>
        <TabsContent value="essentials" className="mt-6">
          <EssentialInfoSection />
        </TabsContent>
      </Tabs>

      <div className="flex justify-center mt-12 mb-6">
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Download className="w-4 h-4" />
          Download Trip Plan
        </Button>
      </div>
    </div>
  )
}

export default TripDetailViewer