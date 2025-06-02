"use client"

import React, { useEffect, useRef, useState } from "react"

const GoogleMap = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [placeData, setPlaceData] = useState<any>(null)
  const [detailedData, setDetailedData] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [attractions, setAttractions] = useState<any[]>([])
  const [transitStations, setTransitStations] = useState<any[]>([])
  const [accommodations, setAccommodations] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [entertainmentOptions, setEntertainmentOptions] = useState<any[]>([])
  const [shoppingOptions, setShoppingOptions] = useState<any[]>([])
  const [essentialServices, setEssentialServices] = useState<any[]>([])
  const [outdoorActivities, setOutdoorActivities] = useState<any[]>([])
  const [culturalSites, setCulturalSites] = useState<any[]>([])
  const [tourOperators, setTourOperators] = useState<any[]>([])
  const [airports, setAirports] = useState<any[]>([])
  const [localTours, setLocalTours] = useState<any[]>([])
  const [localEvents, setLocalEvents] = useState<any[]>([])
  const [weatherData, setWeatherData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("overview")

  useEffect(() => {
    const initMap = () => {
      if (window.google && window.google.maps) {
        initializeMap()
      } else {
        loadGoogleMapsScript()
      }
    }

    const loadGoogleMapsScript = () => {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      script.onerror = () => {
        console.error("Google Maps API script failed to load")
        setError("Failed to load Google Maps. Please check your connection and try again.")
        setIsLoading(false)
      }
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      if (!mapRef.current) return

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        mapTypeId: "roadmap",
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      })

      const service = new window.google.maps.places.PlacesService(map)
      const directionsService = new window.google.maps.DirectionsService()

      const pokharaRequest = {
        query: "Pokhara, Nepal",
        fields: ["ALL"],
      }

      setIsLoading(true)
      service.textSearch(pokharaRequest, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const pokhara = results[0]
          setPlaceData(pokhara)

          const location = pokhara.geometry?.location
          if (location) {
            map.setCenter(location)
            new window.google.maps.Marker({
              position: location,
              map,
              title: "Pokhara",
              animation: window.google.maps.Animation.DROP,
              icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              },
            })

            fetchAllData(service, directionsService, pokhara.place_id, location, map)
          }
        } else {
          console.error("Pokhara search failed:", status)
          setError("Failed to find information about Pokhara. Please try a different location.")
          setIsLoading(false)
        }
      })
    }

    const fetchAllData = (
      service: google.maps.places.PlacesService,
      directionsService: google.maps.DirectionsService,
      placeId: string,
      location: google.maps.LatLng,
      map: google.maps.Map
    ) => {
      // Track all API requests
      let pendingRequests = 14
      const markRequestComplete = () => {
        pendingRequests--
        if (pendingRequests <= 0) {
          setIsLoading(false)
        }
      }

      // Fetch detailed place data
      service.getDetails(
        {
          placeId,
          fields: [
            "address_components",
            "adr_address",
            "business_status",
            "formatted_address",
            "geometry",
            "icon",
            "name",
            "opening_hours",
            "photos",
            "place_id",
            "plus_code",
            "rating",
            "user_ratings_total",
            "types",
            "url",
            "website",
            "formatted_phone_number",
            "international_phone_number",
            "reviews",
            "editorial_summary",
            "utc_offset_minutes",
          ],
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            setDetailedData(place)
          }
          markRequestComplete()
        }
      )

      // Fetch tourist attractions
      service.nearbySearch(
        { location, radius: 10000, type: "tourist_attraction" },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const topAttractions = results.slice(0, 15)
            setAttractions(topAttractions)
            
            // Add markers for attractions
            topAttractions.forEach((attraction) => {
              if (attraction.geometry && attraction.geometry.location) {
                new window.google.maps.Marker({
                  position: attraction.geometry.location,
                  map,
                  title: attraction.name,
                  icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  },
                })
              }
            })
          }
          markRequestComplete()
        }
      )

      // Fetch transit stations
      service.nearbySearch(
        { location, radius: 10000, type: "transit_station" },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setTransitStations(results.slice(0, 10))
          }
          markRequestComplete()
        }
      )

      // Fetch routes from Kathmandu
      directionsService.route(
        {
          origin: "Kathmandu, Nepal",
          destination: "Pokhara, Nepal",
          travelMode: window.google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            setRoutes(result.routes)
            
            // Display the first route on the map
            const directionsRenderer = new window.google.maps.DirectionsRenderer({
              map,
              directions: result,
              suppressMarkers: true,
            })
          }
          markRequestComplete()
        }
      )

      // Fetch accommodations
      service.nearbySearch(
        { location, radius: 5000, type: "lodging" },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setAccommodations(results.slice(0, 15))
          }
          markRequestComplete()
        }
      )

      // Fetch restaurants
      service.nearbySearch(
        { location, radius: 5000, type: "restaurant" },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setRestaurants(results.slice(0, 15))
          }
          markRequestComplete()
        }
      )

      // Fetch entertainment options
      const entertainmentTypes = ["bar", "night_club", "movie_theater", "casino"]
      let completedEntertainmentRequests = 0
      let allEntertainment: any[] = []
      
      entertainmentTypes.forEach(type => {
        service.nearbySearch(
          { location, radius: 5000, type },
          (results, status) => {
            completedEntertainmentRequests++
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              allEntertainment = [...allEntertainment, ...results]
            }
            
            if (completedEntertainmentRequests === entertainmentTypes.length) {
              // Remove duplicates by place_id
              const uniqueEntertainment = Array.from(
                new Map(allEntertainment.map(item => [item.place_id, item])).values()
              )
              setEntertainmentOptions(uniqueEntertainment.slice(0, 10))
              markRequestComplete()
            }
          }
        )
      })

      // Fetch shopping options
      const shoppingTypes = ["shopping_mall", "store", "department_store", "market"]
      let completedShoppingRequests = 0
      let allShopping: any[] = []
      
      shoppingTypes.forEach(type => {
        service.nearbySearch(
          { location, radius: 5000, type },
          (results, status) => {
            completedShoppingRequests++
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              allShopping = [...allShopping, ...results]
            }
            
            if (completedShoppingRequests === shoppingTypes.length) {
              // Remove duplicates by place_id
              const uniqueShopping = Array.from(
                new Map(allShopping.map(item => [item.place_id, item])).values()
              )
              setShoppingOptions(uniqueShopping.slice(0, 10))
              markRequestComplete()
            }
          }
        )
      })

      // Fetch essential services
      const essentialServiceTypes = ["hospital", "pharmacy", "police", "atm", "bank", "post_office"]
      let completedEssentialRequests = 0
      let allEssentialServices: any[] = []
      
      essentialServiceTypes.forEach(type => {
        service.nearbySearch(
          { location, radius: 5000, type },
          (results, status) => {
            completedEssentialRequests++
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              allEssentialServices = [...allEssentialServices, ...results]
            }
            
            if (completedEssentialRequests === essentialServiceTypes.length) {
              // Remove duplicates by place_id
              const uniqueServices = Array.from(
                new Map(allEssentialServices.map(item => [item.place_id, item])).values()
              )
              setEssentialServices(uniqueServices.slice(0, 10))
              markRequestComplete()
            }
          }
        )
      })

      // Fetch outdoor activities
      const outdoorTypes = ["park", "campground", "natural_feature"]
      let completedOutdoorRequests = 0
      let allOutdoorActivities: any[] = []
      
      outdoorTypes.forEach(type => {
        service.nearbySearch(
          { location, radius: 10000, type },
          (results, status) => {
            completedOutdoorRequests++
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              allOutdoorActivities = [...allOutdoorActivities, ...results]
            }
            
            if (completedOutdoorRequests === outdoorTypes.length) {
              // Remove duplicates by place_id  
              const uniqueActivities = Array.from(
                new Map(allOutdoorActivities.map(item => [item.place_id, item])).values()
              )
              setOutdoorActivities(uniqueActivities.slice(0, 10))
              markRequestComplete()
            }
          }
        )
      })

      // Fetch cultural sites
      const culturalTypes = ["museum", "art_gallery", "place_of_worship", "library"]
      let completedCulturalRequests = 0
      let allCulturalSites: any[] = []
      
      culturalTypes.forEach(type => {
        service.nearbySearch(
          { location, radius: 5000, type },
          (results, status) => {
            completedCulturalRequests++
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              allCulturalSites = [...allCulturalSites, ...results]
            }
            
            if (completedCulturalRequests === culturalTypes.length) {
              // Remove duplicates by place_id
              const uniqueSites = Array.from(
                new Map(allCulturalSites.map(item => [item.place_id, item])).values()
              )
              setCulturalSites(uniqueSites.slice(0, 10))
              markRequestComplete()
            }
          }
        )
      })

      // Fetch tour operators
      service.textSearch(
        { query: "tour operator near Pokhara Nepal", fields: ["place_id", "name", "formatted_address", "rating", "opening_hours", "geometry"] },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setTourOperators(results.slice(0, 10))
          }
          markRequestComplete()
        }
      )

      // Fetch airports
      service.nearbySearch(
        { location, radius: 100000, type: "airport" },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setAirports(results)
          }
          markRequestComplete()
        }
      )

      // Fetch local guided tours
      service.textSearch(
        { query: "guided tours Pokhara", fields: ["place_id", "name", "formatted_address", "rating", "reviews"] },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setLocalTours(results.slice(0, 10))
          }
          markRequestComplete()
        }
      )

      // Fetch local events (could be limited in Maps API)
      service.textSearch(
        { query: "events Pokhara Nepal", fields: ["place_id", "name", "formatted_address", "rating", "opening_hours"] },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setLocalEvents(results.slice(0, 10))
          }
          markRequestComplete()
        }
      )

      // Mock weather data (would use a weather API in production)
      setTimeout(() => {
        setWeatherData({
          current: {
            temp: 22,
            humidity: 65,
            description: "Partly cloudy",
            icon: "04d",
          },
          forecast: [
            { day: "Monday", high: 24, low: 18, description: "Partly cloudy" },
            { day: "Tuesday", high: 25, low: 17, description: "Sunny" },
            { day: "Wednesday", high: 23, low: 16, description: "Light rain" },
            { day: "Thursday", high: 22, low: 15, description: "Scattered clouds" },
            { day: "Friday", high: 24, low: 16, description: "Clear sky" },
          ],
          bestTimeToVisit: "October to April (dry season)",
        })
        markRequestComplete()
      }, 1000)
    }

    initMap()

    return () => {
      const script = document.querySelector(`script[src*="maps.googleapis.com"]`)
      if (script) script.remove()
    }
  }, [])

  const renderPlaceList = (items: any[], title: string) => (
    <div className="mb-6 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h4 className="font-bold text-lg">{item.name}</h4>
            <p className="text-gray-700"><strong>Address:</strong> {item.formatted_address || item.vicinity || "N/A"}</p>
            <p className="text-gray-700">
              <strong>Rating:</strong> {item.rating || "N/A"} {item.user_ratings_total ? `(${item.user_ratings_total} reviews)` : ""}
            </p>
            <p className="text-gray-700"><strong>Types:</strong> {item.types?.slice(0, 3).join(", ") || "N/A"}</p>
            {item.opening_hours && (
              <p className="text-gray-700">
                <strong>Currently:</strong> {item.opening_hours.isOpen() ? "Open" : "Closed"}
              </p>
            )}
            {item.photos && item.photos[0] && (
              <img
                src={item.photos[0].getUrl({ maxWidth: 200, maxHeight: 150 })}
                alt={item.name}
                className="mt-2 rounded-lg w-full h-40 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderDetailedData = (data: any) => {
    if (!data) return null

    // Extract insights from reviews for "best time to visit"
    const reviewInsights = data.reviews?.reduce((acc: string[], review: any) => {
      const text = review.text.toLowerCase()
      if (text.includes("best time") || text.includes("season") || text.includes("weather")) {
        acc.push(review.text)
      }
      return acc
    }, []) || []

    return (
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">About Pokhara</h3>
        {data.editorial_summary && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
            <h4 className="font-semibold text-lg">Overview</h4>
            <p className="text-gray-700">{data.editorial_summary.overview}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h4 className="font-semibold text-lg mb-3">Location Information</h4>
            <p><strong>Name:</strong> {data.name || "N/A"}</p>
            <p><strong>Formatted Address:</strong> {data.formatted_address || "N/A"}</p>
            <p><strong>Place ID:</strong> {data.place_id || "N/A"}</p>
            <p><strong>Rating:</strong> {data.rating || "N/A"} ({data.user_ratings_total || 0} reviews)</p>
            <p><strong>Types:</strong> {data.types?.join(", ") || "N/A"}</p>
            <p><strong>Website:</strong> {data.website ? <a href={data.website} className="text-blue-500 hover:underline">{data.website}</a> : "N/A"}</p>
            <p><strong>Phone:</strong> {data.formatted_phone_number || "N/A"}</p>
            <p><strong>Google Maps URL:</strong> {data.url ? <a href={data.url} className="text-blue-500 hover:underline">View on Google Maps</a> : "N/A"}</p>
            {data.geometry && (
              <p>
                <strong>Coordinates:</strong> {data.geometry.location.lat().toFixed(6)},{" "}
                {data.geometry.location.lng().toFixed(6)}
              </p>
            )}
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            {data.opening_hours && (
              <div className="mb-4">
                <h4 className="font-semibold text-lg mb-2">Opening Hours</h4>
                <ul className="list-disc pl-5">
                  {data.opening_hours.weekday_text?.map((text: string, index: number) => (
                    <li key={index}>{text}</li>
                  )) || <li>N/A</li>}
                </ul>
              </div>
            )}
            {data.address_components && (
              <div>
                <h4 className="font-semibold text-lg mb-2">Address Details</h4>
                <ul className="list-disc pl-5">
                  {data.address_components.map((comp: any, index: number) => (
                    <li key={index}>
                      {comp.long_name} ({comp.types.join(", ")})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        {data.photos && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
            <h4 className="font-semibold text-lg mb-3">Photos</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {data.photos.slice(0, 10).map((photo: any, index: number) => (
                <img
                  key={index}
                  src={photo.getUrl({ maxWidth: 300, maxHeight: 200 })}
                  alt={`Pokhara ${index + 1}`}
                  className="rounded-lg w-full h-40 object-cover transition-transform hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {data.reviews && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
            <h4 className="font-semibold text-lg mb-3">Visitor Reviews</h4>
            <div className="space-y-3">
              {data.reviews.slice(0, 5).map((review: any, index: number) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="font-bold">{review.author_name}</div>
                    <div className="ml-2 flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1">{review.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.text}</p>
                  <p className="text-sm text-gray-500 mt-2">{new Date(review.time * 1000).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {reviewInsights.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
            <h4 className="font-semibold text-lg mb-2">Best Time to Visit (From Reviews)</h4>
            <div className="space-y-2">
              {reviewInsights.map((insight: string, index: number) => (
                <p key={index} className="text-gray-700 border-l-4 border-blue-500 pl-3">{insight}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRoutes = (routes: any[]) => {
    if (!routes.length) return null

    return (
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Routes to Pokhara (from Kathmandu)</h3>
        <div className="space-y-4">
          {routes.map((route, index) => (
            <div key={index} className="p-4 bg-white rounded-lg shadow-sm">
              <h4 className="font-semibold text-lg">Route {index + 1} - {route.summary || "Via Highway"}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-gray-500">Distance</div>
                  <div className="text-xl font-bold">{route.legs[0].distance.text}</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-gray-500">Duration</div>
                  <div className="text-xl font-bold">{route.legs[0].duration.text}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <div className="text-gray-500">Start/End Elevation</div>
                  <div className="text-xl font-bold">1,400m → 800m</div>
                </div>
              </div>
              <div className="mb-3">
                <div className="font-semibold text-lg mb-2">Key Waypoints</div>
                <ul className="list-disc ml-5 space-y-1">
                  {route.legs[0].steps
                    .filter((_: any, i: number, arr: any[]) => i % Math.ceil(arr.length / 5) === 0)
                    .map((step: any, stepIndex: number) => (
                      <li key={stepIndex}>
                        <span dangerouslySetInnerHTML={{ __html: step.instructions }} />
                        <span className="text-gray-500 text-sm"> ({step.distance.text}, {step.duration.text})</span>
                      </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-2">Notes</div>
                <ul className="list-disc ml-5">
                  {/* <li>Tollways: Yes (NPR 30-50)</li>
                  <li>Road condition: Mostly paved, some sections under construction</li>
                  <li>Scenery: Mountains, valleys, rivers</li>
                  <li>Rest stops available every 1-2 hours</li> */}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderWeather = (data: any) => {
    if (!data) return null

    return (
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Weather Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h4 className="font-semibold text-lg mb-3">Current Weather</h4>
            <div className="flex items-center">
              <div className="text-6xl font-bold">{data.current.temp}°C</div>
              <div className="ml-6">
                <div className="text-xl">{data.current.description}</div>
                <div className="text-gray-600">Humidity: {data.current.humidity}%</div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h4 className="font-semibold text-lg mb-3">Best Time to Visit</h4>
            <p className="text-lg">{data.bestTimeToVisit}</p>
            <p className="mt-2 text-gray-700">
              {/* Pokhara has a subtropical climate. The dry season (October-April) offers clear mountain views and pleasant temperatures.
              The wet season (May-September) brings lush landscapes but occasional heavy rainfall. */}
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
          <h4 className="font-semibold text-lg mb-3">5-Day Forecast</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {data.forecast.map((day: any, index: number) => (
              <div key={index} className="p-2 text-center border rounded-lg">
                <div className="font-bold">{day.day}</div>
                <div className="my-2">{day.description}</div>
                <div>
                  <span className="text-red-500">{day.high}°</span> / <span className="text-blue-500">{day.low}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderCategories = () => {
    const categories = [
      { id: "overview", name: "Overview" },
      { id: "attractions", name: "Attractions" },
      { id: "accommodations", name: "Accommodations" },
      { id: "dining", name: "Dining" },
      { id: "transportation", name: "Transportation" },
      { id: "tours", name: "Tours & Activities" },
      { id: "shopping", name: "Shopping" },
      { id: "essentials", name: "Essential Services" },
      { id: "culture", name: "Culture & Heritage" },
      { id: "weather", name: "Weather & Best Time" },
      { id: "routes", name: "Getting There" },
    ]

    return (
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 p-2 min-w-max">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === category.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderCategoryContent = () => {
    switch (selectedCategory) {
      case "overview":
        return renderDetailedData(detailedData)
      case "attractions":
        return renderPlaceList(attractions, "Top Attractions")
      case "accommodations":
        return renderPlaceList(accommodations, "Recommended Accommodations")
      case "dining":
        return renderPlaceList(restaurants, "Popular Restaurants")
      case "transportation":
        return (
          <>
            {renderPlaceList(transitStations, "Transit Stations")}
            {renderPlaceList(airports, "Airports")}
          </>
        )
      case "tours":
        return (
          <>
            {renderPlaceList(localTours, "Local Guided Tours")}
            {renderPlaceList(tourOperators, "Tour Operators")}
            {renderPlaceList(localEvents, "Local Events")}
            {renderPlaceList(outdoorActivities, "Outdoor Activities")}
            {renderPlaceList(entertainmentOptions, "Entertainment Options")}
          </>
        )
      case "shopping":
        return renderPlaceList(shoppingOptions, "Shopping Options")
      case "essentials":
        return renderPlaceList(essentialServices, "Essential Services")
      case "culture":
        return renderPlaceList(culturalSites, "Cultural & Heritage Sites")
      case "weather":
        return renderWeather(weatherData)
      case "routes":
        return renderRoutes(routes)
      default:
        return <div>Select a category to view details.</div>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">Explore Pokhara, Nepal</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div ref={mapRef} className="w-full h-[600px] rounded-lg shadow-md"></div>
          {isLoading && (
            <div className="text-center mt-4">
              <svg className="animate-spin h-5 w-5 mr-3 inline-block" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0                M4 12a8 8 0 018-8V0c-3.309 0-6 2.691-6 6h2a4 4 0 004-4v8a4 4 0 00-4-4H4z"
                ></path>
              </svg>
              Loading...
            </div>
          )}
        </div>

        <div>
          {renderCategories()}
          {renderCategoryContent()}
        </div>
      </div>
    </div>
  )
}

export default GoogleMap
