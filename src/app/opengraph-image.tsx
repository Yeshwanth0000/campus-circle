import { ImageResponse } from "next/og";

// Individual listings deliberately have no share card: they're RLS-scoped to
// the viewer's college, so a preview bot with no session can't see them (see
// the note in listings/[id]/generateMetadata). What people actually share for
// a college-private marketplace is the invite link, so that's what this card
// is for.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "CampusBin — buy and sell with verified students on your own campus";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4f46e5 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, opacity: 0.75, letterSpacing: "0.06em" }}>
          CAMPUSBIN
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 28,
            letterSpacing: "-0.02em",
          }}
        >
          Buy and sell,
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1.05,
            color: "#a5b4fc",
            letterSpacing: "-0.02em",
          }}
        >
          campus to campus.
        </div>
        <div style={{ display: "flex", fontSize: 36, opacity: 0.8, marginTop: 36 }}>
          Verified by your college email. Private to your campus.
        </div>
      </div>
    ),
    size
  );
}
