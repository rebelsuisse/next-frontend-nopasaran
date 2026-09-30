// src/app/api/social/run/route.ts

import { isAuthorized } from '@/social/auth';
import { runSocialPublishing } from '@/social/run';

// Called every 15 minutes by Vercel Cron (see vercel.json). An Instagram
// carousel takes time: Instagram fetches and processes each of its images
// (up to 10). Stays below the run lock (5 min, src/social/run.ts).
export const maxDuration = 240;

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const report = await runSocialPublishing();
    console.log('[social] run', JSON.stringify(report));
    return Response.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[social] run failed:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
