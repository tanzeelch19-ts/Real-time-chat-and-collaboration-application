# Real-Time Chat and Collaboration

A React chat and collaboration app with workspaces, channels, direct and group
conversations, threads, reactions, file sharing, search, notifications, mentions,
pinned and saved messages, an audit log, and a meeting entry point.

## Tech stack

- React 19, Vite 8, Tailwind CSS v4
- React Router (routing and protected routes)
- Redux Toolkit for client state (session, theme, drafts, presence)
- TanStack Query for server state (messages, channels, members, notifications)
- Axios for REST and Socket.IO client for real-time events
- React Hook Form and Zod for forms and validation
- Vitest and React Testing Library for tests
- ESLint and Prettier for code quality
- Express 5 and Socket.IO for the mock backend (development only)

## Getting started

Requirements: Node.js 20.19 or newer (or 22.12 or newer).

```bash
npm install
npm run dev
```

Open http://localhost:5173. The mock REST API and Socket.IO server run inside the
Vite dev server, so there is no second process and no second port.

## Demo accounts

All accounts use the password `Password123!`.

| Email | Role in Demo Workspace |
| --- | --- |
| owner@demo.test | Owner |
| admin@demo.test | Admin |
| member@demo.test | Member |
| guest@demo.test | Guest |

The guest sees `#general` only. `#random` is public. `#leadership` is private.

To test real-time behaviour, sign in as two accounts in two windows (one normal, one
incognito), since the session is stored per browser profile.

## Features

- **Auth:** register, login, logout, forgot and reset password, protected routes, session expiry handling.
- **Profile:** display name, status message, avatar URL.
- **Workspaces:** create, switch, members with roles, invite links (multi-use, expire after 7 days) with states Active, Used, Expired, and Revoked.
- **Channels:** public and private, role-based visibility, unread counts, topic and description, archive (read-only).
- **Direct and group conversations** opened from the sidebar.
- **Messages:** real-time delivery, typing indicators, presence (online, away, offline), edit, delete (author, plus admins in channels, with confirmation), threads, emoji reactions, consecutive-message grouping, drafts kept per room.
- **Files:** PNG, JPEG, GIF, WebP, PDF, and plain text up to 2 MB, with upload progress, retry, image preview, and a lightbox.
- **Search** across messages the user can read, with navigation to the matching message.
- **Notifications** for mentions (`@Full Name`), replies, and direct messages, with a bell and a full page.
- **Pinned and saved messages** (saved is private to each user).
- **Audit log** for owners and admins.
- **Meetings:** a start and end entry point. There is no video provider yet, so meetings have no join link.

## Testing

```bash
npm test           # every *.test.js(x) file, frontend and mock server
npm run test:watch
npm run lint
```

Automated tests cover: auth state and schemas, permissions, message and draft state,
file rules, mention detection and highlighting, presence (including away), channel
unread and archive rules, invitation status, grouping, the confirmation dialog, the
channel settings dialog, and password hashing.

Manual checks for multi-user behaviour (see the checklist in the project notes):

1. Two windows, two accounts: a message sent in one appears in the other without refresh.
2. Typing indicator appears in the other window and clears after sending or idling.
3. Owner archives `#general`: members see "Archived. Read-only." and cannot post.
4. Revoke an invite link: its status changes to Revoked and the link stops working.

## Mock API and its limits

The mock backend keeps data in memory and saves it to `mock-server/data/db.json`, so
accounts and messages survive a dev server restart. Uploaded files are stored in
`mock-server/data/uploads/`. Delete `db.json` and the uploads folder to reset the demo data.

Limits to know before deploying:

- **Email:** no email is sent. Password reset and invite links are shown in the dev server console and in the UI.
- **Read and delivery receipts:** not supported by the mock backend, so the UI does not show them.
- **"Away" presence:** the server marks a user away after 5 minutes without activity.
- **Video meetings:** no provider. Meetings have a status and a join boundary, but no join link.
- **Tokens:** access tokens are kept in `localStorage`. A real backend should use httpOnly cookies.
- **Data:** the mock server runs only in development (`npm run dev`).

## Known gaps

- Notification preferences and appearance preferences screen.
- `@channel` mentions.
- Code splitting: the production bundle is about 720 kB, which triggers Vite's size warning.
- An automated browser test that drives two sessions (the manual checklist above covers it).

## Build and deployment

```bash
npm run build     # creates dist/
npm run preview   # serves dist/ locally
```

`dist/` is a static site. It does not contain the mock API, so `/api` calls fail unless a
real backend serves them. To use one:

1. Deploy the backend.
2. Set `VITE_API_URL` to its base URL (see `.env.example`) and rebuild.
3. Serve `dist/` from any static host (Netlify, Vercel, or Nginx).

The Socket.IO client connects to the same origin as the page. If the backend is on another
domain, the socket client also needs a URL setting.

## Project structure

- `src/app`: store, providers, router
- `src/features`: feature folders (auth, workspaces, channels, messages, files, notifications, pins, meetings, audit, search, presence, realtime)
- `src/components`: shared UI, layout, navigation, messaging, notifications
- `src/services`: Axios client and Socket.IO client
- `mock-server`: development REST and Socket.IO backend
## Batch 9 additions

- **Search filters:** sender, date range, and "has an attachment", combined with keyword search.
- **Channel members:** see who is in a channel, add members (creator, owner, or admin), remove members, and leave.
- **Join public channels:** members (not guests) can join a public channel on their own.
- **Mute a room:** muted rooms send no notifications. Messages still arrive and unread counts still change.
- **Appearance:** message density (comfortable or compact) and text size (normal or large), saved on this device.

### Still outside the mock backend

- Email invitations, and read or delivery receipts.
- Video join links (the meeting entry point exists, the provider does not).
- Public channels are readable by the whole workspace. "Join" records membership for the member list and does not change who can read the channel.

## Batch 10 additions

- **Workspace details:** the owner can set the workspace name, a description (up to 500 characters), and an avatar link. Other members see the same details as read-only text.
- **Profile photo upload:** pick a PNG, JPEG, GIF, or WebP image up to 512 KB from the profile page. It is stored with the account.
- **Notifications for invitations and channels:** the inviter is notified when someone joins through their link, and a person is notified when they are added to a channel.
- **Tests:** role-based checks for owner, admin, member, and guest; a reconnect test that confirms no duplicate messages; upload UI tests; keyboard tests for the workspace switcher, emoji picker, and confirmation dialog; message pagination and invitation/channel notification tests on the mock server.
- **Browser test:** `e2e/two-sessions.spec.js` runs two real browser sessions with Playwright.

### Running the tests

```bash
npm test            # unit and component tests (Vitest)
npm run test:e2e    # browser test (Playwright). Start the app first, or let Playwright start it.
npm run lint
```

The first `npm run test:e2e` may ask you to install a browser: `npx playwright install chromium`.

### Still outside the mock backend

- Email invitations and read or delivery receipts.
- Video join links (the provider is not connected).