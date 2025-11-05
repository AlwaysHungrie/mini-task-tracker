# Backend

### Running locally 

Requires a mongodb and redis instance running. See `.env.example` for all the environment variables that need to be set in a `.env` file before running the server.

```bash
pnpm install
pnpm dev
```

### Running tests and coverage

Current coverage report in text is present in `coverage-report.txt`, run `pnpm test:coverage` to generate a detailed coverage report in html format.

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

