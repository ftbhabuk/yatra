
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const { place, question } = await request.json();
    console.log(`[Timing] Request parsing: ${Date.now() - startTime}ms`);

    if (!place || !question) {
      return NextResponse.json({ error: 'Place and question are required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '');
    const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' }); // Faster model for simple Q&A

    const prompt = `
You are a helpful travel assistant. Answer the user's question about ${place}, Nepal, based on general knowledge.

--- QUESTION ---
${question}

Instructions:
1. Provide a concise and accurate answer about ${place}, Nepal.
2. If you lack specific information, respond with "I don't have enough information to answer this about ${place}, Nepal."
3. Keep the response short and relevant.
`;

    const stepTime = Date.now();
    const chatResult = await chatModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 1., maxOutputTokens: 512 }, // Smaller output for speed
    });
    console.log(`[Timing] Gemini LLM call: ${Date.now() - stepTime}ms`);

    const answer = chatResult.response.text();
    console.log(`[Timing] Total time: ${Date.now() - startTime}ms`);

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Follow-up API error:', error);
    return NextResponse.json({ error: 'Server error during follow-up' }, { status: 500 });
  }
}