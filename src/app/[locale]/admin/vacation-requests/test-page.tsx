export default function TestPage() {
  return (
    <div>
      <div 
        className="fixed top-4 left-4 z-[9999] px-4 py-2 rounded bg-red-600 text-white text-sm font-bold border-2 border-yellow-400"
        style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 9999 }}
      >
        🧪 TEST PAGE RENDERED
      </div>
      <h1>Test Page</h1>
      <p>This is a simple test page to verify rendering works.</p>
    </div>
  );
}
