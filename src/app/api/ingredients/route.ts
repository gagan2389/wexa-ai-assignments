import { NextRequest, NextResponse } from "next/server";
import { searchIngredientNames } from "@/lib/queries";
import { handleApiError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  try {
    const ingredients = q.trim().length > 0 ? await searchIngredientNames(q) : [];
    return NextResponse.json({ ingredients });
  } catch (err) {
    return handleApiError(err);
  }
}
