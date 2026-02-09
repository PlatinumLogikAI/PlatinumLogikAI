import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const worldSchema = z.object({
  name: z.string().min(1),
  palette: z.string().min(1),
  era: z.string().min(1),
  themes: z.string().min(1),
  styleNotes: z.string().optional()
});

export async function GET() {
  const worlds = await prisma.worldBible.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(worlds);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const input = worldSchema.parse(body);
  const world = await prisma.worldBible.create({
    data: input
  });
  return NextResponse.json(world);
}
