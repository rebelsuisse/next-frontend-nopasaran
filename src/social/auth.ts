// src/social/auth.ts

import { timingSafeEqual } from 'node:crypto';

/**
 * The social routes are called by Vercel Cron, which sends
 * `Authorization: Bearer <CRON_SECRET>`. Without CRON_SECRET, everything is
 * refused: anyone could otherwise trigger posts.
 */
export function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const received = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
