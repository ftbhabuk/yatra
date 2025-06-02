"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import axios from "axios";
// import BasicsStep from "@/components/trip-creation/BasicsStep";
import BasicsStep from "@/components/trip-creation/BasicStep";
import BudgetStep from "@/components/trip-creation/BudgetStep";
import ActivitiesStep from "@/components/trip-creation/ActivitiesStep";
import DiningStep from "@/components/trip-creation/DiningStep";
import ReviewStep from "@/components/trip-creation/ReviewStep";
import { Button } from "@/components/ui/button";

const CreateTripPage = () => {
  // State declarations (unchanged)
  const [destination, setDestination] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [travelCompanion, setTravelCompanion] = useState<string>("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [specialRequirements, setSpecialRequirements] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dateFlexibility, setDateFlexibility] = useState("");
  const [preferredSeason, setPreferredSeason] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [budgetIncludes, setBudgetIncludes] = useState("");
  const [splurgeCategories, setSplurgeCategories] = useState<string[]>([]);
  const [accommodationType, setAccommodationType] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [transportationTypes, setTransportationTypes] = useState<string[]>([]);
  const [activityIntensity, setActivityIntensity] = useState("moderate");
  const [mustSeeAttractions, setMustSeeAttractions] = useState("");
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [diningStyles, setDiningStyles] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [structuredVsFreeTime, setStructuredVsFreeTime] = useState("balancedMix");
  const [morningVsEveningPerson, setMorningVsEveningPerson] = useState("flexible");

  const router = useRouter();
  const JSONBIN_URL = "https://api.jsonbin.io/v3/b";
  const apiKey = "$2a$10$R6Pd/bZ7RzyKLchhTQkUPufqnPgK7tXiZOgmrbwAYDX3LapMWrnL2";

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const googleResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      setUserData(googleResponse.data);
      setIsLoggedIn(true);
      localStorage.setItem("user_data", JSON.stringify(googleResponse.data));
    },
    onError: (error) => console.error("Google Login Failed:", error),
  });

  const logout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    localStorage.removeItem("user_data");
    router.push("/");
  };

  useEffect(() => {
    const storedUserData = localStorage.getItem("user_data");
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
      setIsLoggedIn(true);
    }
  }, []);

  const toggleActivity = useCallback((activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  }, []);

  const generateTrip = async () => {
    if (!isLoggedIn) {
      login();
      return;
    }
    setIsLoading(true);
    const formData = {
      destination,
      duration,
      budget,
      travelCompanion,
      selectedActivities,
      specialRequirements,
      startDate: startDate?.toISOString() || null,
      endDate: endDate?.toISOString() || null,
      dateFlexibility,
      preferredSeason,
      currency,
      budgetIncludes,
      splurgeCategories,
      accommodationType,
      locationPreference,
      transportationTypes,
      activityIntensity,
      mustSeeAttractions,
      cuisineTypes,
      diningStyles,
      dietaryRestrictions,
      structuredVsFreeTime,
      morningVsEveningPerson,
      user: userData ? { name: userData.name, email: userData.email } : null,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await axios.post("/api/", formData, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data.success) {
        const tripPlanData = response.data.data;
        const jsonBinResponse = await axios.post(
          JSONBIN_URL,
          { formData, tripPlan: tripPlanData },
          {
            headers: {
              "Content-Type": "application/json",
              "X-Master-Key": apiKey,
              "X-Bin-Name": `Trip Plan - ${destination} - ${new Date().toISOString()}`,
            },
          }
        );
        const tripId = jsonBinResponse.data.metadata.id;
        localStorage.setItem("lastTripPlanBinId", tripId);
        router.push(`/view-trip/${tripId}`);
      }
    } catch (error) {
      console.error("Error generating trip:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicsStep
            destination={destination}
            setDestination={setDestination}
            duration={duration}
            setDuration={setDuration}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            dateFlexibility={dateFlexibility}
            setDateFlexibility={setDateFlexibility}
            preferredSeason={preferredSeason}
            setPreferredSeason={setPreferredSeason}
            travelCompanion={travelCompanion}
            setTravelCompanion={setTravelCompanion}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <BudgetStep
            budget={budget}
            setBudget={setBudget}
            currency={currency}
            setCurrency={setCurrency}
            budgetIncludes={budgetIncludes}
            setBudgetIncludes={setBudgetIncludes}
            splurgeCategories={splurgeCategories}
            setSplurgeCategories={setSplurgeCategories}
            accommodationType={accommodationType}
            setAccommodationType={setAccommodationType}
            locationPreference={locationPreference}
            setLocationPreference={setLocationPreference}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <ActivitiesStep
            transportationTypes={transportationTypes}
            setTransportationTypes={setTransportationTypes}
            activityIntensity={activityIntensity}
            setActivityIntensity={setActivityIntensity}
            selectedActivities={selectedActivities}
            toggleActivity={toggleActivity}
            mustSeeAttractions={mustSeeAttractions}
            setMustSeeAttractions={setMustSeeAttractions}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <DiningStep
            cuisineTypes={cuisineTypes}
            setCuisineTypes={setCuisineTypes}
            diningStyles={diningStyles}
            setDiningStyles={setDiningStyles}
            dietaryRestrictions={dietaryRestrictions}
            setDietaryRestrictions={setDietaryRestrictions}
            structuredVsFreeTime={structuredVsFreeTime}
            setStructuredVsFreeTime={setStructuredVsFreeTime}
            morningVsEveningPerson={morningVsEveningPerson}
            setMorningVsEveningPerson={setMorningVsEveningPerson}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <ReviewStep
            destination={destination}
            duration={duration}
            budget={budget}
            travelCompanion={travelCompanion}
            startDate={startDate}
            endDate={endDate}
            selectedActivities={selectedActivities}
            specialRequirements={specialRequirements}
            setSpecialRequirements={setSpecialRequirements}
            onBack={prevStep}
            onSubmit={generateTrip}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        {isLoggedIn ? (
          <>
            {userData && (
              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={userData.picture}
                    alt="Profile"
                    className="rounded-full w-12 h-12 mr-4"
                  />
                  <div>
                    <h2 className="text-xl font-semibold">Hi, {userData.name}!</h2>
                    <p className="text-gray-600">{userData.email}</p>
                  </div>
                </div>
                <Button onClick={logout} variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            )}

            <div className="mb-8">
              <div className="w-full bg-gray-200 h-2 mb-4 rounded-full overflow-hidden">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                {["Basics", "Budget", "Activities", "Dining", "Review"].map((label, idx) => (
                  <span
                    key={label}
                    className={currentStep >= idx + 1 ? "text-red-600 font-medium" : ""}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">{renderStep()}</div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="mb-4 text-lg text-gray-700">Please log in to start planning your trip.</p>
            <Button onClick={login} className="bg-red-600 hover:bg-red-700 text-white">
              Login with Google
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateTripPage;