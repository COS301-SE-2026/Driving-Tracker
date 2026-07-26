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

    <nav className = "flex items-center justify-between px-6 py-4">
      <Link href = "/" className = "text-xl font-semibold">
        driving tracker
      </Link>

    {/*Links*/}
    <div className = "hidden md:flex items-center gap-8">
      {/*dropdown menu of the features*/}
      <div className = "relative"
      onMouseEnter = {() => setFeaturesOpen(true)}
      onMouseLeave= {() => setFeaturesOpen(false)}>
        <button className = "flex items-center gap-1">
          Features
        </button>
        {featuresOpen && (
          <div className = "absolute top-full left-0 flex flex-col py-2 w-56">
            {FEATURES.map((feature) => (
              <a key = {feature.label} href = {feature.href} className = "px-4 py-2">
                {feature.label}
              </a>
            ))}
            </div>
        )}
      </div>
      <Link href = "/help">Help</Link>
      <a href = "#download">Download</a>
    </div>

    {/* Mobile menu to account for devices since we are android */}
    <button className = "md:hidden"
    onClick = {() => setMobileMenuOpen((prev) => !prev)}
    aria-label = "Toggle menu"
    >
      {mobileMenuOpen ? "Close" : "Menu"}
    </button>

    {mobileMenuOpen && (
      <div className = "md:hidden absolute top-full left-0 w-full flex flex-col px-6 py-4">
        {FEATURES.map((feature) => (
          <a key = {feature.label} href = {feature.href} className = "py-2">
            {feature.label}
          </a>
        ))}
        <Link href = "/help">Help</Link>
        <a href = "#download">Download</a>
      </div>
    )}

    {/* Logo */}
    <div>
    <img src = "/logo.png" alt = "Driving Tracker Logo" className = "profile-img" />
    </div>

    </nav>

  );
}

