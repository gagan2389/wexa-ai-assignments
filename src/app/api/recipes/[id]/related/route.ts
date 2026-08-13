import { NextRequest, NextResponse } from "next/server";
import { relatedRecipes } from "@/lib/queries";
import { handleApiError } from "@/lib/apiError";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const related = await relatedRecipes(id);
    return NextResponse.json({ related });
  } catch (err) {
    return handleApiError(err);
  }
}
