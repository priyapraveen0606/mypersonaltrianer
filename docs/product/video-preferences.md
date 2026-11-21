Quick check on the links you shared earlier:

[https://www.youtube.com/watch?v=2eA2Koq6pTI](https://www.youtube.com/watch?v=2eA2Koq6pTI) is Mady Morrison's 10-min Back Pain Relief Stretches.

[https://www.youtube.com/watch?v=bO_oRNtGIvs&t=40s](https://www.youtube.com/watch?v=bO_oRNtGIvs&t=40s) is Coach Ali's Weak Core & Back Pain Dumbbell Workout.

[https://www.youtube.com/watch?v=oROcJnaw0NU](https://www.youtube.com/watch?v=oROcJnaw0NU) is the second slow-stretch link you shared (I've wired this one into chandra-namaskar below—if your Chandra Namaskar video is a different URL, just swap it in!).

1. Update CONSTRAINTS.md (Section 2)
Replace the "No Long Videos" bullet with this:

Markdown
* **Voice-First with Whitelisted Video Mode:** Do NOT pull random or unvetted YouTube videos. However, if an exercise in `exercises.json` includes a user-whitelisted `videoUrl` (such as `chandra-namaskar`), display a simple toggle button on the player: **"Voice Guide" (default) | "Play My Video"**, which embeds that specific YouTube link cleanly.
2. Update exercises.json (chandra-namaskar entry)
Add the optional videoUrl field so your coding agent knows to render the video toggle for it:

JSON
  {
    "id": "chandra-namaskar",
    "name": "Chandra Namaskar (Moon Salutation)",
    "moods": ["moody", "slow", "meditative"],
    "equipment": ["bodyweight"],
    "primaryFocus": "full-body-flow",
    "targetMuscle": "hips-and-back",
    "position": "standing-flow",
    "itBandSafe": true,
    "requiresFormCheck": false,
    "videoUrl": "https://www.youtube.com/watch?v=oROcJnaw0NU",
    "formCue": "Open your chest during side bends; keep movements slow and cooling.",
    "defaultDurationSec": 80,
    "defaultRestSec": 10,
    "tempo": "flow",
    "voiceIntro": "Stand tall on your mat. Take a deep breath in and begin your slow, cooling Chandra Namaskar flow."
  }
You can also add "videoUrl" to any other favorite routine (like adding a 10-min-back-relief-stretch entry for Mady Morrison's video or a 1kg-dumbbell-back-rehab entry for Coach Ali's video) whenever you want a video-assisted option on tap.