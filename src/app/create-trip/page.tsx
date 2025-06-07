"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FLEXIBILITY_OPTIONS = [
  { value: "fixed", label: "Fixed dates" },
  { value: "somewhatFlexible", label: "Somewhat flexible (±3-5 days)" },
  { value: "veryFlexible", label: "Very flexible (seasonal preference)" },
];

const SEASONS = [
  { value: "spring", label: "Spring (Mar-May)" },
  { value: "summer", label: "Summer (Jun-Aug)" },
  { value: "fall", label: "Fall (Sep-Nov)" },
  { value: "winter", label: "Winter (Dec-Feb)" },
];

const TRAVEL_COMPANIONS = [
  { value: "solo", label: "Solo" },
  { value: "partner", label: "Partner" },
  { value: "family", label: "Family" },
  { value: "friends", label: "Friends" },
];

const CreateTripPage = () => {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateFlexibility, setDateFlexibility] = useState("");
  const [preferredSeason, setPreferredSeason] = useState("");
  const [travelCompanion, setTravelCompanion] = useState("");
  const [customInfo, setCustomInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const router = useRouter();

  const durationNumber = duration ? parseInt(duration, 10) : null;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const handleDateSelect = (date) => {
    if (!date) return;
    setStartDate(date);
    if (durationNumber && durationNumber > 0) {
      // Calculate end date based on duration (duration-1 days after start date for proper calculation)
      const calculatedEndDate = addDays(date, durationNumber - 1);
      setEndDate(calculatedEndDate);
      setIsCalendarOpen(false);
    } else {
      setEndDate(null);
    }
    setError(""); // Clear error on date selection
  };

  const handleDateFlexibilityChange = (value) => {
    setDateFlexibility(value);
    setShowDatePicker(value !== "veryFlexible");
    if (value === "veryFlexible") {
      setStartDate(null);
      setEndDate(null);
    }
    setError(""); // Clear error on flexibility change
  };

  const generateTrip = async () => {
    // Input validation
    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }
    if (!duration.trim() || isNaN(durationNumber) || durationNumber <= 0) {
      setError("Please enter a valid duration (number of days).");
      return;
    }
    if (dateFlexibility === "fixed" && !startDate) {
      setError("Please select a start date for fixed dates.");
      return;
    }
    if (dateFlexibility === "veryFlexible" && !preferredSeason) {
      setError("Please select a preferred season.");
      return;
    }

    setIsLoading(true);
    setError(""); // Clear previous errors

    try {
      const formData = {
        destination: destination.trim(), // Changed from 'place' to 'destination'
        duration: durationNumber,
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
        dateFlexibility: dateFlexibility || null,
        preferredSeason: preferredSeason || null,
        travelCompanion: travelCompanion || null,
        customInfo: customInfo.trim() || null,
      };
      console.log("Sending formData to API:", formData);

      // Make API call to your backend
      const response = await axios.post("/api/", formData, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("API response:", response.data);

      if (response.data) {
        // Store the entire response data in session storage for the view-trip page
        const tripData = {
          place: destination,
          result: response.data.result,
          sources: response.data.sources || [],
          fromCache: response.data.fromCache || false,
          cachedAt: response.data.cachedAt || new Date().toISOString(),
          debug: response.data.debug || null,
        };
        sessionStorage.setItem("tripData", JSON.stringify(tripData));
        console.log("Stored tripData in sessionStorage:", tripData);

        router.push("/view-trip"); // Navigate to the view trip page
      } else {
        setError("No data received from the API.");
      }
    } catch (error) {
      console.error("Error generating trip:", error);
      setError(
        error.response?.data?.error || "Failed to generate trip plan. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Allow form submission on Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      generateTrip();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-gray-900">Plan Your Trip</h1>
            <p className="text-gray-600 text-lg">
              Enter the essentials for your adventure.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-medium text-gray-900">Destination</Label>
            <Input
              type="text"
              className="w-full h-12"
              placeholder="E.g., Tokyo, Japan"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setError(""); // Clear error on input change
              }}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            {!destination && (
              <p className="text-sm text-red-500">Please enter a destination.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-medium text-gray-900">Trip Duration</Label>
            <Input
              type="number"
              className="w-full h-12"
              placeholder="Number of days"
              min="1"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                setError(""); // Clear error on input change
              }}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            {!duration && (
              <p className="text-sm text-red-500">Please enter a duration.</p>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-medium text-gray-900">Travel Timing</Label>
            
            <div className="space-y-2">
              <Label>How flexible are your dates?</Label>
              <Select value={dateFlexibility} onValueChange={handleDateFlexibilityChange} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select flexibility" />
                </SelectTrigger>
                <SelectContent>
                  {FLEXIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showDatePicker && dateFlexibility && (
              <div className="w-full">
                <Label className="mb-2 block">Pick Start Date</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-gray-500"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {startDate ? (
                        <span>{format(startDate, "PPP")}</span>
                      ) : (
                        <span>Select departure date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => date <= yesterday}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {startDate && endDate && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-md border">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Departure</p>
                        <p className="text-sm text-slate-900">{format(startDate, "EEE, MMM d, yyyy")}</p>
                      </div>
                      <div className="text-sm text-slate-500 px-2">
                        {duration && `${duration} ${durationNumber === 1 ? 'day' : 'days'}`}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Return</p>
                        <p className="text-sm text-slate-900">{format(endDate, "EEE, MMM d, yyyy")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!showDatePicker && (
              <div className="space-y-2">
                <Label>Preferred Season to Travel</Label>
                <Select value={preferredSeason} onValueChange={setPreferredSeason} disabled={isLoading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select preferred season" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEASONS.map((season) => (
                      <SelectItem key={season.value} value={season.value}>
                        {season.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-medium text-gray-900">Who are you traveling with?</Label>
            <Select value={travelCompanion} onValueChange={setTravelCompanion} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select travel companion" />
              </SelectTrigger>
              <SelectContent>
                {TRAVEL_COMPANIONS.map((companion) => (
                  <SelectItem key={companion.value} value={companion.value}>
                    {companion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-medium text-gray-900">Specific Requests</Label>
            <Textarea
              className="w-full h-24 resize-none"
              placeholder="e.g., I want to stay near a lake, I really want to hike, need to visit a hospital..."
              value={customInfo}
              onChange={(e) => {
                setCustomInfo(e.target.value);
                setError(""); // Clear error on input change
              }}
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </p>
          )}

          <div className="pt-6 flex justify-end">
            <Button
              className="h-12 text-lg bg-red-600 hover:bg-red-700 text-white"
              onClick={generateTrip}
              disabled={isLoading || !destination.trim() || !duration.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Trip...
                </>
              ) : (
                "Create Trip"
              )}
            </Button>
          </div>

          {isLoading && (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">
                Crafting your perfect trip... This may take a moment.
              </p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateTripPage;