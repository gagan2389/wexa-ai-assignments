import { NextRequest, NextResponse } from "next/server";
import { listRecipes } from "@/lib/queries";
import { handleApiError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  try {
    const recipes = await listRecipes({
      search: searchParams.get("search") ?? undefined,
      cuisine: searchParams.get("cuisine") ?? undefined,
      dietTag: searchParams.get("dietTag") ?? undefined,
    });
    return NextResponse.json({ recipes });
  } catch (err) {
    return handleApiError(err);
  }
}
