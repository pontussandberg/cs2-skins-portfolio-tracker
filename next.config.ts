import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle in .next/standalone, easy to copy to the Raspberry Pi.
  output: "standalone",
  // The GraphQL route reads schema.graphql from disk; make sure standalone output ships it.
  outputFileTracingIncludes: {
    "/api/graphql": ["./schema.graphql"],
  },
  // Keep pino as a plain Node dependency instead of bundling it.
  serverExternalPackages: ["pino", "thread-stream"],
  // SWC transform for styled-components: SSR-safe class names and readable names in dev.
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
