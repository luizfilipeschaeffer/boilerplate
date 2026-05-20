import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@boilerplate/shared",
    "@boilerplate/module-registry",
    "@boilerplate/db",
    "@boilerplate/fiscal-engine",
    "@boilerplate/integrators",
    "@boilerplate/billing",
    "@boilerplate/aprendiz-engine",
  ],
};

export default nextConfig;
