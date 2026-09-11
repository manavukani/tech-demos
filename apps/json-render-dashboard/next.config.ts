import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The monorepo root AGENTS.md is the source of truth; don't generate per-app copies.
  agentRules: false,
};

export default nextConfig;
