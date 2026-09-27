import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "ture";

const nextConfig: NextConfig = {
  output: isStaticExport? "export" : undefined,

  basePath: isProd && isStaticExport ? "/Driving-Tracker" : "", 

  assetPrefix: isProd && isStaticExport? "/Driving-Tracker/" : "",

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
