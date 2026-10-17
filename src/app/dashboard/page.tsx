import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { BuyingDesk } from "@/components/BuyingDesk";
import { getOverview } from "@/lib/overview";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-ink">
      <header className="border-b border-ink-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-[family-name:var(--font-syne)] text-sm font-bold tracking-[0.22em] text-lime"
            >
              FOURS
            </Link>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-fog sm:inline">
              Buying desk
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-lime" />
            Automation armed
          </div>
        </div>
      </header>
      <Suspense
        fallback={
          <p className="px-6 py-12 font-mono text-sm text-fog">Loading desk…</p>
        }
      >
        <DeskLoader />
      </Suspense>
    </main>
  );
}

async function DeskLoader() {
  await connection();
  const initialData = getOverview();
  return <BuyingDesk initialData={initialData} />;
}
