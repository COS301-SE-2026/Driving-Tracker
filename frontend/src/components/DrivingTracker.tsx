import PhoneAnimation from "@/components/PhoneAnimation";

export default function DrivingTracker() {
  
  return(

    <section id = "home" 
    className = "reverseHero-gradient w-full">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:flex-row lg:gap-12">
      {/*Phone animation that rotates with the cursor*/}
      <PhoneAnimation />
  

    {/*All about our app*/}
    <div className = "flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">What is Driving Tracker?</h1>
      <span className="block h-1 w-24 mt-2 bg-[var(--color-secondary)] rounded-full"/>

      <p className="text-base leading-7 text-[var(--color-text)] sm:text-lg sm:leading-8">
        Driving Tracker is a next-generation Android driving assistant that brings
        together phone sensors, Google Maps and OBD-II vehicle data in one
        intelligent ecosystem. The app analyses driving style, fuel consumption,
        braking patterns, vibration levels and road conditions while also monitoring
        real-time vehicle diagnostics.
      </p>

      <p className="text-base leading-7 text-[var(--color-text)] sm:text-lg sm:leading-8">
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