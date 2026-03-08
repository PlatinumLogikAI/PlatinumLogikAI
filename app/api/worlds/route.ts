import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";

const worldSchema = z.object({
  name: z.string().min(1),
  palette: z.string().min(1),
  era: z.string().min(1),
  themes: z.string().min(1),
  styleNotes: z.string().optional()
});

export async function GET() {
  return NextResponse.json(store.listWorlds());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = worldSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid world payload.", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  return NextResponse.json(store.upsertWorld(parsed.data));
}
