/**
 * Axon mark — linked nodes. Clean 2D, works at 16–48px.
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
      aria-label="Axon"
    >
      <rect width="32" height="32" rx="8" fill="#0f0f0f" />
      <circle cx="10.5" cy="16" r="4" fill="#f6f5f2" />
      <circle cx="21.5" cy="16" r="4" fill="#f6f5f2" />
      <path d="M14.5 16h3" stroke="#f6f5f2" strokeWidth="2.25" strokeLinecap="round" />
      <circle cx="21.5" cy="16" r="5.75" stroke="#f6f5f2" strokeWidth="1.15" opacity="0.35" />
    </svg>
  );
}
