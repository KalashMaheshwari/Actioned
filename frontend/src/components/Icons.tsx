import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Custom Handcrafted Icons for Actioned
 * Distinctive, architectural, bespoke geometric glyphs replacing generic Lucide icons.
 */

// 1. Ingestion / Autonomous Meeting Agent: Acoustic Neural Aperture
export function IngestApertureIcon({ className = "w-5 h-5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.18" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      <path d="M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12" strokeOpacity="0.4" />
      <circle cx="12" cy="12" r="8" strokeDasharray="3 3" strokeOpacity="0.6" />
    </svg>
  );
}

// 2. Decision Memory: Crystalline Vector Nexus Matrix
export function VectorNexusIcon({ className = "w-5 h-5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" fill="currentColor" fillOpacity="0.12" />
      <polyline points="12 22 12 12 21 7" />
      <line x1="3" y1="7" x2="12" y2="12" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

// 3. Team Digest: Constellation Synthesis Cluster
export function SynergyClusterIcon({ className = "w-5 h-5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="6" r="2.5" fill="currentColor" fillOpacity="0.2" />
      <circle cx="6" cy="17" r="2.5" fill="currentColor" fillOpacity="0.2" />
      <circle cx="18" cy="17" r="2.5" fill="currentColor" fillOpacity="0.2" />
      <path d="M12 8.5v3m-3.5 3.5l2-1.5m3 0l2 1.5" strokeDasharray="2 2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
    </svg>
  );
}

// 4. Optical Search Reticle
export function SearchReticleIcon({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M11 8v1m0 4v1m-3-3h1m4 0h1" strokeOpacity="0.6" />
      <line x1="16.5" y1="16.5" x2="21.5" y2="21.5" strokeWidth="2.2" />
    </svg>
  );
}

// 5. Soundwave Spectrum (Whisper Audio)
export function AcousticWaveIcon({ className = "w-5 h-5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      {...props}
    >
      <line x1="4" y1="10" x2="4" y2="14" />
      <line x1="8" y1="6" x2="8" y2="18" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="16" y1="7" x2="16" y2="17" />
      <line x1="20" y1="11" x2="20" y2="13" />
    </svg>
  );
}

// 6. Timeline Chronometer (Relative Deadlines)
export function ChronoGaugeIcon({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="13" r="8" fill="currentColor" fillOpacity="0.1" />
      <path d="M12 9v4l3 2" />
      <path d="M12 2v3m-3-3h6" />
    </svg>
  );
}

// 7. Contradiction Prism (Semantic Conflict Detected)
export function ConflictPrismIcon({ className = "w-5 h-5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 3l9 16H3L12 3z" fill="currentColor" fillOpacity="0.15" />
      <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2.2" />
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
