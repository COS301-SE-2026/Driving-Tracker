"use client";
import { useEffect, useRef, useState} from "react";
import {animate} from "animejs";

const PHONE_PICS = [
    {src: "/images/phone-4.png", base: {x: -90, y: 20, rotate: -10}, z:10},
    {src: "/images/phone-1.png", base: {x: 70, y: 10, rotate: 8}, z:20},
    {src: "/images/phone-5.png", base: {x: 0, y: -100, rotate: 0}, z:30},
];


export default function PhoneAnimation(){

    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;

        PHONE_PICS.forEach((phone, i) => {

            const el = cardRefs.current[i];
            if (!el) return;

            //tilting
            animate(el, {
                translateX: phone.base.x + relX * 20,
                translateY: phone.base.y + relY * 15,
                rotate: phone.base.rotate + relX * 6,
                duration: 400,
                easing: "easeOutQuad",

            });
        });
    };

    const handleMouseLeave = () => {

        PHONE_PICS.forEach((phone, i) => {

            const el = cardRefs.current[i];

            if (!el) return;

            animate(el, {
                translateX: phone.base.x,
                translateY: phone.base.y,
                rotate: phone.base.rotate,
                duration: 600,
                easing: "easeOutElastic(1, .6)",

            });
        });
    };


    return (

        <div

        ref = {containerRef}
        onMouseMove = {handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full max-w-md h-[520px] [perspective:1000px]"
        >
            {PHONE_PICS.map((phone, i) => (

                <div
                key = {phone.src}
                ref = {(el) => {cardRefs.current[i] = el;}}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 md:w-48"
                style = {{
                    zIndex: phone.z,
                    transform: `translate(${phone.base.x}px, ${phone.base.y}px) rotate(${phone.base.rotate}deg)`
                }}
                >

                <img
                src = {phone.src}
                alt = "Driving Tracker app screenshot"
                className="w-full h-auto rounded-2xl shadow-2xl"
                />

                </div>
            ))}
        </div>
    );
}

