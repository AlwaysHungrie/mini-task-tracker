# Backend

Demo Link: [https://mini-task-tracker-nmfi.onrender.com/](https://mini-task-tracker-nmfi.onrender.com/)

### Running locally 

Requires a mongodb and redis instance running. See `.env.example` for all the environment variables that need to be set in a `.env` file before running the server.

```bash
pnpm install
pnpm dev
```

### Running tests and coverage

Current coverage report in text is present in [coverage-report.txt](https://github.com/AlwaysHungrie/mini-task-tracker/blob/main/backend/coverage-report.txt), run `pnpm test:coverage` to generate a detailed coverage report in html format.

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

---

### Features

 - Express api with typescript
 - Uses mongoose for mongo operations and schema validation
 - Mongoose enforces indexes for faster queries for frequent search patterns
 - Brycrypt is used for password hashing and verification
 - Auth endpoints for user registration and login, returns jwt for future authenticated requests
 - crud endpoints for tasks with authentication
 - Uses redis for caching get requests
 - Jest and supertest for testing, uses mock redis and mongodb for testing

 ### Endpoints

 - POST /api/auth/register - Register a new user
 - POST /api/auth/login - Login a user
 - POST /api/tasks - Create a new task
 - GET /api/tasks - Get all tasks (supports query params: status, dueDate)
 - GET /api/tasks/:id - Get a task by id
 - PUT /api/tasks/:id - Update a task by id
 - DELETE /api/tasks/:id - Delete a task by id