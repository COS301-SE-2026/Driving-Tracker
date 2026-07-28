"use client";
import { useEffect, useRef, useState} from "react";
import {animate} from "animejs";

const PHONE_PICS = [
    "/images/phone-5.png",
    "/images/phone-2.png",
    "/images/phone-3.png",
    "/images/phone-4.png",
    "/images/phone-1.png",
];

const RADIUS = 140;

function getCircularTransform(index: number, total: number){
    const angleDeg = (360/total) * index - 90;
    const angleRad = (angleDeg * Math.PI) / 180;

    return{
        x: RADIUS * Math.cos(angleRad),
        y: RADIUS * Math.sin(angleRad),
        rotate: angleDeg/4,
    };
}

const BASE_TRANSFORMS = PHONE_PICS.map((_,i) => 
getCircularTransform(i,PHONE_PICS.length));

export default function PhoneAnimations(){
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [order, setOrder] = useState<number[]>([0,1,2,3,4]);

    //every 4 seconds, a phone comes to the front
    useEffect(() => {
        const interval = setInterval(() => {
            setOrder((prev) => {
                const currentFront = prev[prev.length - 1];
                let next = Math.floor(Math.random() * PHONE_PICS.length);
                while (next === currentFront){
                    next = Math.floor(Math.random() * PHONE_PICS.length);
                }
                return [...prev.filter((i) => i !== next), next];
            });
        },3000);
        return () => clearInterval(interval);
    }, []);

    //switching animation
    useEffect(() => {
        order.forEach((imgIndex, rank) => {
            const el = cardRefs.current[imgIndex];
            if (!el) return;
            const base = BASE_TRANSFORMS[imgIndex];
            const isFront = rank === order.length -1;

            animate(el, {
                translateX: base.x,
                translateY: base.y,
                rotate: base.rotate,
                scale: isFront ? 1.08 : 1,
                duration: 700,
                easing: "easeOutQuad",
            });
            el.style.zIndex = String(rank);
        });
    }, [order]);

    //Mouse moving/Pictures tilting
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;

        animate(container, {
            rotateY: relX * 15,
            rotateX: relY * -15,
            duration: 400,
            easing: "easeOutQuad",
        });
    };

    const handleMouseLeave = () => {
        if (!containerRef.current) return;
        animate(containerRef.current, {
            rotateY: 0,
            rotateX: 0,
            duration: 600,
            easing: "easeOutElastic(1, .6)",
        });
    };

    return (
        <div
        ref = {containerRef}
        onMouseMove = {handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full max-w-md h-[520px] [perspective:1000px]"
        >
            {PHONE_PICS.map((src, i) => (
                <div
                key = {src}
                ref = {(el) => {cardRefs.current[i] = el;}}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 md:w-72"
                >
                <img
                src = {src}
                alt = {`Driving Tracker screenshot ${i+1}`}
                className="w-full h-auto rounded-2xl shadow-2xl border border-[var(--color-border)]"
                />
                </div>
            ))}
        </div>
    );
}