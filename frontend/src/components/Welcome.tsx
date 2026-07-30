"use client";

import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger, type JSAnimation } from "animejs";
import styles from "./Welcome.module.css";

type WelcomeProps = {
    onFinish: () => void;
};

const TAGLINE = ["TRACK •", "ANALYZE •", "IMPROVE"];

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
            delay: stagger(350),
            duration: 500,
            ease: "outQuad",

            onComplete: () => {
                
               
                spinAnimationRef.current?.pause();
                

                animate(rootRef.current!, {
                    opacity: [1, 0],
                    duration: 700,
                    ease: "inOutQuad",
                    onComplete: () => {
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

        <div ref={rootRef} className={styles.welcome}>
            <div ref={wheelRef} className={styles.wheel} aria-hidden="true">
                <div className={styles.spoke}/>
                <div className={styles.spoke}/>
                <div className={styles.spoke}/>
                <div className={styles.spoke}/>
                <div className={styles.spoke}/>
                <div className={styles.spoke}/>
                <div className={styles.core}/>
            </div>

            <div className={styles.tagline}>
                {TAGLINE.map((word, index) => (

                    <span
                        key={word}
                        ref={(node) => {
                            wordRefs.current[index] = node;
                        }}
                        className={styles.word}
                    >
                        {word}
                    </span>

                ))}
            </div>
        </div>

    );

}