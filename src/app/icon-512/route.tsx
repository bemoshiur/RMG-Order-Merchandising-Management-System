import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#d32f2f,#f0663f)",
          color: "#fff",
          fontSize: 180,
          fontWeight: 700,
          letterSpacing: -8,
          fontFamily: "monospace",
        }}
      >
        {BRAND.badge}
      </div>
    ),
    { width: 512, height: 512 },
  );
}
