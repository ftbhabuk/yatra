import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TooltipWrapper } from "./tool-wrapper";
import { format } from "date-fns";

interface ReviewStepProps {
  destination: string;
  duration: string;
  budget: string;
  travelCompanion: string;
  startDate: Date | null;
  endDate: Date | null;
  selectedActivities: string[];
  specialRequirements: string;
  setSpecialRequirements: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  destination,
  duration,
  budget,
  travelCompanion,
  startDate,
  endDate,
  selectedActivities,
  specialRequirements,
  setSpecialRequirements,
  onBack,
  onSubmit,
  isLoading,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Review Your Trip</h1>
        <p className="text-gray-600 text-lg">
          Double-check everything before we create your perfect plan.
        </p>
      </div>

      <div className="space-y-2">
        <TooltipWrapper content="Any last-minute details or special requests?">
          <label className="text-base font-medium text-gray-900">
            Special Requirements
          </label>
        </TooltipWrapper>
        <Textarea
          placeholder="E.g., accessibility needs, pet-friendly options..."
          className="h-40"
          value={specialRequirements}
          onChange={(e) => setSpecialRequirements(e.target.value)}
        />
        <p className="text-sm text-gray-500 italic">
         {`Example: "I need a vegan-friendly itinerary" or "Traveling with a dog."`}
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-md shadow-sm">
        <h3 className="font-medium text-blue-800 mb-2">Your Trip Summary</h3>
        <ul className="space-y-1 text-sm text-blue-700">
          <li><strong>Destination:</strong> {destination}</li>
          <li><strong>Duration:</strong> {duration} days</li>
          <li><strong>Budget:</strong> {budget}</li>
          <li><strong>Companion:</strong> {travelCompanion}</li>
          {startDate && endDate && (
            <li>
              <strong>Dates:</strong> {format(startDate, "MMM d, yyyy")} to{" "}
              {format(endDate, "MMM d, yyyy")}
            </li>
          )}
          {selectedActivities.length > 0 && (
            <li><strong>Activities:</strong> {selectedActivities.join(", ")}</li>
          )}
        </ul>
      </div>

      <div className="pt-6 flex justify-between">
        <Button className="h-12 text-lg" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          className="h-12 text-lg bg-red-600 hover:bg-red-700 text-white"
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate My Trip"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;