"use client";
import {useState} from "react";
import Link from "next/link";
import Image from "next/image";
import {BASE_PATH} from "@/lib/basePath";

const FEATURES = [
  {label: "Smart Driving Tracker", href: "#key-features"},
  {label: "OBD-II Vehicle Diagnostics", href: "#key-features"},
  {label: "Eco-Driving & Fuel Efficiency", href: "#key-features"},
  {label: "Safety Monitoring", href: "#key-features"},
  {label: "Trusted Contacts Safety", href: "#key-features"},
  {label: "Challenges & Rankings", href: "#key-features"},
];

export default function Navbar() {

  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return(

    <nav className = "flex items-center px-6 py-4 h-[var(--navbar-height)] sticky top-0 z-50 hero-gradient">
      <Link href = "/" className = "text-2xl md:text-3xl tracking-tight font-semibold">
        <span className = "text-[var(--color-primary)]">Driving </span>
        <span className = "text-[var(--color-text)]">Tracker</span>
      </Link>

    {/*Links*/}
    <div className = "hidden md:flex flex-1 justify-end items-center gap-16 mr-8">
      {/*dropdown menu of the features*/}
      <div className = "relative"
      onMouseEnter = {() => setFeaturesOpen(true)}
      onMouseLeave= {() => setFeaturesOpen(false)}>
        <button type = "button" className = "rounded-full bg-[var(--color-bg)] px-5 py-2 text-[var(--color-primary)] font-semibold hover:bg-[var(--color-secondary)] transition-colors duration-200 border-[var(--color-primary)]">
          Features
        </button>
        {featuresOpen && (
          <div className = "absolute top-full left-0 flex flex-col py-2 w-64 bg-white border border-[var(--color-border)] rounded-lg shadow-lg">
            {FEATURES.map((feature) => (
              <a key = {feature.label} href = {feature.href} className = "px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)] transition-colors">
                {feature.label}
              </a>
            ))}
            </div>
        )}
      </div>
      <Link href = "/help" className = "relative rounded-full bg-[var(--color-bg)] px-5 py-2 text-[var(--color-primary)] font-semibold hover:bg-[var(--color-secondary)] transition-colors duration-200 border-[var(--color-primary)]">
      Help
      <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[var(--color-secondary)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"/>
      </Link>
      <a href = "#download" className = "relative rounded-full bg-[var(--color-secondary)] px-5 py-2 text-[var(--color-bg)] font-semibold hover:bg-[var(--color-primary)] transition-colors duration-200">
        Download
        <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[var(--color-secondary)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"/>
      </a>
    </div>

    {/* Mobile menu to account for devices since we are android */}
    <div className = "flex items-center gap-4">
      <button type = "button"
      className = "md:hidden absolute top-full left-0 w-full flex flex-col px-6 py-4 bg-white border-t border-[var(--color-border)] shadow-lg gap-2"
      onClick = {() => setMobileMenuOpen((prev) => !prev)}
      aria-label = "Toggle menu"
      >
        {mobileMenuOpen ? "Close" : "Menu"}
      </button>
      <Image
       src = {`${BASE_PATH}/images/screen1.png`} 
       alt = "Driving Tracker Logo" 
       width={56}
       height={56}
       className="h-14 w-14 rounded-full"/>
    </div>

    </nav>

  );
}

