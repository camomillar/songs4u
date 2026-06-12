import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ids = new URL(req.url).searchParams.get("ids");
  if (!ids) return NextResponse.json({ error: "Missing ids" }, { status: 400 });

  const idList = ids.split(",").filter(Boolean);

  const results = await Promise.all(
    idList.map(id =>
      fetch(`https://api.deezer.com/track/${id}`, { cache: "no-store" })
        .then(r => r.json())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((d: any) => [id, (d.preview as string | undefined) ?? null])
        .catch(() => [id, null])
    )
  );

  return NextResponse.json(Object.fromEntries(results));
}
