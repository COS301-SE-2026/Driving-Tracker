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
    const wheelRef = useRef<HTMLDivElement | null>(null);
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
            <div 
                ref={wheelRef} 
                className="w-[180px] h-[180px] relative rounded-full border-[12px] border-[var(--color-primary)] box-border opacity-0" 
                aria-hidden="true"
            >
                {/*Dynamically displaying spokes for wheel */}
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                    <div
                    key={deg}
                    className="absolute top-1/2 left-1/2 w-[18px] h-[72px] bg-[var(--color-primary)] rounded-full orirgin-bottom"
                    style={{ transform: `translate(-50%, -100%) rotate(${deg}deg)`}}
                    />
                ))}

                {/*Wheel center */}
                <div className="absolute top-1/2 left-1/2 w-[34px] h-[34px] rounded-full bg-[var(--color-primary)] -translate-x-1/2 -translate-y-1/2"/>
            </div>

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