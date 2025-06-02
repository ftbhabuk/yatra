"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TooltipWrapper } from "./tool-wrapper";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FLEXIBILITY_OPTIONS,
  SEASONS,
  BUDGET_OPTIONS,
  CURRENCIES,
  ACCOMMODATION_TYPES,
  TRANSPORTATION_TYPES,
  ACTIVITY_INTENSITY,
  ACTIVITY_CATEGORIES,
  CUISINE_TYPES,
  DIETARY_RESTRICTIONS,
} from "@/app/create-trip/constants";
import { cn } from "@/lib/utils";

// CompanionSelection Component
interface CompanionSelectionProps {
  travelCompanion: string;
  setTravelCompanion: (companion: string) => void;
}

export const CompanionSelection: React.FC<CompanionSelectionProps> = ({
  travelCompanion,
  setTravelCompanion,
}) => {
  return (
    <div className="space-y-2">
      <TooltipWrapper content="Are you traveling solo, with a partner, family, or friends?">
        <label className="text-lg font-medium text-gray-900">Who are you traveling with?</label>
      </TooltipWrapper>
      <Select value={travelCompanion} onValueChange={setTravelCompanion}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select travel companion" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="solo">Solo</SelectItem>
          <SelectItem value="partner">Partner</SelectItem>
          <SelectItem value="family">Family</SelectItem>
          <SelectItem value="friends">Friends</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
// TravelDatesSelection Component with Clean Calendar UI
interface TravelDatesSelectionProps {
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  dateFlexibility: string;
  setDateFlexibility: (flexibility: string) => void;
  preferredSeason: string;
  setPreferredSeason: (season: string) => void;
  duration: number | null;
}

export const TravelDatesSelection: React.FC<TravelDatesSelectionProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  dateFlexibility,
  setDateFlexibility,
  preferredSeason,
  setPreferredSeason,
  duration,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  useEffect(() => {
    setShowDatePicker(dateFlexibility !== "veryFlexible");
  }, [dateFlexibility]);

  // Handle start date selection and auto-calculate end date
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setStartDate(date);
    if (duration && duration > 0) {
      const calculatedEndDate = addDays(date, duration);
      setEndDate(calculatedEndDate);
      // Auto-close calendar after selection
      setIsCalendarOpen(false);
    } else {
      setEndDate(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <TooltipWrapper content="Pick your start date, and we'll set the end date based on your trip duration.">
          <h2 className="text-lg font-medium text-gray-900">Travel Timing</h2>
        </TooltipWrapper>
      </div>

      {showDatePicker && (
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
                  {duration && `${duration} ${duration === 1 ? 'day' : 'days'}`}
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

      <div className="space-y-2">
        <TooltipWrapper content="How flexible are your travel dates?">
          <Label>How flexible are your dates?</Label>
        </TooltipWrapper>
        <Select value={dateFlexibility} onValueChange={setDateFlexibility}>
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

      {!showDatePicker && (
        <div className="space-y-2">
          <TooltipWrapper content="Preferred season if dates are very flexible.">
            <Label>Preferred Season to Travel</Label>
          </TooltipWrapper>
          <Select value={preferredSeason} onValueChange={setPreferredSeason}>
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
  );
};



// BudgetSelection Component
interface BudgetSelectionProps {
  budget: string;
  setBudget: (budget: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  budgetIncludes: string;
  setBudgetIncludes: (includes: string) => void;
  splurgeCategories: string[];
  setSplurgeCategories: (categories: string[]) => void;
}

export const BudgetSelection: React.FC<BudgetSelectionProps> = ({
  budget,
  setBudget,
  currency,
  setCurrency,
  budgetIncludes,
  setBudgetIncludes,
  splurgeCategories,
  setSplurgeCategories,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <TooltipWrapper content="Your budget guides our recommendations.">
          <h2 className="text-lg font-medium text-gray-900">Budget Details</h2>
        </TooltipWrapper>
        <p className="text-gray-600">Help us understand your spending preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BUDGET_OPTIONS.map((option) => (
          <Card
            key={option.level}
            className={`p-4 cursor-pointer transition-colors ${
              budget === option.level ? "border-blue-500" : ""
            }`}
            onClick={() => setBudget(option.level)}
          >
            <h3 className="font-semibold">{option.level}</h3>
            <p className="text-sm text-gray-500">{option.range}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="w-full sm:w-1/2">
          <TooltipWrapper content="Select your budget currency.">
            <Label className="mb-2 block">Currency</Label>
          </TooltipWrapper>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.value} value={curr.value}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-1/2">
          <TooltipWrapper content="Does your budget include transportation to the destination?">
            <Label className="mb-2 block">Your budget includes:</Label>
          </TooltipWrapper>
          <Select value={budgetIncludes} onValueChange={setBudgetIncludes}>
            <SelectTrigger>
              <SelectValue placeholder="What does your budget include?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everything">Everything (inc. flights/transport)</SelectItem>
              <SelectItem value="excludeTransport">Excludes transport to destination</SelectItem>
              <SelectItem value="onlyAtDestination">Only at-destination expenses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <TooltipWrapper content="Where would you splurge for a premium experience?">
          <Label className="mb-2 block">Where would you prefer to splurge?</Label>
        </TooltipWrapper>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {["Accommodation", "Dining", "Activities", "Transportation", "Shopping", "Nightlife"].map(
            (category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`splurge-${category}`}
                  checked={splurgeCategories.includes(category)}
                  onCheckedChange={(checked) =>
                    setSplurgeCategories(
                      checked
                        ? [...splurgeCategories, category]
                        : splurgeCategories.filter((item) => item !== category)
                    )
                  }
                />
                <label htmlFor={`splurge-${category}`} className="text-sm font-medium">
                  {category}
                </label>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// AccommodationPreferences Component
interface AccommodationPreferencesProps {
  accommodationType: string;
  setAccommodationType: (type: string) => void;
  locationPreference: string;
  setLocationPreference: (preference: string) => void;
}

export const AccommodationPreferences: React.FC<AccommodationPreferencesProps> = ({
  accommodationType,
  setAccommodationType,
  locationPreference,
  setLocationPreference,
}) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <TooltipWrapper content="Your accommodation preferences help us suggest places to stay.">
        <h2 className="text-lg font-medium text-gray-900">Accommodation Preferences</h2>
      </TooltipWrapper>
    </div>

    <div className="space-y-2">
      <Label className="mb-2 block">Preferred Accommodation Type</Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACCOMMODATION_TYPES.map((option) => (
          <Card
            key={option.value}
            className={`p-3 cursor-pointer transition-colors ${
              accommodationType === option.value ? "border-blue-500" : ""
            }`}
            onClick={() => setAccommodationType(option.value)}
          >
            <h3 className="font-medium text-center">{option.label}</h3>
          </Card>
        ))}
      </div>
    </div>

    <div className="space-y-2">
      <TooltipWrapper content="Preferred location or neighborhood?">
        <Label className="mb-2 block">Preferred Location/Neighborhood</Label>
      </TooltipWrapper>
      <Textarea
        placeholder="E.g., close to downtown, near the beach..."
        value={locationPreference}
        onChange={(e) => setLocationPreference(e.target.value)}
        className="h-20"
      />
      <p className="text-sm text-gray-500 italic">
        {`Example: "Historic district" or \`Walking distance to attractions\``}
      </p>
    </div>
  </div>
);

// TransportationPreferences Component
interface TransportationPreferencesProps {
  transportationTypes: string[];
  setTransportationTypes: (types: string[]) => void;
}

export const TransportationPreferences: React.FC<TransportationPreferencesProps> = ({
  transportationTypes,
  setTransportationTypes,
}) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <TooltipWrapper content="How do you prefer to get around?">
        <h2 className="text-lg font-medium text-gray-900">Transportation Preferences</h2>
      </TooltipWrapper>
    </div>

    <div className="space-y-2">
      <Label className="mb-2 block">How do you prefer to get around?</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {TRANSPORTATION_TYPES.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`transport-${option.value}`}
              checked={transportationTypes.includes(option.value)}
              onCheckedChange={(checked) =>
                setTransportationTypes(
                  checked
                    ? [...transportationTypes, option.value]
                    : transportationTypes.filter((item) => item !== option.value)
                )
              }
            />
            <label htmlFor={`transport-${option.value}`} className="text-sm font-medium">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ActivityPreferencesDepth Component
interface ActivityPreferencesDepthProps {
  activityIntensity: string;
  setActivityIntensity: (intensity: string) => void;
  selectedActivities: string[];
  toggleActivity: (activity: string) => void;
  mustSeeAttractions: string;
  setMustSeeAttractions: (attractions: string) => void;
}

export const ActivityPreferencesDepth: React.FC<ActivityPreferencesDepthProps> = ({
  activityIntensity,
  setActivityIntensity,
  selectedActivities,
  toggleActivity,
  mustSeeAttractions,
  setMustSeeAttractions,
}) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <TooltipWrapper content="What activities should we prioritize?">
        <h2 className="text-lg font-medium text-gray-900">Activity Preferences</h2>
      </TooltipWrapper>
    </div>

    <div className="space-y-3">
      <Label className="block">Preferred Activity Intensity</Label>
      <RadioGroup value={activityIntensity} onValueChange={setActivityIntensity}>
        {ACTIVITY_INTENSITY.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`intensity-${option.value}`} />
            <Label htmlFor={`intensity-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>

    <div className="space-y-3">
      <Label className="block">Preferred Activities by Category</Label>
      <Tabs defaultValue="Outdoor & Adventure" className="w-full">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5">
          {Object.keys(ACTIVITY_CATEGORIES).map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs sm:text-sm">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(ACTIVITY_CATEGORIES).map(([category, activities]) => (
          <TabsContent key={category} value={category} className="pt-4">
            <div className="flex flex-wrap gap-2">
              {activities.map((activity) => (
                <Button
                  key={activity}
                  type="button"
                  variant="outline"
                  className={`rounded-full ${
                    selectedActivities.includes(activity) ? "bg-blue-100 border-blue-500" : ""
                  }`}
                  onClick={() => toggleActivity(activity)}
                >
                  {activity}
                </Button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>

    <div className="space-y-2">
      <TooltipWrapper content="List must-see attractions or activities.">
        <Label className="mb-2 block">Must-See Attractions or Activities</Label>
      </TooltipWrapper>
      <Textarea
        placeholder="E.g., Eiffel Tower, Grand Canyon..."
        value={mustSeeAttractions}
        onChange={(e) => setMustSeeAttractions(e.target.value)}
        className="h-20"
      />
      <p className="text-sm text-gray-500 italic">
        {`Example: "Visit the Louvre" or "Hiking in a national park"`}
      </p>
    </div>
  </div>
);

// DiningPreferences Component
interface DiningPreferencesProps {
  cuisineTypes: string[];
  setCuisineTypes: (types: string[]) => void;
  diningStyles: string[];
  setDiningStyles: (styles: string[]) => void;
  dietaryRestrictions: string[];
  setDietaryRestrictions: (restrictions: string[]) => void;
}

export const DiningPreferences: React.FC<DiningPreferencesProps> = ({
  cuisineTypes,
  setCuisineTypes,
  diningStyles,
  setDiningStyles,
  dietaryRestrictions,
  setDietaryRestrictions,
}) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <TooltipWrapper content="Your dining preferences guide restaurant suggestions.">
        <h2 className="text-lg font-medium text-gray-900">Dining Preferences</h2>
      </TooltipWrapper>
    </div>

    <div className="space-y-2">
      <TooltipWrapper content="Select cuisines you enjoy or want to try.">
        <Label className="mb-2 block">Preferred Cuisine Types</Label>
      </TooltipWrapper>
      <div className="flex flex-wrap gap-2">
        {CUISINE_TYPES.map((cuisine) => (
          <Button
            key={cuisine}
            type="button"
            variant="outline"
            className={`rounded-full ${
              cuisineTypes.includes(cuisine) ? "bg-blue-100 border-blue-500" : ""
            }`}
            onClick={() =>
              setCuisineTypes(
                cuisineTypes.includes(cuisine)
                  ? cuisineTypes.filter((c) => c !== cuisine)
                  : [...cuisineTypes, cuisine]
              )
            }
          >
            {cuisine}
          </Button>
        ))}
      </div>
    </div>

    <div className="space-y-2">
      <TooltipWrapper content="Select your preferred dining environments.">
        <Label className="mb-2 block">Preferred Dining Styles</Label>
      </TooltipWrapper>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {["Street Food", "Casual Dining", "Fine Dining", "Local Eateries", "Food Tours", "Cooking Classes"].map(
          (style) => (
            <div key={style} className="flex items-center space-x-2">
              <Checkbox
                id={`dining-${style.replace(/\s+/g, "")}`}
                checked={diningStyles.includes(style)}
                onCheckedChange={(checked) =>
                  setDiningStyles(
                    checked ? [...diningStyles, style] : diningStyles.filter((s) => s !== style)
                  )
                }
              />
              <label htmlFor={`dining-${style.replace(/\s+/g, "")}`} className="text-sm font-medium">
                {style}
              </label>
            </div>
          )
        )}
      </div>
    </div>

    <div className="space-y-2">
      <TooltipWrapper content="Any dietary restrictions for dining options?">
        <Label className="mb-2 block">Dietary Restrictions</Label>
      </TooltipWrapper>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {DIETARY_RESTRICTIONS.map((restriction) => (
          <div key={restriction.id} className="flex items-center space-x-2">
            <Checkbox
              id={`diet-${restriction.id}`}
              checked={dietaryRestrictions.includes(restriction.id)}
              onCheckedChange={(checked) =>
                setDietaryRestrictions(
                  checked
                    ? [...dietaryRestrictions, restriction.id]
                    : dietaryRestrictions.filter((r) => r !== restriction.id)
                )
              }
            />
            <label htmlFor={`diet-${restriction.id}`} className="text-sm font-medium">
              {restriction.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// TimeAllocationPreferences Component
interface TimeAllocationPreferencesProps {
  structuredVsFreeTime: string;
  setStructuredVsFreeTime: (time: string) => void;
  morningVsEveningPerson: string;
  setMorningVsEveningPerson: (person: string) => void;
}

export const TimeAllocationPreferences: React.FC<TimeAllocationPreferencesProps> = ({
  structuredVsFreeTime,
  setStructuredVsFreeTime,
  morningVsEveningPerson,
  setMorningVsEveningPerson,
}) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <TooltipWrapper content="Balance your itinerary between plans and free time.">
        <h2 className="text-lg font-medium text-gray-900">Time Allocation Preferences</h2>
      </TooltipWrapper>
    </div>

    <div className="space-y-3">
      <Label className="block">How do you prefer your time?</Label>
      <RadioGroup value={structuredVsFreeTime} onValueChange={setStructuredVsFreeTime}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="mostlyStructured" id="mostly-structured" />
          <Label htmlFor="mostly-structured">Mostly structured (guided tours, plans)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="balancedMix" id="balanced-mix" />
          <Label htmlFor="balanced-mix">Balanced mix of structured and free time</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="mostlyFreeTime" id="mostly-free-time" />
          <Label htmlFor="mostly-free-time">Mostly free time with few plans</Label>
        </div>
      </RadioGroup>
    </div>

    <div className="space-y-3">
      <Label className="block">Morning or evening person?</Label>
      <RadioGroup value={morningVsEveningPerson} onValueChange={setMorningVsEveningPerson}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="morningPerson" id="morning-person" />
          <Label htmlFor="morning-person">Morning (early starts, earlier dinners)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="eveningPerson" id="evening-person" />
          <Label htmlFor="evening-person">Evening (later starts, nightlife)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="flexible" id="time-flexible" />
          <Label htmlFor="time-flexible">Flexible/mix of both</Label>
        </div>
      </RadioGroup>
    </div>
  </div>
);