import { NextRequest, NextResponse } from "next/server";
import { substitutionPath } from "@/lib/queries";
import { handleApiError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json(
      { error: "bad_request", message: "Provide both `from` and `to` query params." },
      { status: 400 }
    );
  }
  try {
    const result = await substitutionPath(from, to);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
