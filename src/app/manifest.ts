import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusResolve",
    short_name: "CampusResolve",
    description: "College hostel complaint, maintenance and escalation management",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#002147",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
