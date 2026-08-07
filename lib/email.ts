import nodemailer from "nodemailer";
import { parentEmailFromEnv } from "@/lib/auth";

export type MailResult =
  | { delivered: true }
  | { delivered: false; reason: string };

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendParentEmail(options: {
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<MailResult> {
  const to = parentEmailFromEnv();
  if (!to) {
    return {
      delivered: false,
      reason: "Parent contact email is not configured yet. The message was still saved safely.",
    };
  }

  if (!smtpConfigured()) {
    return {
      delivered: false,
      reason:
        "Email delivery is temporarily unavailable. Your message was saved in the parent inbox.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: options.subject,
      text: options.text,
      replyTo: options.replyTo,
    });

    return { delivered: true };
  } catch {
    return {
      delivered: false,
      reason:
        "Email delivery is temporarily unavailable. Your message was saved in the parent inbox.",
    };
  }
}
