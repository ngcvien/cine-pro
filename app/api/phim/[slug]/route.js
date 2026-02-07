import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ status: false }, { status: 400 });

  try {
    const res = await fetch(`https://phimapi.com/phim/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ status: false }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API phim proxy error:", error);
    return NextResponse.json({ status: false }, { status: 502 });
  }
}
