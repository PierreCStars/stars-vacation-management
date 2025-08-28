"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  console.error("GlobalError:", error);
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Something went wrong</h1>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
        {error?.message}
      </pre>
      <button onClick={() => reset()} style={{ padding: "8px 12px" }}>Try again</button>
    </div>
  );
}
