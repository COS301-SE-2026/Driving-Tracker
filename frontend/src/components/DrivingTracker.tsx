import PhoneAnimation from "@/components/PhoneAnimation";

export default function DrivingTracker() {
  
  return(

    <section id = "home" className = "flex flex-col md:flex-row items-center justify-between gap-12 px-6 py-16 max-w-7xl mx-auto reverseHero-gradient">
      {/*Phone animation that rotates with the cursor*/}
      <PhoneAnimation />
  

    {/*All about our app*/}
    <div className = "grid grid-cols-1 md:grid-cols-2 items-center gap-12">
      <h1 className = "text-4xl font-extrabold">What is Driving Tracker?</h1>

      <p className="text-xl font-medium">
        Driving Tracker is a next-generation Android driving assistant that brings
        together phone sensors, Google Maps and OBD-II vehicle data in one
        intelligent ecosystem. The app analyses driving style, fuel consumption,
        braking patterns, vibration levels and road conditions while also monitoring
        real-time vehicle diagnostics.
      </p>

      <p className="text-xl font-medium">
        Through gamification, social comparisons, family and friend tracking and a
        fleet-management mode designed to impress, Driving Tracker offers more
        than a standard GPS tracker. It becomes a complete safety, efficiency and
        performance companion that supports everyday drivers.
      </p>

    </div>
  </section>
  );
}