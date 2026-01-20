import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema } from "@/lib/validations/contact-schema";

// Initialize Resend client (will be null if API key is not set)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Generate HTML email template
function generateEmailTemplate(
  name: string,
  email: string,
  subject: string | undefined,
  message: string
): string {
  const currentYear = new Date().getFullYear();
  const timestamp = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">
                New Message Received
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #94a3b8;">
                ${timestamp}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px; background-color: #111827; border-left: 1px solid #1f2937; border-right: 1px solid #1f2937;">
              <!-- Sender Info -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #1f2937; border-radius: 12px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding-bottom: 16px; border-bottom: 1px solid #374151;">
                          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6366f1;">
                            From
                          </p>
                          <p style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                            ${escapeHtml(name)}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 16px;">
                          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6366f1;">
                            Email
                          </p>
                          <a href="mailto:${escapeHtml(email)}" style="font-size: 16px; color: #60a5fa; text-decoration: none;">
                            ${escapeHtml(email)}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${
                subject
                  ? `
              <!-- Subject -->
              <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6366f1;">
                  Subject
                </p>
                <p style="margin: 0; font-size: 18px; font-weight: 500; color: #ffffff;">
                  ${escapeHtml(subject)}
                </p>
              </div>
              `
                  : ""
              }

              <!-- Message -->
              <div>
                <p style="margin: 0 0 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6366f1;">
                  Message
                </p>
                <div style="padding: 20px; background-color: #1f2937; border-radius: 12px; border-left: 4px solid #6366f1;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #e5e7eb; white-space: pre-wrap;">
${escapeHtml(message)}
                  </p>
                </div>
              </div>

              <!-- Reply Button -->
              <div style="margin-top: 32px; text-align: center;">
                <a href="mailto:${escapeHtml(email)}?subject=Re: ${escapeHtml(subject || "Your message")}"
                   style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                  Reply to ${escapeHtml(name.split(" ")[0])}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0f172a; border-radius: 0 0 16px 16px; border: 1px solid #1f2937; border-top: none;">
              <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
                This message was sent from your portfolio contact form.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #475569; text-align: center;">
                &copy; ${currentYear} Rajat Kumar R. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Escape HTML to prevent XSS in email
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

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
          details: errors,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validationResult.data;

    // Log the contact form submission
    console.log("Contact form submission:", {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Send email if Resend is configured
    if (resend) {
      const contactEmail =
        process.env.CONTACT_EMAIL || "rajat.kumar.r@outlook.com";

      const { error: sendError } = await resend.emails.send({
        from: "Portfolio Contact <onboarding@resend.dev>",
        to: contactEmail,
        replyTo: email,
        subject: `New Contact Form Submission from ${name}${subject ? `: ${subject}` : ""}`,
        html: generateEmailTemplate(name, email, subject, message),
      });

      if (sendError) {
        console.error("Resend email error:", sendError);
        return NextResponse.json(
          {
            error:
              "Failed to send message. Please try again or contact directly via email.",
          },
          { status: 500 }
        );
      }

      console.log(`Email sent successfully to ${contactEmail}`);
    } else {
      console.warn(
        "RESEND_API_KEY is not configured. Email not sent. Form submission logged only."
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully! I will get back to you soon.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      {
        error: "Internal server error. Please try again later.",
      },
      { status: 500 }
    );
  }
}
