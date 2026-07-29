import PhoneAnimation from "@/components/PhoneAnimation";

export default function DrivingTracker() {
  
  return(

    <section id = "home" 
    className = "reverseHero-gradient w-full">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 py-16 md:flex-row">
      {/*Phone animation that rotates with the cursor*/}
      <PhoneAnimation />
  

    {/*All about our app*/}
    <div className = "flex flex-col gap-6 max-w-2xl">
      <h1 className = "text-4xl font-extrabold">What is Driving Tracker?</h1>
      <span className="block h-1 w-24 mt-2 bg-[var(--color-secondary)] rounded-full"/>

      <p className="text-lg leading-8 text-[var(--color-text)]">
        Driving Tracker is a next-generation Android driving assistant that brings
        together phone sensors, Google Maps and OBD-II vehicle data in one
        intelligent ecosystem. The app analyses driving style, fuel consumption,
        braking patterns, vibration levels and road conditions while also monitoring
        real-time vehicle diagnostics.
      </p>

      <p className="text-lg leading-8 text-[var(--color-text)]">
        Through gamification, social comparisons, family and friend tracking and a
        fleet-management mode designed to impress, Driving Tracker offers more
        than a standard GPS tracker. It becomes a complete safety, efficiency and
        performance companion that supports everyday drivers.
      </p>

    </div>
    </div>
  </section>
  );
}