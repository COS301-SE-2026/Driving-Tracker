"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {useState} from "react";

const FAQ = [
    {
    question: "How do I share my trips with friends and family?",
    answer:
      "Go to the Contacts page and add a trusted contact. Before starting a trip, select a contact to share your journey with. If you forget, simply tap 'Share Trip' during the trip and choose one of your trusted contacts.",
  },
  {
    question: "Is my data safe and private?",
    answer:
      "Yes. All trip data is encrypted and never sold or shared with third parties without your permission.",
  },
  {
    question: "How do I connect my OBD device?",
    answer:
      "Open the OBD tab from the navigation bar, and then tap OBD Adapters. Press 'Add Device' and follow the on-screen instructions to connect your adapter.",
  },
  {
    question: "What are Driver Profiles?",
    answer:
      "Driver Profiles classify your driving style based on events recorded across your previous trips. Categories include Safe Driver, Aggressive Accelerator, and Good Driver.",
  },
  {
    question: "Do I need an OBD device to use the app?",
    answer:
      "No. You can track trips using your smartphone's GPS and motion sensors alone. An OBD device simply provides additional vehicle information such as RPM, engine temperature, and speed.",
  },
  {
    question: "How is my Safety Score calculated?",
    answer:
      "Your Safety Score is based on driving events detected during each trip, such as harsh braking and harsh acceleration. Smoother, safer driving with fewer events results in a higher score.",
  },
];

const CARDS_PER_VIEW = 2;

export default function Help(){

    const [activeSlide, setActiveSlide] = useState(0);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const totalSlides = FAQ.length - CARDS_PER_VIEW + 1;

    return(
        <main className="flex flex-col">

            <Navbar/>

            {/*How to Section*/}
            <section className="flex flex-col md:flex-row items-center gap-12 px-6 
                    py-16 max-w-7xl mx-auto w-full">
                <div className="flex flex-col gap-6 max-w-lg">
                    <div>
                        <h1 className="text-4xl font-extrabold text-[var(--color-text)]">How to track your drive:</h1>
                        <span className="block h-1 w-24 mt-2 bg-[var(--color-secondary)] rounded-full"/>
                    </div>

                    <div className="p-6 rounded-2xl bg-[var(--color-primary)]/10">
                        <p className="text-base text-[var(--color-muted)] leading-relaxed">
                            New to Driving Tracker? Buckle up and let us take the wheel!
                            This quick tutorial will guide you through the app's key features, 
                            helping you navigate with confidence, stay on track, 
                            and make the most of every journey.
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex justify-center">
                    <div className="relative w-full max-w-xl aspect-video rounded-3xl p-8 bg-[var(--color-primary)]/15 
                        border-2 border-[var(--color-primary)] flex items-center justify-center gap-[-2rem] overflow-hidden">
                        
                        <video 
                        controls
                        poster = "/images/tutorial.png"
                        className="w-full h-full rounded-2xl object-cover"
                        >
                            <source src = "/videos/how-to-use-driving-tracker.mp4" type = "video/mp4" />
                            Your browser does not support this video.
                        </video>
                        
                    </div>
                </div>
            </section>

            {/*FAQ*/}
            <section className="flex flex-col md:flex-row items-start gap-8 px-6 py-16 max-w-7xl mx-auto w-full bg-[var(--color-primary)]/10 rounded-3xl">
                <div className="w-48 shrink-0 flex flex-col gap-2">
                    <h2 className="text-3xl font-extrabold text-[var(--color-text)]">FAQs</h2>
                    <span className="block h-1 w-16 bg-[var(--color-secondary)] rounded-full" />
                    <p className="text-sm text-[var(--color-muted)]">Get the answers you need</p>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-hidden">

                    <div className="flex items-center gap-4">
                        <button
                        onClick = {() => setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
                        aria-label = "Previous FAQs"
                        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full border border-[var(--color-border)]"
                        >
                           ← 
                        </button>

                        <div className="flex-1 min-w-0 overflow-hidden">

                            <div className="flex gap-4 transition-transform duration-500 ease-in-out"

                            style = {{
                                transform: `translateX(calc(-${activeSlide} * (50% + 0.5rem)))`
                                }}
                            >
                            
                                {FAQ.map((item) => {
                                    const expanded = expandedCard === item.question;
                                    return(

                                        <button key = {item.question}

                                        type = "button"

                                        onClick={() =>
                                            setExpandedCard(expanded ? null : item.question)
                                        }

                                        className={`w-[calc(50%_-_0.5rem)] shrink-0 rounded-2xl bg-white border 
                                        border-[var(--color-border)] shadow-sm p-4 flex flex-col gap-2
                                        text-left transition-all duration-300 hover:shadow-md
                                        ${expanded ? "min-h-64 scale-105 border-[var(--color-primary)] shadow-lg" : "min-h-40 hover:shadow-md"}`}
                                        >
                                            <p className="font-semibold text-sm">
                                                {item.question}
                                            </p>

                                            <p className={`text-sm text-[var(--color-muted)] transition-all duration-300 ${
                                                expanded ? "" : "line-clamp-3"
                                            }`}
                                            >
                                                {item.answer}
                                            </p>

                                            <span className="mt-auto text-xs font-medium text-[var(--color-primary)]">
                                                {expanded ? "Show less" : "Read more"}
                                            </span>

                                        </button>
                                    );
                                })}

                            </div>

                        </div>

                        <button
                        onClick={() => setActiveSlide((prev) => (prev+1)% totalSlides)}
                        aria-label="Next FAQ"
                        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full border border-[var(--color-border)]"
                        >
                            →
                        </button>
                    </div>


                    <div className="flex justify-center gap-2">
                        {Array.from({length:totalSlides}).map((_,i) => (
                            <button
                            key = {i}
                            onClick={() => setActiveSlide(i)}
                            aria-label={`Go to slide ${i+1}`}
                            className={`h-2 w-2 rounded-full transition-colors ${
                            i === activeSlide ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="md:w-32 flex justify-center">
                    <img src = "/images/screen1.png" alt = "Driving Tracker Logo" className="h-24 w-24 rounded-full"/>
                </div>
            </section>

        <Footer/>
        </main>
    )
}