import { NextRequest, NextResponse } from "next/server";
import { getRecipeDetail } from "@/lib/queries";
import { handleApiError } from "@/lib/apiError";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const recipe = await getRecipeDetail(id);
    if (!recipe) {
      return NextResponse.json({ error: "not_found", message: "Recipe not found." }, { status: 404 });
    }
    return NextResponse.json({ recipe });
  } catch (err) {
    return handleApiError(err);
  }
}
