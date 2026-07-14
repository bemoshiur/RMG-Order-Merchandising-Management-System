import type { MetadataRoute } from "next";
import { BRAND, BRAND_FULL } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_FULL,
    short_name: BRAND.mark,
    description: `Order & merchandising management — ${BRAND_FULL}`,
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f9",
    theme_color: "#d32f2f",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
