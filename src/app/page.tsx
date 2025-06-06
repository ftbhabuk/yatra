
import Hero from '@/components/Hero';
import React from 'react';
import GoogleMap from '@/components/GoogleMap';
import HotelExplorer from '@/components/dining';


const Page = () => {
  return (
    <div className="min-h-screen bg-white">
    
      <Hero />
      {/* <GoogleMap/> */}
     <div>
      <p className='xl'>hello world </p>
     </div>
     <div>
      <p className='xl'>hello world </p>
     </div>
     <div>
     <HotelExplorer/>
      <p className='xl'>hello world </p>
     </div>
    </div>
   
  );
};

export default Page;