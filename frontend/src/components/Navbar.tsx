"use client";
import {useState} from "react";
import Link from "next/link";
import Image from "next/image";
import {BASE_PATH} from "@/lib/basePath";

const APK_URL = "https://github.com/COS301-SE-2026/Driving-Tracker/releases/latest/download/Driving-Tracker.apk";

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

    <nav className="relative sticky top-0 z-50 flex min-h-[var(--navbar-height)] items-center justify-between px-4 py-3 sm:px-6 hero-gradient">
      <Link href = "/" className = "text-2xl md:text-3xl tracking-tight font-semibold">
        <span className = "text-[var(--color-primary)]">Driving </span>
        <span className = "text-[var(--color-text)]">Tracker</span>
      </Link>

    {/*Links*/}
    <div className="hidden flex-1 items-center justify-end gap-6 lg:gap-10 md:flex">
      {/*dropdown menu of the features*/}
      <div className = "relative"
      onMouseEnter = {() => setFeaturesOpen(true)}
      onMouseLeave= {() => setFeaturesOpen(false)}>
        <button
          type="button"
          className="rounded-full bg-[var(--color-bg)] px-5 py-2 font-semibold text-[var(--color-primary)] transition-colors duration-200 hover:bg-[var(--color-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tertiary)]"
          aria-haspopup="menu"
          aria-expanded={featuresOpen}
          onClick={() => setFeaturesOpen((open) => !open)}
        >
          Features
        </button>
        {featuresOpen && (
          <div
            className="absolute left-0 top-full z-50 mt-2 flex w-64 flex-col rounded-lg border border-[var(--color-border)] bg-white py-2 shadow-lg"
            role="menu"
          >
            {FEATURES.map((feature) => (
              <a
                key={feature.label}
                href={feature.href}
                role="menuitem"
                onClick={() => setFeaturesOpen(false)}
                className="px-4 py-3 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)] focus-visible:bg-[var(--color-bg)] focus-visible:text-[var(--color-primary)] focus-visible:outline-none"
              >
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

      <Link href = "/style-guide" className = "relative rounded-full bg-[var(--color-bg)] px-5 py-2 text-[var(--color-primary)] font-semibold hover:bg-[var(--color-secondary)] transition-colors duration-200 border-[var(--color-primary)]">
      Style Guide
      <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[var(--color-secondary)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"/>
      </Link>

      <Link href = "/login" className = "relative rounded-full bg-[var(--color-bg)] px-5 py-2 text-[var(--color-primary)] font-semibold hover:bg-[var(--color-secondary)] transition-colors duration-200 border-[var(--color-primary)]">
      Fleet Dashboard
      <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[var(--color-secondary)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"/>
      </Link>

      <a href = {APK_URL} download className = "relative rounded-full bg-[var(--color-secondary)] px-5 py-2 text-[var(--color-bg)] font-semibold hover:bg-[var(--color-primary)] transition-colors duration-200">
        Download
        <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[var(--color-secondary)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"/>
      </a>
    </div>

    {/* Mobile menu to account for devices since we are android */}
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="rounded-lg p-2 text-[var(--color-text)] transition-colors hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tertiary)] md:hidden"
        onClick={() => setMobileMenuOpen((open) => !open)}
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-navigation"
      >
        <span aria-hidden="true" className="text-2xl leading-none">
          {mobileMenuOpen ? "×" : "☰"}
        </span>
      </button>
      <Image
       src = {`${BASE_PATH}/images/screen1.png`} 
       alt = "Driving Tracker Logo" 
       width={56}
       height={56}
       className="h-14 w-14 rounded-full"/>
    </div>

    {mobileMenuOpen && (
      <div
        id="mobile-navigation"
        className="absolute left-0 top-full w-full border-t border-[var(--color-border)] bg-white p-4 shadow-lg md:hidden"
      >
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              document
                .getElementById("key-features")
                ?.scrollIntoView({ behavior: "smooth" });
              setMobileMenuOpen(false);
            }}
            className="rounded-lg px-4 py-3 text-left font-semibold text-[var(--color-primary)] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tertiary)]"
          >
            Features
          </button>

          <Link
            href="/help"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg px-4 py-3 font-semibold text-[var(--color-primary)] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tertiary)]"
          >
            Help
          </Link>

          <Link
            href="/style-guide"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg px-4 py-3 font-semibold text-[var(--color-primary)] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tertiary)]"
          >
            Style Guide
          </Link>

          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg px-4 py-3 font-semibold text-[var(--color-primary)] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tertiary)]"
          >
            Fleet Dashboard
          </Link>

          <a
            href={APK_URL}
            download
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg bg-[var(--color-secondary)] px-4 py-3 font-semibold text-white hover:bg-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tertiary)]"
          >
            Download
          </a>
        </div>
      </div>
    )}

    </nav>

  );
}

