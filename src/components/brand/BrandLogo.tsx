import { APP_NAME } from "@/lib/brand";

// App mark: two overlapping speech bubbles on an indigo tile.
export function BrandMark({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="brand-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#brand-grad)" />
      <path
        d="M11 13.5A3.5 3.5 0 0 1 14.5 10h9a3.5 3.5 0 0 1 3.5 3.5v5a3.5 3.5 0 0 1-3.5 3.5H17l-4 3.2V22a3.5 3.5 0 0 1-2-3.2z"
        fill="#fff"
      />
      <path
        d="M29 17.2a3.5 3.5 0 0 1 1 2.5v4.8a3.5 3.5 0 0 1-2 3.2v3.1l-3.8-3H19a3.5 3.5 0 0 1-2.9-1.5"
        fill="none"
        stroke="#fff"
        strokeOpacity=".75"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BrandLogo({
  className = "",
  markClassName = "w-9 h-9",
  textClassName = "text-lg",
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <BrandMark className={markClassName} />
      <span className={`font-semibold tracking-tight text-[#e8eaf0] ${textClassName}`}>{APP_NAME}</span>
    </div>
  );
}
