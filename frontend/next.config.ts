import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Driving-Tracker",
  assetPrefix: "/Driving-Tracker/",

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
