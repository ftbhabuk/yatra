// import React from "react";
// import { Button } from "@/components/ui/button";
// import { DiningPreferences, TimeAllocationPreferences } from "./shared-components";

// interface DiningStepProps {
//   cuisineTypes: string[];
//   setCuisineTypes: (value: string[]) => void;
//   diningStyles: string[];
//   setDiningStyles: (value: string[]) => void;
//   dietaryRestrictions: string[];
//   setDietaryRestrictions: (value: string[]) => void;
//   structuredVsFreeTime: string;
//   setStructuredVsFreeTime: (value: string) => void;
//   morningVsEveningPerson: string;
//   setMorningVsEveningPerson: (value: string) => void;
//   onNext: () => void;
//   onBack: () => void;
// }

// const DiningStep: React.FC<DiningStepProps> = ({
//   cuisineTypes,
//   setCuisineTypes,
//   diningStyles,
//   setDiningStyles,
//   dietaryRestrictions,
//   setDietaryRestrictions,
//   structuredVsFreeTime,
//   setStructuredVsFreeTime,
//   morningVsEveningPerson,
//   setMorningVsEveningPerson,
//   onNext,
//   onBack,
// }) => {
//   return (
//     <div className="space-y-6 animate-fade-in">
//       <div className="space-y-2">
//         <h1 className="text-3xl font-semibold text-gray-900">Dining & Time Preferences</h1>
//         <p className="text-gray-600 text-lg">
//           What will you eat and how will you spend your days?
//         </p>
//       </div>

//       <DiningPreferences
//         cuisineTypes={cuisineTypes}
//         setCuisineTypes={setCuisineTypes}
//         diningStyles={diningStyles}
//         setDiningStyles={setDiningStyles}
//         dietaryRestrictions={dietaryRestrictions}
//         setDietaryRestrictions={setDietaryRestrictions}
//       />

//       <TimeAllocationPreferences
//         structuredVsFreeTime={structuredVsFreeTime}
//         setStructuredVsFreeTime={setStructuredVsFreeTime}
//         morningVsEveningPerson={morningVsEveningPerson}
//         setMorningVsEveningPerson={setMorningVsEveningPerson}
//       />

//       <div className="pt-6 flex justify-between">
//         <Button className="h-12 text-lg" variant="outline" onClick={onBack}>
//           Back
//         </Button>
//         <Button
//           className="h-12 text-lg bg-red-600 hover:bg-red-700 text-white"
//           onClick={onNext}
//         >
//           Next: Review
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default DiningStep;