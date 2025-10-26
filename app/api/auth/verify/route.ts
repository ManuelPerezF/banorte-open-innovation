import { NextResponse } from "next/server";
import { authenticatePersonalUser, authenticateCompanyUser } from "@/services/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Body recibido:", body);
    
    const { userId, name, userType } = body as {
      userId?: string;
      name?: string;
      userType?: string;
    };

    if (!userId || !name || !userType) {
      console.log("Campos incompletos");
      return NextResponse.json({ success: false, error: "Campos incompletos" }, { status: 400 });
    }

    let result;

    if (userType === "company") {
      console.log("Autenticando empresa...");
      result = await authenticateCompanyUser(userId, name);
    } else {
      console.log("Autenticando usuario personal...");
      result = await authenticatePersonalUser(userId, name);
    }

    console.log("Resultado de autenticación:", result);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: result.user }, { status: 200 });
  } catch (err) {
    console.error("/api/auth/verify error:", err);
    return NextResponse.json({ success: false, error: "Error del servidor" }, { status: 500 });
  }
}
