import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  totpCode: z.string().regex(/^\d{6}$/).optional().or(z.literal("")),
  csrfToken: z.string().min(10),
});

export const challengeCompleteSchema = z.object({
  challengeId: z.string().min(1),
  nickname: z.string().min(1).max(40).default("Anonymous Creator"),
  note: z.string().min(3).max(300),
  csrfToken: z.string().min(10),
});

export const projectSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  technologies: z.array(z.string().min(1).max(40)).max(12),
  url: z.string().url().optional().nullable().or(z.literal("")),
  accent: z.enum(["cyan", "violet", "amber", "mint", "coral"]).default("cyan"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  featured: z.boolean().default(false),
  completedAt: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  csrfToken: z.string().min(10),
});

export const settingsSchema = z.object({
  contactFormEnabled: z.boolean(),
  guestbookEnabled: z.boolean(),
  challengeSubmissionsOn: z.boolean(),
  publicSubmissionsEnabled: z.boolean(),
  visitorMessagingEnabled: z.boolean(),
  maintenanceMode: z.boolean(),
  showParentEmailPublicly: z.boolean(),
  themeDefault: z.enum(["dark", "light"]),
  accentCyan: z.string().min(4).max(20),
  accentViolet: z.string().min(4).max(20),
  accentAmber: z.string().min(4).max(20),
  accentCoral: z.string().min(4).max(20),
  privacyNotice: z.string().min(20).max(4000),
  homepageAnnouncement: z.string().max(500),
  footerText: z.string().min(5).max(300),
  socialLinksJson: z.string().max(4000),
  csrfToken: z.string().min(10),
});

export const visitorChatSendSchema = z.object({
  message: z.string().min(1).max(1000),
  website: z.string().max(0).optional().or(z.literal("")),
  csrfToken: z.string().min(10),
});

export const visitorChatSeenSchema = z.object({
  csrfToken: z.string().min(10),
});
