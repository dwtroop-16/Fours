import { NextResponse } from "next/server";
import { getOverview } from "@/lib/overview";

export async function GET() {
  return NextResponse.json(getOverview());
}
