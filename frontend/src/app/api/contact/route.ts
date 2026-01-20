import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact-schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validationResult = contactSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          error: "Validation failed",
          details: errors
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validationResult.data;

    // TODO: Implement actual email sending with Resend
    // For now, just log the message and return success
    console.log("Contact form submission:", {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Simulate a small delay to mimic email sending
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(
      {
        success: true,
        message: "Message received successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      {
        error: "Internal server error. Please try again later."
      },
      { status: 500 }
    );
  }
}
