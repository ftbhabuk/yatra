// src/lib/vector-processing.ts
import { NepalDestination } from "./csv-loader";
import { encode } from "gpt-tokenizer";

// Simple vector representation using token frequency approach
interface DestinationVector {
  destinationId: number;
  destinationName: string;
  vector: number[];
  destination: NepalDestination;
}

// Create a basic vocabulary from all destinations
function createVocabulary(destinations: NepalDestination[]): string[] {
  const vocabulary = new Set<string>();
  
  destinations.forEach(dest => {
    // Add pName tokens
    encode(dest.pName.toLowerCase()).forEach(token => vocabulary.add(token.toString()));
    
    // Add tags
    dest.tags.forEach(tag => {
      encode(tag.toLowerCase()).forEach(token => vocabulary.add(token.toString()));
    });
    
    // Add things_to_do
    dest.things_to_do.forEach(activity => {
      encode(activity.toLowerCase()).forEach(token => vocabulary.add(token.toString()));
    });
    
    // Add travel_tips
    dest.travel_tips.forEach(tip => {
      encode(tip.toLowerCase()).forEach(token => vocabulary.add(token.toString()));
    });
    
    // Add district and nearby landmark
    encode(dest.district.toLowerCase()).forEach(token => vocabulary.add(token.toString()));
    encode(dest.nearby_landmark.toLowerCase()).forEach(token => vocabulary.add(token.toString()));
  });
  
  return Array.from(vocabulary);
}

// Vectorize a single destination
function vectorizeDestination(
  destination: NepalDestination,
  vocabulary: string[]
): DestinationVector {
  // Initialize vector with zeros
  const vector = new Array(vocabulary.length).fill(0);
  
  // Collect all relevant text from the destination
  const textToEncode = [
    destination.pName,
    ...destination.tags,
    ...destination.things_to_do,
    ...destination.travel_tips,
    destination.district,
    destination.nearby_landmark
  ].join(" ").toLowerCase();
  
  // Encode the text and count token frequencies
  const tokens = encode(textToEncode).map(token => token.toString());
  
  // Update vector with token frequencies
  tokens.forEach(token => {
    const index = vocabulary.indexOf(token);
    if (index !== -1) {
      vector[index]++;
    }
  });
  
  return {
    destinationId: destination.pID,
    destinationName: destination.pName,
    vector,
    destination
  };
}

// Vectorize all destinations
export function vectorizeDestinations(destinations: NepalDestination[]): {
  vectors: DestinationVector[];
  vocabulary: string[];
} {
  const vocabulary = createVocabulary(destinations);
  const vectors = destinations.map(dest => vectorizeDestination(dest, vocabulary));
  
  return { vectors, vocabulary };
}

// Calculate similarity between query vector and destination vectors
// Using cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Vectorize a query string using the same vocabulary
function vectorizeQuery(query: string, vocabulary: string[]): number[] {
  const vector = new Array(vocabulary.length).fill(0);
  
  const tokens = encode(query.toLowerCase()).map(token => token.toString());
  
  tokens.forEach(token => {
    const index = vocabulary.indexOf(token);
    if (index !== -1) {
      vector[index]++;
    }
  });
  
  return vector;
}

// Find destinations matching a query using vector similarity
export function findSimilarDestinations(
  query: string,
  vectorData: { vectors: DestinationVector[]; vocabulary: string[] },
  topN: number = 3
): { destination: NepalDestination; similarity: number }[] {
  const { vectors, vocabulary } = vectorData;
  
  // Vectorize the query
  const queryVector = vectorizeQuery(query, vocabulary);
  
  // Calculate similarity for each destination
  const similarities = vectors.map(destVector => ({
    destination: destVector.destination,
    similarity: cosineSimilarity(queryVector, destVector.vector)
  }));
  
  // Sort by similarity (descending) and take top N
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

// Cache for vectors to avoid recalculating
let cachedVectorData: { vectors: DestinationVector[]; vocabulary: string[] } | null = null;

// Get or create vector data
export async function getDestinationVectors(destinations: NepalDestination[]) {
  if (!cachedVectorData) {
    cachedVectorData = vectorizeDestinations(destinations);
  }
  return cachedVectorData;
}