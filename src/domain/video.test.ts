import { describe, expect, it } from 'vitest';
import { parseWhitelistedVideo } from './video';

describe('parseWhitelistedVideo', () => {
  it('converts watch URLs to nocookie embeds and keeps the start time', () => {
    expect(parseWhitelistedVideo('https://www.youtube.com/watch?v=bO_oRNtGIvs&t=40s')).toEqual({
      videoId: 'bO_oRNtGIvs',
      startSec: 40,
      embedUrl: 'https://www.youtube-nocookie.com/embed/bO_oRNtGIvs?rel=0&start=40',
    });
  });

  it('accepts youtu.be links', () => {
    expect(parseWhitelistedVideo('https://youtu.be/oROcJnaw0NU')?.videoId).toBe('oROcJnaw0NU');
  });

  it.each([
    'http://www.youtube.com/watch?v=oROcJnaw0NU',
    'https://evil.example.com/watch?v=oROcJnaw0NU',
    'https://www.youtube.com/embed/oROcJnaw0NU',
    'https://www.youtube.com/watch?v=short',
    'javascript:alert(1)',
    'not a url',
    42,
  ])('rejects %s', (url) => {
    expect(parseWhitelistedVideo(url)).toBeNull();
  });
});
