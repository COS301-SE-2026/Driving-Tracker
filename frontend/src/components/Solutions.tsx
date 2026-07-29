"use client";

import { useEffect, useRef } from "react";
import { createTimeline } from "animejs";

const PROBLEMSANDSOLUTIONS = [
  {
    problem: "Unsafe driving habits",
    solution: "Driving Tracker provides real-time safety monitoring, alerts, and driving scores.",
  },
  {
    problem: "Poor Fuel Efficiency and/or a rise in fuel prices",
    solution: "Driving Tracker gives you eco-driving analysis and fuel-saving recommendations.",
  },
  {
    problem: "Fragmented Driving Tools",
    solution: "Driving Tracker is an all-in-one platform integrating navigation, diagnostics, safety, and social features.",
  },
];

export default function Solutions() {

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const problemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const solutionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {

            //Anime.js timeline for step by step seqqence of animations
            const tl = createTimeline();

            PROBLEMSANDSOLUTIONS.forEach((_, index) => {

              const problemEl = problemRefs.current[index];
              const solutionEl = solutionRefs.current[index];

              //Problem card fades in on left
              if (problemEl) {
                tl.add(problemEl, {
                  opacity: [0, 1],
                  translateX: [-35, 0],
                  scale: [0.92, 1],
                  duration: 500,
                  ease: "outQuad",
                });
              }

              //Solution cube rolling to other side
              if (solutionEl) {
                tl.add(
                  solutionEl,
                  {
                    opacity: [0, 1],
                    translateX: ["-108%", "0%"],
                    rotate: [-360, 0],
                    scale: [0.85, 1],
                    duration: 900,
                    ease: "outCubic",
                  },
                  "+=80" //delay after problem card appears
                );
              }

            });

            observer.disconnect(); //running animation once after scrolling
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return(
    <section 
      ref={sectionRef}
      id = "solutions" 
      className = "w-full py-16 px-4 md:px-8 bg-[var(--color-bg)] overflow-hidden"
    >
      {/*Title Header */}
      <div className="text-center mb-16 flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)]">
          Problems our app addresses
        </h2>
        {/*Green underline bar */}
        <div className="w-40 h-1.5 bg-[var(--color-secondary)] rounded-full mt-3" />
      </div>

      <div className = "max-w-6xl mx-auto flex flex-col gap-8 md:gap-10">
        {PROBLEMSANDSOLUTIONS.map((pair, index) => (
          <div 
            key = {pair.problem} 
            className = "relative flex flex-col md:flex-row items-stretch justify-between gap-6 md:gap-8"
          >
            {/*Left problem card */}
            <div 
              ref={(el) => {
                problemRefs.current[index] = el;
              }}
              className ="w-full md:w-[48%] bg-[#e6f4ff] p-6 md:p-8 rounded-3xl shadow-sm border border-sky-100/80 z-10 opacity-0 flex flex-col justify-center"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                Problem {index + 1}
              </span>
              <p className="text-base md:text-lg font-semibold text-slate-800 leading-relaxed">
                {pair.problem}
              </p>
            </div>

            {/*Right solution card (rools out from behind left card) */}
            <div 
              ref={(el) => {
                solutionRefs.current[index] = el;
              }}
              className="w-full md:w-[48%] bg-[#e6f4ff] p-6 md:p-8 rounded-3xl shadow-sm border border-sky-100/80 z-0 opacity-0 flex flex-col justify-center origin-center"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)] mb-2">
                Solution {index + 1}
              </span>
              <p className="text-base md:text-lg font-medium text-slate-700 leading-relaxed">
                {pair.solution}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}