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

### Obtaining database instances

[mongodb](https://www.mongodb.com/cloud/atlas) and [redis](https://redis.io/docs/latest/deploy/deploy-cluster/) both provide free tiers for development.

### Deploying

Configured to deploy on [Render](https://render.com/) automatically on push to main branch.

```bash
pnpm install && pnpm build
pnpm start
```

---

### Features

 - Express api with typescript
 - Uses mongoose for mongo operations and schema validation
 - Uses zod for request validation
 - Mongoose enforces indexes for faster queries for frequent search patterns
 - Brycrypt is used for password hashing and verification
 - Auth endpoints for user registration and login, returns jwt for future authenticated requests
 - crud endpoints for tasks with authentication
 - Uses redis for caching get requests
 - Jest and supertest for testing, uses mock redis and mongodb for testing

 ### Endpoints

 - POST /api/auth/register - Register a new user
 - POST /api/auth/login - Login a user
 - GET /api/tasks - Get all tasks (supports query params: status, dueDate)
 - POST /api/tasks - Create a new task 
 - PUT /api/tasks/:id - Update a task by id
 - DELETE /api/tasks/:id - Delete a task by id

### Testing Endpoints with cURL

Replace `BASE_URL` with your server URL (e.g., `http://localhost:3001` for local development or `https://mini-task-tracker-nmfi.onrender.com` for production).

#### Authentication Endpoints

**Register a new user:**
```bash
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the `token` from the login response to use in authenticated requests. Set it as an environment variable:
```bash
export TOKEN="your-jwt-token-here"
```

#### Task Endpoints

**Create a new task:**
```bash
curl -X POST $BASE_URL/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "description": "Complete project documentation",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "status": "pending"
  }'
```

**Get all tasks:**
```bash
curl -X GET $BASE_URL/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

**Get tasks filtered by status and due date:**
```bash
curl -X GET "$BASE_URL/api/tasks?status=pending&dueDate=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

**Update a task:**
```bash
curl -X PUT $BASE_URL/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "description": "Updated task description",
    "status": "completed",
    "dueDate": "2024-12-31T23:59:59.000Z"
  }'
```

**Delete a task:**
```bash
curl -X DELETE $BASE_URL/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Note:** Replace `TASK_ID` with the actual task ID from a previous request.