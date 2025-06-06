// app/api/route.ts
import Exa from 'exa-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import axios from 'axios';

// Types
interface ProcessedDocument {
  url: string;
  title: string;
  chunkIndex: number;
  totalChunks: number;
  content: string;
  place: string;
} 

interface ContentResult {
  document: ProcessedDocument;
  embedding: number[];
}

interface Source {
  url: string;
  title: string;
  similarity: number;
}

interface Attraction {
  name: string;
  rating: string;
  vicinity: string;
  photo: string | null;
}

interface GoogleMapsSearchResult {
  results: Array<{
    place_id: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

interface GoogleMapsPlace {
  name: string;
  rating?: number;
  vicinity: string;
  photos?: Array<{
    photo_reference: string;
  }>;
}

interface GoogleMapsNearbyResult {
  results: GoogleMapsPlace[];
}

const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY ?? '',
});

const chunkDocument = (text: string, chunkSize = 800, overlap = 200): string[] => {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.length > 100) chunks.push(chunk);
  }
  return chunks;
};

const cleanText = (text: string): string => {
  return text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\S+@\S+\.\S+/g, '')
    .replace(/[\s\t\r\n]+/g, ' ')
    .replace(/©\s*\d{4}.*?All rights reserved\.|Copyright\s*©?\s*\d{4}.*?\./gi, '')
    .replace(/Skip to (main content|navigation)|Privacy Policy|Terms of Use|Cookie Policy/gi, '')
    .replace(/Follow us on.*?(Facebook|Twitter|Instagram|LinkedIn)|Share this (article|page|post)/gi, '')
    .replace(/Sign (up|in)|Register|Login|Accept\s*cookies?\s*[a-z\s]*settings|cookie\s*policy/gi, '')
    .replace(/We use cookies.*?experience|like us on facebook|follow us on twitter/gi, '')
    .replace(/home|about|contact|menu|search|subscribe to our newsletter|sign to our newsletter|sign up for updates/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[\u0900-\u097F]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return magA === 0 || magB === 0 ? 0 : dotProduct / (magA * magB);
};

const getOrCreateIndex = async (indexName: string, dimension: number) => {
  const indexList = await pineconeClient.listIndexes();
  if (!indexList.indexes?.some((index) => index.name === indexName)) {
    console.log(`Creating Pinecone index: ${indexName}`);
    await pineconeClient.createIndex({
      name: indexName,
      dimension,
      metric: 'cosine',
      spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
    });
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
  return pineconeClient.index(indexName);
};

const getCachedGuide = async (place: string) => {
  try {
    const guidesIndex = await getOrCreateIndex('nepal-tourism-guides', 768);
    const embeddingModel = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '').getGenerativeModel({ model: 'embedding-001' });
    const queryEmbedding = (await embeddingModel.embedContent(`${place} Nepal tourism travel guide`)).embedding.values;
    const queryResponse = await guidesIndex.query({
      vector: queryEmbedding,
      filter: { place: { $eq: place.toLowerCase() } },
      includeMetadata: true,
      topK: 1,
    });
    return queryResponse.matches?.[0]?.metadata ?? null;
  } catch (error) {
    console.error(`Error checking guide cache for ${place}:`, error);
    return null;
  }
};

const cacheGuide = async (place: string, aiContent: string, sources: Source[]) => {
  try {
    const guidesIndex = await getOrCreateIndex('nepal-tourism-guides', 768);
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '');
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    const guideEmbedding = (await embeddingModel.embedContent(aiContent)).embedding.values;
    await guidesIndex.upsert([
      {
        id: `guide-${place.toLowerCase().replace(/\s+/g, '-')}`,
        values: guideEmbedding,
        metadata: {
          place: place.toLowerCase(),
          guide: aiContent,
          sources: JSON.stringify(sources),
          createdAt: new Date().toISOString(),
        },
      },
    ]);
    console.log(`Cached guide for ${place}`);
  } catch (error) {
    console.error(`Error caching guide for ${place}:`, error);
  }
};

async function fetchMapsAttractions(place: string): Promise<{ attractions: Attraction[]; coordinates: string | null }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapsData: { attractions: Attraction[]; coordinates: string | null } = { attractions: [], coordinates: null };
  try {
    if (!apiKey) throw new Error('Google Maps API key is missing');
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(place + ' Nepal')}&key=${apiKey}`;
    const searchResponse = await axios.get<GoogleMapsSearchResult>(searchUrl);
    const result = searchResponse.data.results[0];
    if (!result || !result.place_id) {
      console.warn('No place ID found for place:', place);
      return mapsData;
    }
    const location = result.geometry.location;
    mapsData.coordinates = `${location.lat},${location.lng}`;
    const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&type=tourist_attraction&key=${apiKey}`;
    const attractionsResponse = await axios.get<GoogleMapsNearbyResult>(nearbyUrl);
    mapsData.attractions = attractionsResponse.data.results.slice(0, 5).map((place: GoogleMapsPlace) => ({
      name: place.name,
      rating: place.rating?.toString() || 'N/A',
      vicinity: place.vicinity,
      photo: place.photos?.[0]?.photo_reference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}` : null,
    }));
    console.log('Fetched attractions:', mapsData.attractions);
    return mapsData;
  } catch (error) {
    console.error('Error fetching Google Maps attractions:', error);
    return mapsData;
  }
}

const searchAndStoreChunks = async (place: string, genAI: GoogleGenerativeAI): Promise<Array<ProcessedDocument & { similarity: number }>> => {
  const exa = new Exa(process.env.EXA_API_KEY ?? '');
  const searchQuery = `${place} Nepal tourism travel guide`;
  const exaResult = await exa.searchAndContents(searchQuery, {
    type: 'neural',
    numResults: 7,
    text: true,
    highlightResults: true,
    useAutoprompt: true,
  });
  if (!exaResult.results?.length) {
    throw new Error(`No results found for "${place}, Nepal"`);
  }
  const processedDocuments: ProcessedDocument[] = [];
  for (const result of exaResult.results) {
    if (!result.text) continue;
    const cleanedText = cleanText(result.text);
    if (cleanedText.split(' ').length < 30) continue;
    const chunks = chunkDocument(cleanedText);
    chunks.forEach((chunk, index) => {
      processedDocuments.push({
        url: result.url,
        title: result.title ?? 'Untitled',
        chunkIndex: index,
        totalChunks: chunks.length,
        content: chunk,
        place: place.toLowerCase(),
      });
    });
  }
  if (!processedDocuments.length) {
    throw new Error(`No relevant content found for "${place}, Nepal"`);
  }
  const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
  const contentResults: ContentResult[] = [];
  const batchSize = 10;
  for (let i = 0; i < processedDocuments.length; i += batchSize) {
    const batch = processedDocuments.slice(i, i + batchSize);
    const batchRequests = batch.map((doc) => ({
      content: { role: 'user', parts: [{ text: doc.content }] },
    }));
    try {
      const batchResponse = await embeddingModel.batchEmbedContents({ requests: batchRequests });
      batchResponse.embeddings?.forEach((embedding, idx) => {
        if (embedding?.values) {
          contentResults.push({
            document: batch[idx],
            embedding: embedding.values,
          });
        }
      });
    } catch (error) {
      console.error(`Error in batch embedding ${i / batchSize}:`, error);
    }
  }
  if (!contentResults.length) {
    throw new Error('Failed to generate embeddings');
  }
  const index = await getOrCreateIndex('nepal-tourism-chunks', contentResults[0].embedding.length);
  const records = contentResults.map((result, idx) => ({
    id: `${place.toLowerCase()}-${Date.now()}-${idx}`,
    values: result.embedding,
    metadata: { ...result.document },
  }));
  for (let i = 0; i < records.length; i += 100) {
    await index.upsert(records.slice(i, i + 100));
  }
  const queryEmbedding = (await embeddingModel.embedContent(searchQuery)).embedding.values;
  return contentResults.map((result) => ({
    ...result.document,
    similarity: cosineSimilarity(queryEmbedding, result.embedding),
  })).sort((a, b) => b.similarity - a.similarity);
};

const getOrCreateChunks = async (place: string, genAI: GoogleGenerativeAI) => {
  const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
  const queryText = `${place} Nepal tourism travel guide information`;
  const dimension = (await embeddingModel.embedContent(queryText)).embedding.values.length;
  const index = await getOrCreateIndex('nepal-tourism-chunks', dimension);
  const queryEmbedding = (await embeddingModel.embedContent(queryText)).embedding.values;
  const queryResponse = await index.query({
    vector: queryEmbedding,
    filter: { place: { $eq: place.toLowerCase() } },
    includeMetadata: true,
    topK: 10,
  });
  if (queryResponse.matches?.length) {
    return queryResponse.matches.map((match) => ({
      url: String(match.metadata?.url),
      title: String(match.metadata?.title),
      chunkIndex: Number(match.metadata?.chunkIndex),
      totalChunks: Number(match.metadata?.totalChunks),
      content: String(match.metadata?.content),
      place: String(match.metadata?.place),
      similarity: match.score ?? 0,
    }));
  }
  return await searchAndStoreChunks(place, genAI);
};

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const { place } = await request.json();
    console.log(`[Timing] Request parsing: ${Date.now() - startTime}ms`);

    if (!place) {
      return Response.json({ error: 'Place parameter is required' }, { status: 400 });
    }

    const missingKeys = [];
    if (!process.env.EXA_API_KEY) missingKeys.push('EXA_API_KEY');
    if (!process.env.GOOGLE_API_KEY) missingKeys.push('GOOGLE_API_KEY');
    if (!process.env.PINECONE_API_KEY) missingKeys.push('PINECONE_API_KEY');
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) missingKeys.push('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    if (missingKeys.length > 0) {
      return Response.json({ error: 'API keys not configured', missingKeys }, { status: 500 });
    }

    const searchUrls = {
      wikipedia: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(place + ' Nepal')}`,
      tripadvisor: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(place + ' Nepal')}`,
      lonelyPlanet: `https://www.lonelyplanet.com/search?q=${encodeURIComponent(place + ' Nepal')}`,
      googleMaps: `https://www.google.com/maps/search/${encodeURIComponent(place + ' Nepal')}`,
    };

    let stepTime = Date.now();
    const cachedGuide = await getCachedGuide(place);
    console.log(`[Timing] Check cache: ${Date.now() - stepTime}ms`);
    if (cachedGuide) {
      return Response.json({
        result: cachedGuide.guide,
        sources: JSON.parse(String(cachedGuide.sources)),
        fromCache: true,
        cachedAt: cachedGuide.createdAt,
        debug: { place, ...searchUrls },
      });
    }

    stepTime = Date.now();
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
    const topChunks = await getOrCreateChunks(place, genAI);
    console.log(`[Timing] Get or create chunks: ${Date.now() - stepTime}ms`);
    if (!topChunks.length) {
      return Response.json({ error: `No information found for "${place}, Nepal"`, ...searchUrls }, { status: 404 });
    }

    stepTime = Date.now();
    const mapsData = await fetchMapsAttractions(place);
    console.log(`[Timing] Fetch Maps attractions: ${Date.now() - stepTime}ms`);

    const formattedContent = topChunks.map((chunk) => `SOURCE: ${chunk.url}\nTITLE: ${chunk.title}\nRELEVANCE: ${chunk.similarity.toFixed(4)}\nCONTENT:\n${chunk.content}\n---`).join('\n\n');

    stepTime = Date.now();
    const generativeModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const prompt = `
Provide a travel plan in valid JSON format:
{
  "tripOverview": {
    "destination": "${place}",
    "days": 1
  },
  "dailyItinerary": [
    {
      "day": number,
      "date": string,
      "activities": [
        {
          "time": string,
          "activity": string,
          "location": string,
          "duration": string,
          "cost": number,
          "notes": string,
          "description": string
        }
      ]
    }
  ]
}

Guidelines:
5. Detailed daily itinerary blending Things to Do from content and Maps attractions.
6. In description of daily itinerary, include the description to describe the place and the activity to do in detail and the cost of the activity.
7. Return ONLY the JSON object, no extra text.

GOOGLE MAPS DATA:
- Coordinates: ${mapsData.coordinates || 'Not available'}
- Attractions: ${mapsData.attractions.map((a) => `${a.name}: Rating ${a.rating}, Location ${a.vicinity}, Image ${a.photo || 'None'}`).join(' | ') || 'None found'}

Use this content:
${formattedContent}
`;
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
    });
    console.log(`[Timing] Gemini call: ${Date.now() - stepTime}ms`);

    const aiContent = result.response.text();
    if (!aiContent) {
      return Response.json({ error: 'No content generated' }, { status: 500 });
    }

    stepTime = Date.now();
    const sources = topChunks.map((chunk) => ({ url: chunk.url, title: chunk.title, similarity: chunk.similarity }));
    await cacheGuide(place, aiContent, sources);
    console.log(`[Timing] Cache guide: ${Date.now() - stepTime}ms`);

    console.log(`[Timing] Total time: ${Date.now() - startTime}ms`);
    return Response.json({
      result: aiContent,
      sources,
      fromCache: false,
      debug: { place, totalChunks: topChunks.length, ...searchUrls },
    });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return Response.json({ error: errorMessage, stack: errorStack, timestamp: new Date().toISOString() }, { status: 500 });
  }
}