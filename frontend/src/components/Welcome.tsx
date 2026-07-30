"use client";

import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger, type JSAnimation } from "animejs";

type WelcomeProps = {
    onFinish: () => void;
};


const TAGLINE = [
    {text: "TRACK •", color: "text-[var(--color-primary)]" }, 
    {text: "ANALYZE •", color: "text-[var(--color-tertiary)]" }, 
    {text: "IMPROVE", color: "text-[var(--color-secondary)]" }
];

export default function Welcome({ onFinish }: WelcomeProps) {

    const rootRef = useRef<HTMLDivElement | null>(null);
    const wheelRef = useRef<SVGSVGElement | null>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const spinAnimationRef = useRef<JSAnimation | null>(null);
    const finishedRef = useRef(false);

    useEffect(() => {

        if (!wheelRef.current || !rootRef.current) return;

        const words = wordRefs.current.filter(
            (node): node is HTMLSpanElement => node !== null
        );

        const entrance = createTimeline();

        entrance.add(wheelRef.current, { 
            opacity: [0, 1],
            scale: [0.85, 1],
            duration: 700,
            ease: "outQuad",
        });

        spinAnimationRef.current = animate(wheelRef.current,{
            rotate: "1turn",
            duration: 900,
            easing: "linear",
            loop: true,
        });

        entrance.add(words, {
            opacity: [0, 1],
            translateY: [10, 0],
            delay: stagger(600),
            duration: 300,
            ease: "outQuad",

            onComplete: () => {
                
                animate(rootRef.current!, {
                    opacity: [1, 0],
                    duration: 700,
                    delay: 400,
                    ease: "inOutQuad",
                    onComplete: () => {
                        //Pausing spin only after screen fades out
                        spinAnimationRef.current?.pause();

                        if (!finishedRef.current) {
                            finishedRef.current = true;
                            onFinish();
                        }
                    },
                });

            },

        });

        return () => {
            entrance.pause();
            spinAnimationRef.current?.pause();
        };
        

    }, [onFinish]);

    return (

        <div 
            ref={rootRef} 
            className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-14 opacity-100"
        >
            <svg 
                ref={wheelRef} 
                viewBox="0 0 200 200"
                className="w-[180px] h-[180px] text-[var(--color-primary)] opacity-0 overflow-visible" 
                aria-hidden="true"
            >

                {/*Outer Rim */}
                <circle
                    cx="100"
                    cy="100"
                    r="86"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                />

                {/*spokes for wheel */}
                {[0, 72, 144, 216, 288].map((deg) => (
                    <path
                    key={deg}
                    d="M 93 78 L 83 24 L 117 24 L 107 78 Z"
                    fill="currentColor"
                    transform={`rotate(${deg} 100 100)`}
                    />
                ))}

                {/*Wheel center */}
                <circle cx="100" cy="100" r="23" fill="currentColor" />
            </svg>

            <div className="flex items-center gap-5 text-[2rem] font-medium tracking-[0.04em] uppercase">
                {TAGLINE.map((word, index) => (

                    <span
                        key={word.text}
                        ref={(node) => {
                            wordRefs.current[index] = node;
                        }}
                        className={`opacity-0 ${word.color}`}
                    >
                        {word.text}
                    </span>

                ))}
            </div>
        </div>

    );

}