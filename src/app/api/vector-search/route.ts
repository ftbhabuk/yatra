// src/app/api/vector-search/route.ts
import { loadDestinationsFromDrive } from "@/lib/csv-loader";
import { getDestinationVectors, findSimilarDestinations } from "@/lib/vector-processing";

export async function POST(req: Request) {
  try {
    const { query, limit = 5 } = await req.json();
    
    if (!query || typeof query !== "string") {
      return Response.json(
        { success: false, error: "Query parameter is required and must be a string" },
        { status: 400 }
      );
    }
    
    const destinations = await loadDestinationsFromDrive();
    const vectorData = await getDestinationVectors(destinations);
    const results = findSimilarDestinations(query, vectorData, limit);
    
    return Response.json({
      success: true,
      query,
      results: results.map(item => ({
        name: item.destination.pName,
        district: item.destination.district,
        province: item.destination.province,
        similarity: (item.similarity * 100).toFixed(2) + "%",
        tags: item.destination.tags,
        things_to_do: item.destination.things_to_do,
      }))
    });
  } catch (error) {
    console.error("Error in vector search:", error);
    return Response.json(
      { success: false, error: "Failed to perform vector search" },
      { status: 500 }
    );
  }
}