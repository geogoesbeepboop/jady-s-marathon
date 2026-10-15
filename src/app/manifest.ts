import type { MetadataRoute } from "next";

// Lets guests add the site to their home screen. "/" forwards a joined phone to its event.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Weekend plans",
    short_name: "Weekend",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#faf8f5",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
