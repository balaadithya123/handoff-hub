/**
 * Axon mark — two nodes joined by a link. Flat, simple, monochrome.
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
      <rect width="32" height="32" rx="9" fill="#141414" />
      <circle cx="11" cy="16" r="3.1" fill="#f6f5f2" />
      <circle cx="21" cy="16" r="3.1" fill="#f6f5f2" />
      <path d="M14 16h4" stroke="#f6f5f2" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
