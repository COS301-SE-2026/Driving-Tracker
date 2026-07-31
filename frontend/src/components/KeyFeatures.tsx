"use client"

import { useEffect, useState, useRef } from "react"
import { animate, stagger } from "animejs"

//Screenshots for carousel
const APP_SCREENSHOTS = [
  "/images/Screenshot_Connect.jpg",
  "/images/Screenshot_Home.jpg",
  "/images/Screenshot_OBDdata.jpg",
];

const FEATURES = [
  {title: "Smart Driving Tracker",
    
  description: `The Smart Driving Tracker records every journey using GPS and the phone's built in 
  sensors to provide detailed trip information. It monitors routes, speed, acceleration, braking, 
  cornering, and road conditions while visualizing trips. By combining sensor data and vehicle information, 
  it also estimates fuel consumption and identifies driving patterns that can help improve safety and efficiency.`,

  },

  {title: "OBD-II Vehicle Diagnostics",

  description: `Driving tracker connects to compatible ELM327 Bluetooth adapters to access real-time data 
  directly from the vehicle's onboard computer. It displays important information such as engine RPM, vehicle 
  speed, coolant temperature and diagnostic trouble codes. The system also detects potential mechanical 
  issues and help drivers identify problems before they become serious`,

  },

  {title: "Eco-Driving & Fuel Efficiency",

  description: `This feature analyzes driving habits to help users reduce fuel consumption and 
  improve vehicle efficiency. By evaluating factors such as acceleration, braking, engine RPM, 
  and trip data, it calculates fuel economy trends and generates specialized recommendations. `,

  },

  {title: "Safety Monitoring",

  description: `Our system continously evaluates driving behavior throughout each trip. It detects
   potentially dangerous actions such as harsh braking, rapid acceleration, speeding, swerving, and
    possible collision events using phone sensors and vehicle data. After every journey, the app 
    generates a safety score and provides feedback, while also monitoring driver fatigue.`,

  },

  {title: "Trusted Contacts Safety",

  description: `This feature helps users stay connected with family and friends while travelling. 
  Drivers can share live trips, notify selected contacts of their journer, and automatically send alerts 
  if unusual events occur, such as crash like impacts. This provide additional peace of mind 
  for both drivers and their loved ones.`,

  },

  {title: "Rankings",

  description: `The gamification in our system motivates users to develop safer and more efficient 
  driving habits through rewards and friendly competition. Drivers earn badges for reaching milestones and compete on leaderboards based on safety, fuel efficiency, 
  and driving consistency.`,

  },
];

export default function KeyFeatures() {
  
const [featureSet, setFeatureSet] = useState<0 | 1>(0);
const [activeScreenIndex, setActiveScreenIndex] = useState(0);

const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
const imageRef = useRef<HTMLImageElement | null>(null);
const isCardsAnimating = useRef(false);
const isImageAnimating = useRef(false);

//active 3 feature indices
const currentIndices = featureSet === 0 ? [0, 1, 2] : [3, 4, 5];

const shuffleCards = () => {//shuffle animation 

  if (isCardsAnimating.current) return;
  isCardsAnimating.current = true;

  //animating feature cards out
  animate(cardRefs.current.filter(Boolean), {

    opacity: [1, 0],
    scale: [1, 0.92],
    translateY: [0, -15],
    duration: 350,
    easing: "inOutQuad",

    onComplete: () => {

      //switching feature sets
      setFeatureSet((prev) => (prev === 0 ? 1 : 0))


      //animating new feature cards in
      animate(cardRefs.current.filter(Boolean), {
        opacity: [0, 1],
        scale: [0.92, 1],
        translateY: [15, 0],
        delay: stagger(100),
        duration: 500,
        easing: "outBack",
        onComplete: () => {
          isCardsAnimating.current = false;
        },
      });

    },

  });
  
};

//smooth transition for screenshots
const switchScreenshot = (targetIndex?: number) => {
  
  if (isImageAnimating.current) return;
  isImageAnimating.current = true;

  const nextIndex = 
    targetIndex !== undefined
      ? targetIndex
      : (activeScreenIndex + 1) % APP_SCREENSHOTS.length;

  if (imageRef.current) {
    animate(imageRef.current, {
      opacity: [1, 0.3, 1],
      scale: [1, 0.96, 1],
      duration: 600,
      easing: "inOutQuad",
      onComplete: () => {
        isImageAnimating.current = false
      },
    });
  }

  setActiveScreenIndex(nextIndex)

}

useEffect(() => {
  const cardTimer = setInterval(() => {
    shuffleCards()
  }, 7000);
  return () => clearInterval(cardTimer);
}, [featureSet]);

useEffect(() => {
  const imageTimer = setInterval(() => {
    switchScreenshot()
  }, 4000);
  return () => clearInterval(imageTimer);
}, [activeScreenIndex]);

return (
  <section id="key-features" className="w-full py-16 px-4 md:px-8 bg-[var(--color-bg)]">
    {/*Title Header */}
    <div className="text-center mb-12">
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)]">
        Key Features
      </h2>
    </div>

    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

      {/*Left Column: Blue gradient container with screenshot */}
      <div className="lg:col-span-5 relative flex flex-col justify-center items-center p-6 md:p-10 rounded-[36px] bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd]/50 to-white/10 shadow-sm border border-sky-100/60 min-h-[580px]">
      
        {/*image element */}
        <div className="relative flex justify-center items-center max-w-[280px] md:max-w-[310px]">
          <img 
            ref={imageRef}
            src={APP_SCREENSHOTS[activeScreenIndex]}
            alt="App Screenshot"
            className="w-full max-h-[500px] object-contain rounded-3xl shadow-2xl border-4 border-white/80"
          />
        </div>

        {/*Carousel Dots */}
        <div className="flex gap-2 mt-6">
          {APP_SCREENSHOTS.map((_, i) => (
            <button
              key={i}
              onClick={() => switchScreenshot(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === activeScreenIndex
                  ? "bg-[var(--color-primary)] w-6"
                  : "bg-sky-200 w-2.5 hover:bg-sky-300"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

      </div>

      {/*Right Column: 3 card display */}
      <div className="lg:col-span-7 relative min-h-[580px] flex flex-col justify-between py-2 gap-6 lg:gap-0">

          {/*Top Left card */}
          <div className="flex justify-start">
            <div
              ref={(el) => { cardRefs.current[0] = el; }}
              className="w-full max-w-md bg-[#e6f4ff] p-6 md:p-7 rounded-3xl shadow-sm border border-sky-100/80"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {FEATURES[currentIndices[0]].title}
              </h3>
              <div className="w-16 h-1 bg-[var(--color-secondary)] rounded-full my-2.5" />
              <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed">
                {FEATURES[currentIndices[0]].description}
              </p>
            </div>
          </div>

          {/*Top Right card */}
          <div className="flex justify-end lg:-mt-4">
            <div
              ref={(el) => { cardRefs.current[1] = el; }}
              className="w-full max-w-md bg-[#e6f4ff] p-6 md:p-7 rounded-3xl shadow-sm border border-sky-100/80"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {FEATURES[currentIndices[1]].title}
              </h3>
              <div className="w-16 h-1 bg-[var(--color-secondary)] rounded-full my-2.5" />
              <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed">
                {FEATURES[currentIndices[1]].description}
              </p>
            </div>
          </div>

          {/*Bottom center/right card */}
          <div className="flex justify-center lg:justify-start lg:ml-12">
            <div
              ref={(el) => { cardRefs.current[2] = el; }}
              className="w-full max-w-md bg-[#e6f4ff] p-6 md:p-7 rounded-3xl shadow-sm border border-sky-100/80"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {FEATURES[currentIndices[2]].title}
              </h3>
              <div className="w-16 h-1 bg-[var(--color-secondary)] rounded-full my-2.5" />
              <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed">
                {FEATURES[currentIndices[2]].description}
              </p>
            </div>
          </div>

      </div>

    </div>

  </section>
);

}