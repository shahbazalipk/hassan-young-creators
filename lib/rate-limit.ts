import { prisma } from "@/lib/db";

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds?: number;
};

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { id: key } });

  if (!bucket || now.getTime() - bucket.windowStart.getTime() > windowMs) {
    await prisma.rateLimitBucket.upsert({
      where: { id: key },
      create: { id: key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.ceil(
      (windowMs - (now.getTime() - bucket.windowStart.getTime())) / 1000
    );
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  await prisma.rateLimitBucket.update({
    where: { id: key },
    data: { count: { increment: 1 } },
  });

  return { ok: true, remaining: limit - bucket.count - 1 };
}
