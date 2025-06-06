// import React from "react";
// import { Button } from "@/components/ui/button";
// import { TransportationPreferences, ActivityPreferencesDepth } from "./shared-components";

// interface ActivitiesStepProps {
//   transportationTypes: string[];
//   setTransportationTypes: (value: string[]) => void;
//   activityIntensity: string;
//   setActivityIntensity: (value: string) => void;
//   selectedActivities: string[];
//   toggleActivity: (activity: string) => void;
//   mustSeeAttractions: string;
//   setMustSeeAttractions: (value: string) => void;
//   onNext: () => void;
//   onBack: () => void;
// }

// const ActivitiesStep: React.FC<ActivitiesStepProps> = ({
//   transportationTypes,
//   setTransportationTypes,
//   activityIntensity,
//   setActivityIntensity,
//   selectedActivities,
//   toggleActivity,
//   mustSeeAttractions,
//   setMustSeeAttractions,
//   onNext,
//   onBack,
// }) => {
//   return (
//     <div className="space-y-6 animate-fade-in">
//       <div className="space-y-2">
//         <h1 className="text-3xl font-semibold text-gray-900">Transportation & Activities</h1>
//         <p className="text-gray-600 text-lg">
//           How will you get around and what will you do?
//         </p>
//       </div>

//       <TransportationPreferences
//         transportationTypes={transportationTypes}
//         setTransportationTypes={setTransportationTypes}
//       />

//       <ActivityPreferencesDepth
//         activityIntensity={activityIntensity}
//         setActivityIntensity={setActivityIntensity}
//         selectedActivities={selectedActivities}
//         toggleActivity={toggleActivity}
//         mustSeeAttractions={mustSeeAttractions}
//         setMustSeeAttractions={setMustSeeAttractions}
//       />

//       <div className="pt-6 flex justify-between">
//         <Button className="h-12 text-lg" variant="outline" onClick={onBack}>
//           Back
//         </Button>
//         <Button
//           className="h-12 text-lg bg-red-600 hover:bg-red-700 text-white"
//           onClick={onNext}
//         >
//           Next: Dining & Time Preferences
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default ActivitiesStep;