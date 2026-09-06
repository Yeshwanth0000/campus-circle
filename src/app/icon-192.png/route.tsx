import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  const size = 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4f46e5",
          borderRadius: size * 0.22,
          fontSize: size * 0.46,
          fontWeight: 800,
          color: "white",
          fontFamily: "sans-serif",
          letterSpacing: -2,
        }}
      >
        CC
      </div>
    ),
    { width: size, height: size }
  );
}
