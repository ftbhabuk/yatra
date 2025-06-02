// constants.ts
import { Users, Heart } from "lucide-react";
import React from "react";

// Define types
// interface Option {
//   label: string;
//   value: string;
// }

interface BudgetOption {
  level: string;
  range: string;
}

interface CompanionOption {
  type: string;
  icon: React.FC;
  description: string;
}

// Configuration Constants
export const BUDGET_OPTIONS: BudgetOption[] = [
  { level: "Low", range: "0 - 1000 NRP" },
  { level: "Medium", range: "1000 - 2500 NRP" },
  { level: "High", range: "2500+ NRP" },
];

export const COMPANION_OPTIONS: CompanionOption[] = [
  { type: "Solo", icon: Users, description: "Traveling alone" },
  { type: "Family", icon: Users, description: "With family members" },
  { type: "Friends", icon: Users, description: "With a group of friends" },
  { type: "Couple", icon: Heart, description: "Romantic getaway" },
  { type: "Business", icon: Users, description: "Business trip" },
  { type: "Group Tour", icon: Users, description: "Organized tour group" },
];

export const ACTIVITIES = [
  "Cultural",
  "Adventure",
  "Relaxation",
  "Shopping",
  "Food & Dining",
  "Nature",
  "Historical",
  "Nightlife",
];

export const ACCOMMODATION_TYPES = [
  { label: "Hotel", value: "hotel" },
  { label: "Airbnb/Rental", value: "airbnb" },
  { label: "Hostel", value: "hostel" },
  { label: "Resort", value: "resort" },
  { label: "Camping", value: "camping" },
  { label: "Stay with locals", value: "local" },
];

export const TRANSPORTATION_TYPES = [
  { label: "Public Transit", value: "publicTransit" },
  { label: "Rental Car", value: "rentalCar" },
  { label: "Walking/Biking", value: "walkingBiking" },
  { label: "Rideshare/Taxi", value: "rideshare" },
  { label: "Guided Tours", value: "guidedTours" },
];

export const ACTIVITY_CATEGORIES = {
  "Outdoor & Adventure": [
    "Hiking",
    "Beach",
    "Water Sports",
    "Skiing",
    "Wildlife",
  ],
  "Cultural & Historical": [
    "Museums",
    "Historical Sites",
    "Architecture",
    "Local Events",
  ],
  "Culinary & Nightlife": [
    "Fine Dining",
    "Street Food",
    "Wine Tasting",
    "Nightlife",
  ],
  "Relaxation & Wellness": ["Spa", "Yoga", "Meditation", "Hot Springs"],
  "Shopping & Entertainment": [
    "Markets",
    "Malls",
    "Theater",
    "Concerts",
    "Sports Events",
  ],
};

export const CUISINE_TYPES = [
  "Local/Regional",
  "Italian",
  "Asian",
  "Mediterranean",
  "Middle Eastern",
  "Mexican/Latin",
  "Vegetarian/Vegan",
  "Fast Food",
  "Seafood",
  "Steakhouse",
  "Fusion",
];

export const DIETARY_RESTRICTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "glutenFree", label: "Gluten-Free" },
  { id: "dairyFree", label: "Dairy-Free" },
  { id: "nutFree", label: "Nut-Free" },
  { id: "kosher", label: "Kosher" },
  { id: "halal", label: "Halal" },
];

export const FLEXIBILITY_OPTIONS = [
  { label: "Exact dates only", value: "exact" },
  { label: "±2 days", value: "pm2days" },
  { label: "±1 week", value: "pm1week" },
  { label: "Very flexible", value: "veryFlexible" },
];

export const SEASONS = [
  { label: "Spring", value: "spring" },
  { label: "Summer", value: "summer" },
  { label: "Fall", value: "fall" },
  { label: "Winter", value: "winter" },
];

export const CURRENCIES = [
  { label: "USD ($)", value: "USD" },
  { label: "EUR (€)", value: "EUR" },
  { label: "GBP (£)", value: "GBP" },
  { label: "JPY (¥)", value: "JPY" },
  { label: "CAD (C$)", value: "CAD" },
  { label: "AUD (A$)", value: "AUD" },
];

export const ACTIVITY_INTENSITY = [
  { label: "Relaxed (lots of downtime)", value: "relaxed" },
  { label: "Moderate (balanced pace)", value: "moderate" },
  { label: "Action-packed (busy itinerary)", value: "actionPacked" },
];
