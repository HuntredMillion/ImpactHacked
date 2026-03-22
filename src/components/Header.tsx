export default function Header() {
  return (
    <header className="border-b border-slate-700/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-primary-blue">PostHog</span>
          <span className="text-deep-orange"> Impact</span>
        </h1>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
          Last 90 days
        </span>
      </div>
    </header>
  );
}
