"use client";
import * as React from "react";
import { safeTrim } from "@/lib/strings";

type AvatarProps = {
  name: string;               // for initials fallback
  src?: string | null;        // original Google photo URL, e.g. ...=s96-c
  size?: number;              // px
  className?: string;
  alt?: string;
};

function initialsFromName(name: string) {
  const parts = safeTrim(name, '').split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "•";
}

export default function Avatar({ name, src, size = 40, className = "", alt }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const [attempts, setAttempts] = React.useState(0);
  const [loading, setLoading] = React.useState(!!src);
  const maxAttempts = 2; // initial + one retry

  // Build proxied URL only once
  const proxied = React.useMemo(() => {
    if (!src) return null;
    try {
      // Preserve size hint if present
      const u = new URL(src);
      return `/api/avatar?url=${encodeURIComponent(u.toString())}`;
    } catch {
      return null;
    }
  }, [src]);

  const style: React.CSSProperties = { width: size, height: size, minWidth: size, minHeight: size };

  const handleError = () => {
    if (attempts + 1 < maxAttempts) {
      setAttempts(a => a + 1);
      // small backoff before re-trying by updating a cache-busting param
      setTimeout(() => {
        setLoading(true);
      }, 500 + Math.random() * 500);
    } else {
      setFailed(true);
      setLoading(false);
    }
  };

  // force a one-time retry by toggling key param when attempts increases
  const srcWithKey = proxied ? `${proxied}${proxied.includes("?") ? "&" : "?"}k=${attempts}` : null;

  if (!proxied || failed) {
    // Fallback: initials badge with stable box
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-medium ${className}`}
        style={style}
        aria-label={alt ?? name}
        title={name}
      >
        {initialsFromName(name)}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-full ${className}`} style={style}>
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-gray-100" aria-hidden="true" />
      )}
      {/* Prefer native img for tight control; swap to next/image if desired */}
      <img
        src={srcWithKey!}
        alt={alt ?? name}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        decoding="async"
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={handleError}
        style={{ width: size, height: size, objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
