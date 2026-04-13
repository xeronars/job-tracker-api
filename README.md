# Job Application Tracker API

A REST API built with Node.js/Express.js that helps users organize and monitor their job search from start to finish.

## Problem It Solves
Job seekers applying to multiple positions at once quickly lose track of where they applied, what stage they're in, and who they spoke with. This API provides a structured backend to organize the entire job search process.

## Technologies Used
- Node.js
- Express.js
- Sequelize ORM
- SQLite
- JSON Web Tokens (JWT)
- bcryptjs
- CORS

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/xeronars/job-tracker-api.git
cd job-tracker-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file in the root folder
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
DB_NAME=jobtracker.db

### 4. Setup and seed the database
```bash
npm run seed
```

### 5. Start the server
```bash
npm start
```

## API Endpoints

### Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/register | Register a new user |
| POST | /api/login | Login and receive JWT token |

### Protected Routes (requires JWT token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/applications | Get all your applications |
| POST | /api/applications | Create a new application |
| GET | /api/applications/:id | Get a single application |
| PUT | /api/applications/:id | Update an application |
| DELETE | /api/applications/:id | Delete an application |
| GET | /api/applications/:id/contacts | Get contacts for an application |
| POST | /api/applications/:id/contacts | Add a contact to an application |
| DELETE | /api/applications/:id/contacts/:contactId | Delete a contact |

### Admin Routes (requires admin JWT token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/applications | Get all applications from all users |

## Authentication Guide

### Register
POST /api/register
Body: { "username": "johndoe", "email": "john@example.com", "password": "password123" }

### Login
POST /api/login
Body: { "email": "john@example.com", "password": "password123" }

### Using the token
Include the token in the Authorization header for all protected routes:
Authorization: Bearer YOUR_JWT_TOKEN

## Test Credentials (seeded data)
- **User:** john@example.com / password123
- **Admin:** admin@example.com / password123

## Future Improvements
- Add PUT/PATCH endpoint for updating contacts
- Add filtering and sorting for applications by status
- Add unit tests for all endpoints
- Add pagination for large datasets
- Deploy to Render