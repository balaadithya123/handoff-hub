/**
 * Handoff Hub mark — simple geometric H.
 * Two vertical bars joined by a crossbar. Flat, monochrome, no gradients.
 */
export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Handoff Hub"
    >
      <rect width="32" height="32" rx="8" fill="#171717" stroke="rgba(255,255,255,0.12)" />
      <path
        d="M10 8v16M22 8v16M10 16h12"
        stroke="#fafafa"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
