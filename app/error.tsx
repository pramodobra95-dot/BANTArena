"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x py-24 text-center">
      <p className="text-6xl">⚠️</p>
      <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-slate-600">Please try again in a moment.</p>
      <button onClick={reset} className="btn-primary mt-6">Retry</button>
    </div>
  );
}
