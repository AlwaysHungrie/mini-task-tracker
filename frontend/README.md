# Frontend

Demo Link: [https://mini-task-tracker-nmfi.onrender.com/](https://mini-task-tracker-nmfi.onrender.com/)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)

### Running locally

Requires backend server to be running. Set `NEXT_PUBLIC_API_URL` in `.env` to the backend server URL.

```bash
pnpm install
pnpm dev
```

---

### Features

 - Next.js with typescript, tailwindcss, shadcn/ui
 - Uses react query for optimistic updates and caching
 - Uses react context for state management
 - Uses next api routes for server actions