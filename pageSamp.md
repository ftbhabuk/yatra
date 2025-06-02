"use client"
import { useState } from 'react';

export default function Home() {
  const [place, setPlace] = useState('');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle initial place search
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!place.trim()) {
      setError('Please enter a place.');
      return;
    }

    setLoading(true);
    setResult('');
    setFollowUpAnswer('');
    setError('');

    try {
      const response = await fetch('/api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'An error occurred while fetching data.');
        return;
      }

      setResult(data.result);
      setQuestion('');
    } catch (err) {
      setError(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle follow-up questions
  const handleFollowUp = async () => {
    if (!question.trim() || !place.trim()) {
      setError('Please enter a follow-up question and ensure a place is selected.');
      return;
    }

    setLoading(true);
    setFollowUpAnswer('');
    setError('');

    try {
      const response = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place, question }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Follow-up error');
        return;
      }

      setFollowUpAnswer(data.answer);
      setQuestion('');
    } catch (err) {
      setError(`Follow-up fetch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Place Information</h1>

        {/* Initial Place Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Enter a place (e.g., Pokhara)"
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Loading...' : 'Get Information'}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="border p-4 rounded bg-red-100 text-red-700 mb-4">
            <h2 className="text-lg font-semibold mb-2">Error:</h2>
            <div>{error}</div>
          </div>
        )}

        {/* Initial Result Display */}
        {result && (
          <div className="border p-4 rounded bg-white-50 mb-4">
            <h2 className="text-lg font-semibold mb-2">Initial Result:</h2>
            <div className="whitespace-pre-wrap">{result}</div>
          </div>
        )}

        {/* Follow-up Question Section */}
        {result && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Ask a follow-up question:</h2>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="E.g., What is the best season to visit?"
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            <button
              onClick={handleFollowUp}
              disabled={loading}
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-green-300"
            >
              {loading ? 'Asking...' : 'Ask'}
            </button>

            {/* Follow-up Answer Display */}
            {followUpAnswer && (
              <div className="mt-4 border p-4 bg-white-100 rounded">
                <h3 className="font-semibold mb-1">Follow-up Answer:</h3>
                <p>{followUpAnswer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}