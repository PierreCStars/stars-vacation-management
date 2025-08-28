"use client";
export default function GlobalRootError({ error }: { error: Error }) {
  console.error("GlobalRootError:", error);
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>App crashed</h1>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
        {error?.message}
      </pre>
    </div>
  );
}
