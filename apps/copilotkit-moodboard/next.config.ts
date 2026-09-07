import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The monorepo has its own AGENTS.md; don't let `next dev` generate per-app copies.
  agentRules: false,
};

export default nextConfig;
