import { NextResponse } from "next/server";
import { resetStore } from "@/lib/store";

export async function POST() {
  const store = await resetStore();
  return NextResponse.json({
    ok: true,
    counts: {
      offers: store.offers.length,
      campaigns: store.campaigns.length,
      rules: store.rules.length,
    },
  });
}
