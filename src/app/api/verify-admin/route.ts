import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    // Get admin PIN from environment variable
    const adminPin = process.env.ADMIN_PIN;

    // If no admin PIN is set, deny access
    if (!adminPin) {
      return NextResponse.json({ success: false, error: "Admin PIN not configured" });
    }

    // Verify PIN
    if (pin === adminPin) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" });
  }
}
