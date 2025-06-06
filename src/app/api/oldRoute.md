// // src/app/api/route.ts
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { loadDestinationsFromDrive, NepalDestination } from "@/lib/csv-loader";
// import { getDestinationVectors, findSimilarDestinations } from "@/lib/vector-processing";
// import axios from "axios";

// const generationConfig = {
//   temperature: 0.7,
//   topP: 0.95,
//   topK: 40,
//   maxOutputTokens: 8192,
//   responseMimeType: "application/json",
// };

// // Fetch Google Maps data including hotels, restaurants, attractions, and images
// async function fetchMapsData(destination: string) {
//   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
//   const mapsData = { hotels: [], restaurants: [], attractions: [], coordinates: null };

//   try {
//     if (!apiKey) throw new Error("Google Maps API key is missing");

//     // Step 1: Search for the destination to get place ID and coordinates
//     const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(destination)}&key=${apiKey}`;
//     const searchResponse = await axios.get(searchUrl);
//     const result = searchResponse.data.results[0];
//     if (!result || !result.place_id) {
//       console.warn("No place ID found for destination:", destination);
//       return mapsData;
//     }

//     const placeId = result.place_id;
//     const location = result.geometry.location;
//     mapsData.coordinates = `${location.lat},${location.lng}`;

//     // Step 2: Fetch nearby hotels, restaurants, and attractions
//     const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&key=${apiKey}`;

//     // Hotels
//     const hotelsResponse = await axios.get(`${nearbyUrl}&type=lodging`);
//     mapsData.hotels = hotelsResponse.data.results.slice(0, 5).map((place: any) => ({
//       name: place.name,
//       rating: place.rating || "N/A",
//       vicinity: place.vicinity,
//       photo: place.photos?.[0]?.photo_reference
//         ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
//         : null,
//     }));

//     // Restaurants
//     const restaurantsResponse = await axios.get(`${nearbyUrl}&type=restaurant`);
//     mapsData.restaurants = restaurantsResponse.data.results.slice(0, 5).map((place: any) => ({
//       name: place.name,
//       rating: place.rating || "N/A",
//       vicinity: place.vicinity,
//       photo: place.photos?.[0]?.photo_reference
//         ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
//         : null,
//     }));

//     // Attractions
//     const attractionsResponse = await axios.get(`${nearbyUrl}&type=tourist_attraction`);
//     mapsData.attractions = attractionsResponse.data.results.slice(0, 5).map((place: any) => ({
//       name: place.name,
//       rating: place.rating || "N/A",
//       vicinity: place.vicinity,
//       photo: place.photos?.[0]?.photo_reference
//         ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
//         : null,
//     }));

//     return mapsData;
//   } catch (error) {
//     console.error("Error fetching Google Maps data:", error);
//     return mapsData; // Return partial or empty data on failure
//   }
// }

// // Enhanced destination finding function using vector search
// async function findNepalDestinations(input: string, destinations: NepalDestination[]) {
//   if (!input) return null;

//   const normalizedInput = input.toLowerCase();
//   for (const dest of destinations) {
//     if (normalizedInput.includes(dest.pName.toLowerCase())) {
//       return { name: dest.pName, type: "main destination", data: dest, similarDestinations: [] };
//     }
//   }

//   const vectorData = await getDestinationVectors(destinations);
//   const similarDestinations = findSimilarDestinations(input, vectorData, 3);

//   if (similarDestinations.length > 0 && similarDestinations[0].similarity > 0.3) {
//     const mainMatch = similarDestinations[0].destination;
//     const otherSimilar = similarDestinations.slice(1);
//     return {
//       name: mainMatch.pName,
//       type: "vector matched",
//       similarity: similarDestinations[0].similarity,
//       data: mainMatch,
//       similarDestinations: otherSimilar.map((item) => ({
//         name: item.destination.pName,
//         similarity: item.similarity,
//         data: item.destination,
//       })),
//     };
//   }

//   return null;
// }

// export async function POST(req: Request) {
//   try {
//     const {
//       destination,
//       duration,
//       budget,
//       travelCompanion,
//       selectedActivities = [],
//       specialRequirements = "",
//       startDate,
//       endDate,
//       dateFlexibility,
//       preferredSeason,
//       currency,
//       budgetIncludes,
//       splurgeCategories = [],
//       accommodationType,
//       locationPreference,
//       transportationTypes = [],
//       activityIntensity,
//       mustSeeAttractions,
//       cuisineTypes = [],
//       diningStyles = [],
//       dietaryRestrictions = [],
//       structuredVsFreeTime,
//       morningVsEveningPerson,
//       user: userData,
//     } = await req.json();

//     console.log("User Data received in /api:", userData);

//     let userDestination = "";
//     if (destination && typeof destination === "object" && "label" in destination) {
//       userDestination = destination.label as string;
//     } else if (typeof destination === "string") {
//       userDestination = destination;
//     } else {
//       throw new Error("Invalid or missing destination");
//     }

//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//     // model = "gemini-2.5-pro-preview-03-25"
//     const chatSession = model.startChat({ generationConfig });

//     const destinations = await loadDestinationsFromDrive();
//     const destinationMatch = await findNepalDestinations(userDestination, destinations);
//     const mapsData = await fetchMapsData(userDestination); // Fetch Maps data with images

//     const isNepalDestination =
//       destinationMatch !== null || userDestination.toLowerCase().includes("nepal");

//     const activitiesString = Array.isArray(selectedActivities)
//       ? selectedActivities.join(", ")
//       : "";

//     let userPrompt = `
//       Act as a professional travel planner specializing in Nepal.

//       CRITICAL INSTRUCTION: You MUST create a trip plan for EXACTLY this
//       destination: "${userDestination}". Do NOT substitute it or change it.

//       Trip Details:
//       - Destination: ${userDestination}
//       - Duration: ${duration} days
//       - Budget: ${budget}
//       - Travel Group: ${travelCompanion}
//       - Activities of Interest: ${activitiesString}
//       - Special Requirements: ${specialRequirements}
//       - Start Date: ${startDate}
//       - End Date: ${endDate}
//       - Date Flexibility: ${dateFlexibility}
//       - Preferred Season: ${preferredSeason}
//       - Currency: ${currency}
//       - Budget Includes: ${budgetIncludes}
//       - Splurge Categories: ${splurgeCategories.join(", ")}
//       - Accommodation Type: ${accommodationType}
//       - Location Preference: ${locationPreference}
//       - Transportation Types: ${transportationTypes.join(", ")}
//       - Activity Intensity: ${activityIntensity}
//       - Must See Attractions: ${mustSeeAttractions}
//       - Cuisine Types: ${cuisineTypes.join(", ")}
//       - Dining Styles: ${diningStyles.join(", ")}
//       - Dietary Restrictions: ${dietaryRestrictions.join(", ")}
//       - Structured vs Free Time: ${structuredVsFreeTime}
//       - Morning vs Evening Person: ${morningVsEveningPerson}
//     `;

//     if (destinationMatch && destinationMatch.data) {
//       const destData = destinationMatch.data;
//       userPrompt += `
//         MATCHED DESTINATION DETAILS:
//         - Name: ${destData.pName}
//         - District: ${destData.district}
//         - Province: ${destData.province}
//         - Ratings (0-5): Culture: ${destData.culture}, Adventure: ${destData.adventure}, Wildlife: ${destData.wildlife}, Sightseeing: ${destData.sightseeing}, History: ${destData.history}
//         - Tags: ${destData.tags.join(", ")}
//         - Nearby Landmark: ${destData.nearby_landmark}
//         - Best Time to Visit: ${destData.best_time_to_visit}
//         - Things to Do: ${(destData.things_to_do || []).join(", ") || "Not specified"}
//         - Travel Tips: ${(destData.travel_tips || []).join(", ") || "Not specified"}
//       `;
//     }

//     // Add Google Maps Data with images
//     userPrompt += `
//       GOOGLE MAPS DATA:
//       - Coordinates: ${mapsData.coordinates || "Not available"}
//       - Hotels: ${mapsData.hotels
//         .map(
//           (h) =>
//             `${h.name}: Rating ${h.rating}, Location ${h.vicinity}, Image ${
//               h.photo || "None"
//             }`
//         )
//         .join(" | ") || "None found"}
//       - Restaurants: ${mapsData.restaurants
//         .map(
//           (r) =>
//             `${r.name}: Rating ${r.rating}, Location ${r.vicinity}, Image ${
//               r.photo || "None"
//             }`
//         )
//         .join(" | ") || "None found"}
//       - Attractions: ${mapsData.attractions
//         .map(
//           (a) =>
//             `${a.name}: Rating ${a.rating}, Location ${a.vicinity}, Image ${
//               a.photo || "None"
//             }`
//         )
//         .join(" | ") || "None found"}

//       Use this Maps data to:
//       - Select specific hotels and restaurants for the itinerary, including their ratings and locations.
//       - Include attractions in daily activities where they match user preferences.
//       - Include image URLs in the JSON output where available for hotels, restaurants, and attractions.
//     `;

//     if (isNepalDestination) {
//       const nearbyPlaces = destinationMatch
//         ? destinations
//             .filter(
//               (d) =>
//                 (d.province === destinationMatch.data.province ||
//                   d.district === destinationMatch.data.district) &&
//                 d.pName !== destinationMatch.data.pName
//             )
//             .slice(0, 2)
//         : [];
//       userPrompt += `
//         NEPAL DATA:
//         - Nearby Places: ${nearbyPlaces.length ? nearbyPlaces.map(p => p.pName).join(", ") : "None identified"}
//         - Emergency Info: Police: 100, Ambulance: 102, Tourist Police (Kathmandu): +977 1 4226359
//         - Cultural Notes: Remove shoes at temples, Dress modestly, Use right hand
//         - Safety Tips: Drink bottled water, Carry flashlight, Watch altitude
//       `;
//     } else {
//       userPrompt += `
//         If "${userDestination}" isn't in the data:
//         - Provide a general overview based on your knowledge.
//         - Suggest transport from Kathmandu or Pokhara.
//         - Avoid inventing unverifiable details.
//       `;
//     }

//     userPrompt += `
//       Provide a travel plan in valid JSON format:
//       {
//         "tripOverview": {
//           "destination": "${userDestination}",
//           "duration": ${duration},
//           "bestTimeToVisit": string,
//           "weatherInfo": string,
//           "budgetCategory": string,
//           "totalEstimatedCost": number,
//           "coordinates": string
//         },
//         "hotels": [
//           {
//             "name": string,
//             "location": string,
//             "pricePerNight": number,
//             "rating": number,
//             "amenities": string[],
//             "bookingUrl": string,
//             "notes": string,
//             "imageUrl": string
//           }
//         ],
//         "dailyItinerary": [
//           {
//             "day": number,
//             "date": string,
//             "activities": [
//               {
//                 "time": string,
//                 "activity": string,
//                 "location": string,
//                 "duration": string,
//                 "cost": number,
//                 "notes": string,
//                 "imageUrl": string
//               }
//             ]
//           }
//         ],
//         "restaurants": [
//           {
//             "name": string,
//             "cuisine": string,
//             "location": string,
//             "priceRange": string,
//             "mustTryDishes": string[],
//             "rating": number,
//             "imageUrl": string
//           }
//         ],
//         "transportation": {
//           "fromAirport": {
//             "options": string[],
//             "estimatedCosts": number[]
//           },
//           "localTransport": {
//             "options": string[],
//             "estimatedCosts": number[]
//           }
//         },
//         "costBreakdown": {
//           "accommodation": number,
//           "activities": number,
//           "transportation": number,
//           "food": number,
//           "miscellaneous": number
//         },
//         "essentialInfo": {
//           "emergencyContacts": {
//             "police": string,
//             "ambulance": string,
//             "nearestHospital": string
//           },
//           "localCustoms": string[],
//           "packingList": string[],
//           "visaRequirements": string,
//           "safetyTips": string[]
//         }
//       }

//       Guidelines:
//       1. Use MATCHED DESTINATION DETAILS for core trip structure (things to do, tips).
//       2. Use GOOGLE MAPS DATA for specific hotels, restaurants, and attractions, including their image URLs.
//       3. Prices in USD, estimate if not provided (e.g., $20-50/night for hotels based on rating).
//       4. At least 2 hotels, realistic prices/ratings from Maps data.
//       5. Detailed daily itinerary blending Things to Do and Maps attractions.
//       6. Include imageUrl fields where available from Maps data.
//       7. Return ONLY the JSON object, no extra text.
//     `;

//     const result = await chatSession.sendMessage(userPrompt);
//     const responseText = result.response.text();

//     console.log("Raw Gemini Response:", responseText);

//     let fixedResponseText = responseText;
//     try {
//       fixedResponseText = responseText.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
//     } catch (fixError) {
//       console.warn("Error trying to fix JSON:", fixError);
//     }

//     try {
//       const tripPlan = JSON.parse(fixedResponseText);
//       if (tripPlan.tripOverview && tripPlan.tripOverview.destination !== userDestination) {
//         console.log(
//           `Correcting destination from "${tripPlan.tripOverview.destination}" to "${userDestination}"`
//         );
//         tripPlan.tripOverview.destination = userDestination;
//       }
//       if (!tripPlan.tripOverview || !tripPlan.hotels || !tripPlan.dailyItinerary) {
//         throw new Error("Invalid response structure");
//       }
//       return Response.json({ success: true, data: tripPlan });
//     } catch (parseError) {
//       console.error("Error parsing JSON:", parseError);
//       console.error("Response Text:", responseText);
//       return Response.json(
//         { success: false, error: "Failed to parse JSON response from the model." },
//         { status: 500 }
//       );
//     }
//   } catch (error) {
//     console.error("Error generating trip plan:", error);
//     return Response.json(
//       { success: false, error: "Failed to generate trip plan. Please try again." },
//       { status: 500 }
//     );
//   }
// }