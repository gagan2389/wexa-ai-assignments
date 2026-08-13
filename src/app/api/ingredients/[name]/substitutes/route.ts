import { NextRequest, NextResponse } from "next/server";
import { ingredientSubstituteNeighborhood } from "@/lib/queries";
import { handleApiError } from "@/lib/apiError";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  try {
    const neighborhood = await ingredientSubstituteNeighborhood(decodeURIComponent(name));
    return NextResponse.json(neighborhood);
  } catch (err) {
    return handleApiError(err);
  }
}
