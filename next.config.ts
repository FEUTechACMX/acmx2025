import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` output is for self-hosting (Docker/VPS). On Vercel it breaks the
  // build's file-tracing step (next-server.js.nft.json ENOENT) and Vercel packages
  // output itself — so apply standalone only when NOT building on Vercel.
  output: process.env.VERCEL ? undefined : "standalone",

  images: {
    /**
     * Every uploaded asset — event covers, merch photos, officer portraits —
     * lives in a public Supabase Storage bucket, so `next/image` has to be told
     * the origin is allowed before it will optimise anything from there
     * (CLEANUP.md §8.4). Without this the components had no option but a bare
     * `<img>`, which shipped each card the full-resolution upload.
     *
     * Scoped to the hostname pattern rather than one project ref so a restored
     * or migrated Supabase project doesn't silently break every image. The
     * bucket contents are already public; this grants no read access that a
     * browser did not have.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
