import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas-off-white px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm uppercase tracking-wide text-on-surface-variant font-medium mb-3">
          404_NOT_FOUND
        </p>
        <h1 className="text-4xl font-medium text-ink-black tracking-tight mb-2">
          Page not found
        </h1>
        <p className="text-lg text-on-surface-variant mb-8">
          The dashboard route you requested does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-ink-black px-8 py-3 text-base font-medium text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
