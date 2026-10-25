import type { NextConfig } from "next";

// Static export: the dashboard reads QIE directly from the browser (the RPC allows CORS),
// so it can be hosted anywhere as plain files.
const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default config;
