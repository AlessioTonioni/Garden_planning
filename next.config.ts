import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Produces a self-contained build in .next/standalone — copy this folder
    // to the Pi instead of the full repo (no node_modules needed on the device).
    output: "standalone",

    // The photo route resolves paths from DATABASE_URL, so file tracing would
    // copy the local data/ dir (photos, DB) into the standalone build.
    outputFileTracingExcludes: {
        "*": ["./data/**/*"],
    },

    experimental: {
        // Tree-shake icon libraries so only used icons are bundled
        optimizePackageImports: ["lucide-react"],
    },
};

export default nextConfig;
