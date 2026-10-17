import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,#1a3324_0%,transparent_55%),radial-gradient(ellipse_70%_50%_at_90%_20%,#243018_0%,transparent_50%),linear-gradient(180deg,#0b1210_0%,#0e1612_100%)]" />
      <div className="hero-grid pointer-events-none absolute inset-0" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-[family-name:var(--font-syne)] text-sm font-bold tracking-[0.22em] text-lime">
          FOURS
        </span>
        <Link
          href="/dashboard"
          className="font-mono text-xs tracking-wide text-fog transition-colors hover:text-paper"
        >
          Open desk →
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-12 px-6 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div>
          <p className="animate-rise font-[family-name:var(--font-syne)] text-5xl font-extrabold leading-[0.92] tracking-tight text-paper sm:text-6xl md:text-7xl">
            FOURS
          </p>
          <h1 className="animate-rise-delay mt-6 max-w-xl font-[family-name:var(--font-syne)] text-2xl font-semibold leading-tight text-paper/95 sm:text-3xl">
            Media buying that kills losers before they kill your margin.
          </h1>
          <p className="animate-rise-delay-2 mt-5 max-w-md text-base leading-relaxed text-fog">
            Connect offers, watch CPA and ROI in real time, and let rules pause,
            cut, or scale campaigns across Meta, Google, and TikTok.
          </p>
          <div className="animate-rise-delay-2 mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-lime px-5 py-3 font-[family-name:var(--font-syne)] text-sm font-bold tracking-wide text-ink transition-transform hover:translate-y-[-1px]"
            >
              Launch buying desk
            </Link>
            <a
              href="#how"
              className="font-mono text-xs tracking-wide text-fog underline-offset-4 hover:text-paper hover:underline"
            >
              How automation works
            </a>
          </div>
        </div>

        <div
          aria-hidden
          className="animate-rise-delay relative min-h-[320px] w-full self-stretch lg:min-h-[420px]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,color-mix(in_oklab,var(--lime)_6%,transparent)_40%,transparent_70%)]" />
          <div className="absolute inset-y-8 left-0 right-4 flex flex-col justify-center gap-3 sm:right-0">
            {[
              { label: "LeanPath Broad", w: "92%", tone: "good", value: "+61% ROI" },
              { label: "CreditBoost Search", w: "74%", tone: "good", value: "+38% ROI" },
              { label: "SparkMatch Spark", w: "68%", tone: "warn", value: "+12% ROI" },
              { label: "LeanPath LAL 1%", w: "41%", tone: "danger", value: "−34% ROI" },
            ].map((row, i) => (
              <div key={row.label} className="hero-bars" style={{ ["--i" as string]: i }}>
                <div className="mb-1 flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
                  <span>{row.label}</span>
                  <span
                    className={
                      row.tone === "good"
                        ? "text-good"
                        : row.tone === "warn"
                          ? "text-warn"
                          : "text-danger"
                    }
                  >
                    {row.value}
                  </span>
                </div>
                <span
                  className={`h-3 ${
                    row.tone === "good"
                      ? "bg-lime"
                      : row.tone === "warn"
                        ? "bg-warn"
                        : "bg-danger"
                  }`}
                  style={{ width: row.w }}
                />
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 left-0 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-lime" />
            Live rule pressure · last 24h
          </div>
        </div>
      </section>

      <section id="how" className="relative z-10 border-t border-ink-line bg-ink-elevated">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          {[
            {
              title: "Ingest",
              body: "Offers, campaigns, spend, and S2S postbacks land in one desk — no spreadsheet stitching.",
            },
            {
              title: "Evaluate",
              body: "Rules watch CPA, ROI, spend, and EPC over a lookback window with cooldowns and min-spend guards.",
            },
            {
              title: "Act",
              body: "Pause bleeders, cut budgets, or scale winners — then sync status back to the ad platform adapter.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-lime">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-fog">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
