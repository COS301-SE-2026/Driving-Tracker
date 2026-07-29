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

  {title: "Challenges & Rankings",

  description: `The gamification in our system motivates users to develop safer and more efficient 
  driving habits through rewards and friendly competition. Drivers earn badges for reaching milestones, 
  completing weekly challenges, and compete on leaderboards based on safety, fuel efficiency, 
  and driving consistency.`,

  },
];

export default function KeyFeatures() {
  return (
    <section id= "key-features" className = "flex flex-col md:flex-row items-center gap-12 px-6 py-16">
      {/*Phone carousel: we might wrap a carousel in another carousel so that the description moves with the screenshots*/}

      {/*Feature List*/}
      <div className = "flex flex-col gap-8 max-w-xl">
        <h2 className = "text-3xl font-bold"> Key Features</h2>
        {FEATURES.map((feature) => (
          <div key = {feature.title} className = "flex flex-col gap-1">
            <h3 className =  "text-xl font-semibold">{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}