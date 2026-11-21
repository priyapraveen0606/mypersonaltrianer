const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export interface WhitelistedVideo {
  videoId: string;
  startSec: number;
  embedUrl: string;
}

function parseStart(t: string | null): number {
  if (!t) return 0;
  const m = /^(?:(\d+)m)?(\d+)s?$/.exec(t);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 60 + Number(m[2]);
}

/**
 * Accepts only https YouTube watch / youtu.be links and converts them to a
 * privacy-enhanced (youtube-nocookie) embed URL. Anything else returns null.
 */
export function parseWhitelistedVideo(url: unknown): WhitelistedVideo | null {
  if (typeof url !== 'string') return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  let videoId: string | null = null;
  if (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'youtube.com' || parsed.hostname === 'm.youtube.com') {
    if (parsed.pathname === '/watch') videoId = parsed.searchParams.get('v');
  } else if (parsed.hostname === 'youtu.be') {
    videoId = parsed.pathname.slice(1);
  }
  if (!videoId || !YOUTUBE_ID.test(videoId)) return null;
  const startSec = parseStart(parsed.searchParams.get('t'));
  const embed = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  embed.searchParams.set('rel', '0');
  if (startSec > 0) embed.searchParams.set('start', String(startSec));
  return { videoId, startSec, embedUrl: embed.toString() };
}
