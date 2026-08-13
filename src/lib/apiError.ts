import { NextResponse } from "next/server";
import { DbConfigError, DbConnectionError } from "./neo4j";

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof DbConfigError) {
    return NextResponse.json({ error: "config", message: err.message }, { status: 500 });
  }
  if (err instanceof DbConnectionError) {
    console.error(err.message, err.cause);
    return NextResponse.json({ error: "db_unreachable", message: err.message }, { status: 503 });
  }
  console.error(err);
  return NextResponse.json({ error: "unknown", message: "Something went wrong." }, { status: 500 });
}
