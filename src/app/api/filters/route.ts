import { NextResponse } from "next/server";
import { listCuisines, listDietTags } from "@/lib/queries";
import { handleApiError } from "@/lib/apiError";

export async function GET() {
  try {
    const [cuisines, dietTags] = await Promise.all([listCuisines(), listDietTags()]);
    return NextResponse.json({ cuisines, dietTags });
  } catch (err) {
    return handleApiError(err);
  }
}
