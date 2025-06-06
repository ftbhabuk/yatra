// import React from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { CompanionSelection, TravelDatesSelection } from "./shared-components"; // Shared reusable components
// import { TooltipWrapper } from "./tool-wrapper";

// interface BasicsStepProps {
//   destination: string;
//   setDestination: (value: string) => void;
//   duration: string;
//   setDuration: (value: string) => void;
//   startDate: Date | null;
//   setStartDate: (date: Date | null) => void;
//   endDate: Date | null;
//   setEndDate: (date: Date | null) => void;
//   dateFlexibility: string;
//   setDateFlexibility: (value: string) => void;
//   preferredSeason: string;
//   setPreferredSeason: (value: string) => void;
//   travelCompanion: string;
//   setTravelCompanion: (value: string) => void;
//   onNext: () => void;
// }

// const BasicsStep: React.FC<BasicsStepProps> = ({
//   destination,
//   setDestination,
//   duration,
//   setDuration,
//   startDate,
//   setStartDate,
//   endDate,
//   setEndDate,
//   dateFlexibility,
//   setDateFlexibility,
//   preferredSeason,
//   setPreferredSeason,
//   travelCompanion,
//   setTravelCompanion,
//   onNext,
// }) => {
//   // Convert duration string to number for TravelDatesSelection component
//   const durationNumber = duration ? parseInt(duration, 10) : null;
  
//   return (
//     <div className="space-y-6 animate-fade-in">
//       <div className="space-y-2">
//         <h1 className="text-3xl font-semibold text-gray-900">Trip Basics</h1>
//         <p className="text-gray-600 text-lg">
//         Let’s start with the essentials for your adventure.
//         </p>
//       </div>
      
//       <div className="space-y-2">
//         <TooltipWrapper content="Where are you dreaming of going? Be specific (e.g., city, country).">
//           <label className="text-lg font-medium text-gray-900">Destination</label>
//         </TooltipWrapper>
//         <Input
//           type="text"
//           className="w-full h-12"
//           placeholder="E.g., Tokyo, Japan"
//           value={destination}
//           onChange={(e) => setDestination(e.target.value)}
//         />
//         {!destination && (
//           <p className="text-sm text-red-500">Please enter a destination.</p>
//         )}
//       </div>
      
//       <div className="space-y-2">
//         <TooltipWrapper content="How many days will you be staying?">
//           <label className="text-lg font-medium text-gray-900">Trip Duration</label>
//         </TooltipWrapper>
//         <Input
//           type="number"
//           className="w-full h-12"
//           placeholder="Number of days"
//           min="1"
//           value={duration}
//           onChange={(e) => setDuration(e.target.value)}
//         />
//         {!duration && (
//           <p className="text-sm text-red-500">Please enter a duration.</p>
//         )}
//       </div>
      
//       <TravelDatesSelection
//         startDate={startDate}
//         setStartDate={setStartDate}
//         endDate={endDate}
//         setEndDate={setEndDate}
//         dateFlexibility={dateFlexibility}
//         setDateFlexibility={setDateFlexibility}
//         preferredSeason={preferredSeason}
//         setPreferredSeason={setPreferredSeason}
//         duration={durationNumber}
//       />
      
//       <CompanionSelection
//         travelCompanion={travelCompanion}
//         setTravelCompanion={setTravelCompanion}
//       />
      
//       <div className="pt-6 flex justify-end">
//         <Button
//           className="h-12 text-lg bg-red-600 hover:bg-red-700 text-white"
//           onClick={onNext}
//           disabled={!destination || !duration}
//         >
//           Next: Budget & Accommodation
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default BasicsStep;