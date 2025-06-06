"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, ExternalLink, RefreshCw } from "lucide-react";

interface TripData {
  place: string;
  result: string;
  sources: Array<{
    url: string;
    title: string;
    similarity: number;
  }>;
  fromCache: boolean;
  cachedAt?: string;
  debug?: any;
}

const ViewTripPage = () => {
  const router = useRouter();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get trip data from sessionStorage
    const storedData = sessionStorage.getItem("tripData");
    console.log("Raw storedData from sessionStorage:", storedData);

    if (storedData) {
      try {
        const data: TripData = JSON.parse(storedData);
        setTripData(data);
        console.log("Parsed tripData:", data);
        console.log("Raw data.result:", data.result);
      } catch (error: any) {
        console.error("Error parsing sessionStorage data:", error.message);
        setError("Failed to load trip data from sessionStorage.");
      }
    } else {
      console.log("No trip data found in sessionStorage");
      setError("No trip data available. Please create a new trip.");
    }
    setLoading(false);
  }, []);

  const handleBackToCreate = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading your travel guide...</p>
        </div>
      </div>
    );
  }

  if (!tripData || error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900">No Trip Data Found</h2>
          <p className="text-gray-600">
            {error || "It looks like the trip data is missing. Please go back and create a new trip."}
          </p>
          <Button onClick={handleBackToCreate} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Create Trip
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={handleBackToCreate}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Create New Trip</span>
          </Button>
          <div className="flex items-center space-x-2">
            {tripData.fromCache && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Clock className="h-3 w-3 mr-1" />
                From Cache
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Destination Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-3xl">
                <MapPin className="h-8 w-8 text-blue-600" />
                <span>{tripData.place}</span>
              </CardTitle>
              {tripData.fromCache && tripData.cachedAt && (
                <p className="text-sm text-gray-500">
                  Cached on: {new Date(tripData.cachedAt).toLocaleString()}
                </p>
              )}
            </CardHeader>
          </Card>

          {/* Raw Gemini Data */}
          <Card>
            <CardHeader>
              <CardTitle>Travel Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg text-sm whitespace-pre-wrap">
                {tripData.result || "No travel information available."}
              </div>
            </CardContent>
          </Card>

          {/* Sources */}
          {tripData.sources && tripData.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tripData.sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{source.title}</p>
                        <p className="text-xs text-gray-500 truncate">{source.url}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {(source.similarity * 100).toFixed(1)}% match
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(source.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug Info */}
          {tripData.debug && (
            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(tripData.debug, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewTripPage;