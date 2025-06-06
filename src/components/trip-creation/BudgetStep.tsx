// import React from "react";
// import { Button } from "@/components/ui/button";
// import { BudgetSelection, AccommodationPreferences } from "./shared-components";

// interface BudgetStepProps {
//   budget: string;
//   setBudget: (value: string) => void;
//   currency: string;
//   setCurrency: (value: string) => void;
//   budgetIncludes: string;
//   setBudgetIncludes: (value: string) => void;
//   splurgeCategories: string[];
//   setSplurgeCategories: (value: string[]) => void;
//   accommodationType: string;
//   setAccommodationType: (value: string) => void;
//   locationPreference: string;
//   setLocationPreference: (value: string) => void;
//   onNext: () => void;
//   onBack: () => void;
// }

// const BudgetStep: React.FC<BudgetStepProps> = ({
//   budget,
//   setBudget,
//   currency,
//   setCurrency,
//   budgetIncludes,
//   setBudgetIncludes,
//   splurgeCategories,
//   setSplurgeCategories,
//   accommodationType,
//   setAccommodationType,
//   locationPreference,
//   setLocationPreference,
//   onNext,
//   onBack,
// }) => {
//   return (
//     <div className="space-y-6 animate-fade-in">
//       <div className="space-y-2">
//         <h1 className="text-3xl font-semibold text-gray-900">Budget & Accommodation</h1>
//         <p className="text-gray-600 text-lg">
//           Tell us how you’d like to spend and stay.
//         </p>
//       </div>

//       <BudgetSelection
//         budget={budget}
//         setBudget={setBudget}
//         currency={currency}
//         setCurrency={setCurrency}
//         budgetIncludes={budgetIncludes}
//         setBudgetIncludes={setBudgetIncludes}
//         splurgeCategories={splurgeCategories}
//         setSplurgeCategories={setSplurgeCategories}
//       />

//       <AccommodationPreferences
//         accommodationType={accommodationType}
//         setAccommodationType={setAccommodationType}
//         locationPreference={locationPreference}
//         setLocationPreference={setLocationPreference}
//       />

//       <div className="pt-6 flex justify-between">
//         <Button className="h-12 text-lg" variant="outline" onClick={onBack}>
//           Back
//         </Button>
//         <Button
//           className="h-12 text-lg bg-red-600 hover:bg-red-700 text-white"
//           onClick={onNext}
//           disabled={!budget}
//         >
//           Next: Transportation & Activities
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default BudgetStep;