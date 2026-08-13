import { NextRequest, NextResponse } from "next/server";
import { pantryMatch } from "@/lib/queries";
import { handleApiError } from "@/lib/apiError";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const ingredients = body?.ingredients;
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "bad_request", message: "Provide a non-empty `ingredients` array." },
        { status: 400 }
      );
    }
    const cleaned = ingredients.filter((i): i is string => typeof i === "string" && i.trim().length > 0);
    const matches = await pantryMatch(cleaned);
    return NextResponse.json({ matches });
  } catch (err) {
    return handleApiError(err);
  }
}
