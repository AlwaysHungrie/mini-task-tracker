# Frontend

Demo Link: [https://mini-task-tracker-s6ucuto4c-pineappls-projects.vercel.app/](https://mini-task-tracker-s6ucuto4c-pineappls-projects.vercel.app/)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)

### Running locally

Requires backend server to be running. Set `NEXT_PUBLIC_API_URL` in `.env` to the backend server URL.

```bash
pnpm install
pnpm dev
```

### Deploying

Configured to deploy on [Vercel](https://vercel.com/) automatically on push to main branch.

```bash
pnpm install && pnpm build
pnpm start
```

---

### Features

 - Next.js with typescript, tailwindcss, shadcn/ui
 - Uses react query for optimistic updates and caching
 - Uses react context for state management
 - Uses next api routes for server actions
 - Filtering based on status and due date
 - Create, update and delete tasks. And toggle task completion status