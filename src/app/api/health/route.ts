import { NextResponse } from "next/server";
import { checkConnectivity } from "@/lib/neo4j";

export async function GET() {
  const connected = await checkConnectivity();
  return NextResponse.json({ connected }, { status: connected ? 200 : 503 });
}
