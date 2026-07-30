//landing page
"use client"

import { useState } from "react";
import Navbar from "@/components/Navbar";
import DrivingTracker from "@/components/DrivingTracker";
import KeyFeatures from "@/components/KeyFeatures";
import Solutions from "@/components/Solutions";
import Footer from "@/components/Footer";
import Welcome from "@/components/Welcome";

export default function Home() {

  const [showWelcome, setShowWelcome] = useState(true);

  if (showWelcome) {
    return <Welcome onFinish={() => setShowWelcome(false)} />;
  }

  return(
  <>
    <Navbar/>
    <DrivingTracker/>
    <KeyFeatures/>
    <Solutions/>
    <Footer/>
  </>
  );
}
