# ADR-0009: Whitelisted "Play My Video" mode (supersedes CONSTRAINTS "No Long Videos")

## Status
Accepted

## Date
2026-11-21

## Context
CONSTRAINTS §2 says "NEVER embed YouTube players". `docs/product/video-preferences.md` (written later by
the product owner) replaces that bullet: exercises with a user-whitelisted `videoUrl` show a
**"Voice Guide" (default) | "Play My Video"** toggle that embeds that exact link. Random or unvetted
videos stay forbidden.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Is a video mode needed in V1? | The product owner explicitly asked for it, and only one entry uses it, so the cost is small. Accepted as V1. |
| **Scope** — | Toggle only on items whose exercise has a valid `videoUrl`; default is always Voice Guide. In video mode the voice coach and timer pause (the video is the guide); "Done with video" advances to the next move. No search, no recommendations, no autoplay of other videos (`rel=0`). |
| **Dependencies** — | ADR-0004 (`videoUrl` validation), ADR-0008 (player). Needs network; offline → toggle shows "Video needs internet" and stays in Voice Guide. |
| **Data model** — | Optional `videoUrl` on the exercise; nothing new persisted. |
| **Security & privacy** — | Only `https` YouTube watch/youtu.be URLs from the bundled JSON are accepted, re-built as `https://www.youtube-nocookie.com/embed/<id>` (privacy-enhanced mode, no cookies until play). The iframe is created only after the user taps "Play My Video", so no third-party request happens otherwise. iframe uses `referrerPolicy="strict-origin-when-cross-origin"` and a restrictive `allow` list. |
| **Alternatives** — | Keep CONSTRAINTS as written; open the link in the YouTube app. See below. |

## Decision
Supersede the CONSTRAINTS §2 "No Long Videos" bullet with the whitelisted-video wording from
`video-preferences.md` (CONSTRAINTS.md updated to point here). Implement the toggle in `PlayerScreen`
using `parseWhitelistedVideo()`.

## Consequences
- The "Hands-Free" acceptance test is unaffected: video mode is opt-in, default is voice.
- Adding a video = add `videoUrl` to an exercise; invalid URLs fail CI (ADR-0004).

## Alternatives Considered
### Keep "no videos" (original CONSTRAINTS)
- Rejected because: the product owner's later preference overrides it.
### Open the link in a new tab / YouTube app
- Pros: No iframe.
- Cons: Leaves the app; timer/wake lock context lost.
- Rejected because: breaks the session flow.
