<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into songs4u. PostHog is now initialized client-side via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), with a reverse proxy configured in `next.config.ts` so all analytics traffic routes through `/ingest` to avoid ad blockers. A server-side PostHog client (`lib/posthog-server.ts`) handles playlist saves. All credentials are stored in `.env.local` and referenced via `NEXT_PUBLIC_POSTHOG_*` environment variables — never hardcoded.

Ten events are now instrumented across 5 files: 4 client-side files track the full creator and recipient lifecycle, and the playlist API route tracks the server-side save event.

| Event | Description | File |
|---|---|---|
| `playlist_created` | User generates a playlist link and QR code | `app/page.tsx` |
| `song_added` | User adds a song from search results | `app/page.tsx` |
| `song_removed` | User removes a song from their playlist | `app/page.tsx` |
| `cover_photo_uploaded` | User uploads a cover photo for the CD case | `app/page.tsx` |
| `link_copied` | User copies the playlist share link | `components/QRShare.tsx` |
| `playlist_opened` | Recipient opens a shared playlist page | `components/SharePageContent.tsx` |
| `song_played` | Recipient presses play on a song preview | `components/SharePageContent.tsx` |
| `case_opened` | Recipient taps/clicks to open the jewel case | `components/JewelCase.tsx` |
| `story_shared` | Recipient clicks Share to Instagram Story | `components/JewelCase.tsx` |
| `playlist_saved` | Server-side: playlist persisted to Redis | `app/api/playlist/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/466558/dashboard/1702074)
- [Playlist creation funnel (wizard)](https://us.posthog.com/project/466558/insights/aORRmswx) — creator → recipient → open case → play song
- [Playlists created over time (wizard)](https://us.posthog.com/project/466558/insights/TlFaV4wZ) — daily creation volume
- [Songs added per session (wizard)](https://us.posthog.com/project/466558/insights/mVoFjhEz) — songs added vs. removed
- [Sharing actions over time (wizard)](https://us.posthog.com/project/466558/insights/Wc0DdzPR) — story shares + link copies
- [Recipient engagement (wizard)](https://us.posthog.com/project/466558/insights/o8aTVKdM) — opened → case open → song played

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
