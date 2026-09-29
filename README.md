# ChatsWrapped

Turn your WhatsApp group chat export into a stats dashboard. Who sends the most messages? Who deletes the most? Who's the emoji king? Find out.

## The story

A friend asked a simple question: "wouldn't it be cool to know who sends the most messages in our group chat?" That curiosity turned into this... A full leaderboard and breakdown of your WhatsApp chat history. Messages sent, media shared, emojis used, active hours, trends over time, and more.

## Privacy first

Your data never leaves your browser. No server, no database, no cookies, no analytics. The chat file is read and parsed entirely client-side using the [parser](app/lib/parser.ts). Nothing is uploaded or stored anywhere.

## What you get

- **Summary** — total messages, days active, most/least active day, media counts
- **Active hours heatmap** — when your group is most alive, broken down by day and hour
- **Messages sent ranked** — the leaderboard
- **Trends over time** — monthly message counts per user
- **Average daily messages** — per person and per day of week
- **Top emojis** — the 10 most used emojis across the chat
- **Deleted messages ranked** — who's hiding what

## Tech stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [React Router v7](https://reactrouter.com) — routing and SSR framework
- [Vite](https://vite.dev) — build tool and dev server
- [Zod](https://zod.dev) — schema validation and type inference (single source of truth for all types)
- [Highcharts](https://www.highcharts.com) — bar and line charts
- [Biome](https://biomejs.dev) — linter and formatter
- Vanilla CSS with `light-dark()` for automatic dark mode
- Local variable fonts ([Geist](https://vercel.com/font) for body, [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) for headings)

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173), upload a WhatsApp chat export (`.txt`), or click "Try with sample data" to see it in action.

### Export your WhatsApp chat

1. Open a WhatsApp chat (group or individual)
2. Tap the three dots menu (Android) or the chat name (iOS)
3. Select **Export chat** > **Without media**
4. Save the `.txt` file and upload it

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `pnpm dev`      | Start dev server           |
| `pnpm build`    | Production build           |
| `pnpm lint`     | Check for lint errors      |
| `pnpm lint:fix` | Fix lint errors and format |

## License

[MIT](LICENSE)
