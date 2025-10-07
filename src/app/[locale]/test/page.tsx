export default function TestPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-red-600 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Test Page</h1>
        <p className="text-xl">This is the localized test page</p>
        <p className="text-sm mt-4">Time: {new Date().toISOString()}</p>
      </div>
    </main>
  );
}
