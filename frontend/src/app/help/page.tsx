"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {useState} from "react";

const FAQ = [
    { question: "How do I connect my OBD-II adapter?", answer: "Go to the OBD tab, tap Add Device, and select your ELM327 adapter via Bluetooth." },
  { question: "Is my driving data private?", answer: "Yes — your trip data is encrypted and only shared with contacts you explicitly choose." },
  { question: "Does the app work without an OBD adapter?", answer: "Yes, core trip tracking and scoring work with just your phone's sensors and GPS." },
  { question: "How is my driving score calculated?", answer: "It factors in braking, acceleration, speed consistency, and route conditions." },
  { question: "Can I track a family member's driving?", answer: "Yes, add them as a trusted contact and enable trip sharing from their settings." },
  { question: "Can I track a non-family member's driving?", answer: "No, add them as a trusted contact and enable trip sharing from their settings." },
];

const CARDS_PER_VIEW = 2;

export default function Help(){

    const [activeSlide, setActiveSlide] = useState(0);
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
                            
                                {FAQ.map((item) => (
                                    <div 
                                    key = {item.question}
                                    className="w-[calc(50%_-_0.5rem)] shrink-0 rounded-2xl bg-white 
                                    border border-[var(--color-border)] shadow-sm p-4 flex flex-col gap-2"
                                    >
                                        <p className="font-semibold text-sm text-[var(--color-text)]">
                                            {item.question}
                                        </p>
                                        <p className="text-s text-[var(--color-muted)] line-clamp-3">
                                            {item.answer}
                                        </p>
                                    </div>
                                ))}

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