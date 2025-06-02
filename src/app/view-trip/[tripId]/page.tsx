"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import Link from "next/link"
import { ArrowLeft, Share2, Download, Calendar, Clock, Users } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
// import TripDetailsViewer from "@/components/trip-details-viewer"
import TripDetailsViewer from "@/components/TripDetailsViewer"
export default function ViewTripPage() {
  const params = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)

  const tripId = params?.tripId

  useEffect(() => {
    // Retrieve userData from localStorage
    const storedUserData = localStorage.getItem("temp_user_data")
    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData)
        setUserData(parsedUserData)
        console.log("Successfully loaded userData from localStorage:", parsedUserData)
      } catch (error) {
        console.error("Error parsing userData from localStorage:", error)
      } finally {
        // Remove userData from localStorage after retrieving it
        localStorage.removeItem("temp_user_data")
      }
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const apiKey = "$2a$10$R6Pd/bZ7RzyKLchhTQkUPufqnPgK7tXiZOgmrbwAYDX3LapMWrnL2"
        const response = await axios.get(`https://api.jsonbin.io/v3/b/${tripId}`, {
          headers: {
            "X-Master-Key": apiKey,
          },
        })
        setData(response.data)
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    if (tripId) {
      fetchData()
    }
  }, [tripId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f2e8]">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 opacity-20"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
        </div>
        <p className="mt-4 text-lg text-gray-600">Loading your adventure...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-[#f5f2e8] min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="border-none shadow-lg">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <AlertDescription className="text-lg">
              We couldn't load your trip data. Please try again later.
            </AlertDescription>
            <p className="text-sm text-gray-500 mt-2">Error: {error.message}</p>
            <Button className="mt-6" asChild>
              <Link href="/trips">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Trips
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  // Extract trip name from data if available
  const tripName = data?.record?.tripPlan?.tripOverview?.destination || "Your Trip"
  const tripDuration = data?.record?.tripPlan?.tripOverview?.duration || ""
  const startDate = data?.record?.formData?.startDate
    ? new Date(data.record.formData.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""
  const endDate = data?.record?.formData?.endDate
    ? new Date(data.record.formData.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""
  const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : ""

  // Get user name if available
  const userName = userData?.name || data?.record?.formData?.user?.name || "Traveler"
  const firstName = userName.split(" ")[0]

  return (
    <div className="bg-[#f5f2e8] min-h-screen pt-24 pb-16">
      {/* Back button and trip summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link
              href="/trips"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Trips
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
              {firstName}'s Trip to {tripName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-gray-600">
              {tripDuration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{tripDuration} days</span>
                </div>
              )}

              {dateRange && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{dateRange}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{data?.record?.formData?.travelers || "1"} travelers</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <Separator className="my-6" />
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {data ? (
          <TripDetailsViewer data={data} userData={userData} />
        ) : (
          <Alert>
            <AlertDescription>No trip data found for ID: {tripId}</AlertDescription>
          </Alert>
        )}

        {/* Optional: Debug view (hidden by default) */}
        {data && process.env.NODE_ENV === "development" && (
          <Card className="mt-12 border-none shadow-md overflow-hidden">
            <div className="bg-gray-800 text-white px-4 py-2 text-sm font-mono flex justify-between items-center">
              <span>Debug View (JSON Data)</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-white hover:text-white hover:bg-gray-700">
                Toggle
              </Button>
            </div>
            <CardContent className="p-0">
              <div className="bg-gray-900 p-4 rounded-b-lg overflow-x-auto max-h-96">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

