import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same mark as icon.svg: the orange square on a #0D0F12 rounded square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg
        width={180}
        height={180}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={32} height={32} rx={6} fill="#0D0F12" />
        <rect x={11} y={11} width={10} height={10} fill="#FF4D12" />
      </svg>
    ),
    { ...size }
  );
}
