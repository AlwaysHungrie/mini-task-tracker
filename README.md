# Mini Task Tracker

Demo Links:

- Frontend (main): [https://mini-task-tracker-s6ucuto4c-pineappls-projects.vercel.app/](https://mini-task-tracker-s6ucuto4c-pineappls-projects.vercel.app/)
- Backend (api): [https://mini-task-tracker-nmfi.onrender.com/](https://mini-task-tracker-nmfi.onrender.com/)

This is a simple task tracker application where users can create, update, and delete tasks.

1. Backend - (Node.js, Express, Mongoose)

Endpoints:

- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login a user
- POST /api/tasks - Create a new task
- GET /api/tasks - Get all tasks
- GET /api/tasks/:id - Get a task by id
- PUT /api/tasks/:id - Update a task by id
- DELETE /api/tasks/:id - Delete a task by id

2. Frontend - (Next.js)

User Flow:

1. Visit home page (first time)
    1. Click on Get Started button on top right corner
    2. Sign up with name, email and password
    3. Login with email and password
    4. Redirected to home page
2. Visit home page (user not logged in)
    1. Click on Sign in button on top right corner
    2. Sign in with email and password
    3. Redirected to home page
3. Visit home page (user logged in)
    1. Create task
    2. Update existing task details
    3. Toggle task completion status
    4. Delete task
    5. Filter tasks by status and due date
