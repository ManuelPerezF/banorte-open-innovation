import { NextResponse } from "next/server";
import { authenticatePersonalUser, authenticateCompanyUser } from "@/services/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, userType } = body as {
      userId?: string;
      name?: string;
      userType?: string;
    };

    if (!userId || !name || !userType) {
      return NextResponse.json({ success: false, error: "Campos incompletos" }, { status: 400 });
    }

    let result;

    if (userType === "company") {
      result = await authenticateCompanyUser(userId, name);
    } else {
      result = await authenticatePersonalUser(userId, name);
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: result.user }, { status: 200 });
  } catch (err) {
    console.error("/api/auth/verify error:", err);
    return NextResponse.json({ success: false, error: "Error del servidor" }, { status: 500 });
  }
}
