# Real-Time Chat and Collaboration

A team chat application built with React. Workspaces, public and private channels, direct and group messages, live typing and presence, file sharing, search, notifications, and role-based permissions.

**Live demo:** https://real-time-chat-and-collaboration-application-production.up.railway.app

## Getting started

Requires Node.js 22.12 or newer (CI and the Dockerfile use Node 22).

```bash
npm install
npm run dev
```

Open http://localhost:5173. To run the production build on one server:

```bash
npm run build
node mock-server/server.js
```

Open http://localhost:4000.

## Demo accounts

All accounts use the password `Password123!`.

| Email            | Role                       |
| ---------------- | -------------------------- |
| owner@demo.test  | Owner                      |
| admin@demo.test  | Admin                      |
| member@demo.test | Member                     |
| guest@demo.test  | Guest (sees #general only) |

To test real-time updates, sign in with two accounts in two windows (one normal, one incognito).

## Scripts

| Command            | Purpose                               |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Development server with the mock API  |
| `npm run build`    | Production build                      |
| `npm test`         | Unit and component tests              |
| `npm run test:e2e` | Two-session browser test (Playwright) |
| `npm run lint`     | Lint                                  |

## Tech stack

React 19, Vite, Tailwind CSS v4, React Router, Redux Toolkit, TanStack Query, React Hook Form with Zod, Socket.IO, Vitest, Playwright, ESLint, Prettier, and Express 5 for the demo server.

## Deployment

The app runs as one Node service. The server provides the API, Socket.IO, and the built frontend on one port. Build with `npm install && npm run build`, and start with `node mock-server/server.js`. The included `Dockerfile` does the same.

### Reverse proxy

If the server runs behind a reverse proxy (Railway does), set `TRUST_PROXY=1`. The server then reads each client address from `X-Forwarded-For`, so rate limits apply per user. Leave it unset when the server is reached directly; otherwise a client can send any `X-Forwarded-For` and bypass the limits.

### Demo mode

On a public deployment, set `DEMO_MODE=true`. The seeded Demo Workspace then cannot be renamed, deleted, or have its members changed, so visitors cannot break the demo for others. Workspaces created by users are not affected.

## Limitations

- The backend is a documented mock. Data is saved to `mock-server/data/db.json` (or the folder set in `DATA_DIR`). On a host without a persistent volume, the data is lost when the container is redeployed.
- No email is sent. Reset and invite links appear in the server log.
- Read and delivery receipts are not implemented.
- Meetings have a start and end flow, but no video provider is connected.

## License

MIT. See [LICENSE](LICENSE).

## Author

Ch Tanzeel
