// frontend/app/icon.tsx
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000800",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #00ff88",
            borderRadius: 4,
            color: "#00ff88",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "monospace",
          }}
        >
          A
        </div>
      </div>
    ),
    size
  );
}