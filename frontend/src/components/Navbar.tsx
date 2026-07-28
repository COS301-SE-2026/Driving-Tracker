"use client";
import {useState} from "react";
import Link from "next/link";

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

    <nav className = "flex items-center justify-between px-6 py-4 h-[var(--navbar-height)] sticky top-0 z-50 hero-gradient">
      <Link href = "/" className = "text-2xl md:text-3xl tracking-tight font-semibold">
        <span className = "text-[var(--color-text)]">Driving </span>
        <span className = "text-[var(--color-primary)]">Tracker</span>
      </Link>

    {/*Links*/}
    <div className = "hidden md:flex items-center gap-10 md:gap-12">
      {/*dropdown menu of the features*/}
      <div className = "relative"
      onMouseEnter = {() => setFeaturesOpen(true)}
      onMouseLeave= {() => setFeaturesOpen(false)}>
        <button type = "button" className = "flex items-center gap-1 font-medium font-semibold text-base text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
          Features
          <span className = {`text-xs transition-transform ${featuresOpen ? "rotate-180" : ""}`}>˅</span>
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
      <Link href = "/help" className = "font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">Help</Link>
      <a href = "#download" className = "font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">Download</a>
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
      <img src = "/images/Logo.png" alt = "Driving Tracker Logo" className="h-20 w-20 rounded-full border border-[var(--color-border)]"/>
    </div>

    </nav>

  );
}

