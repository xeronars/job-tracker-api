# Job Application Tracker API

A REST API built with Node.js/Express.js that helps users organize and monitor their job search from start to finish.

## Problem It Solves
Job seekers applying to multiple positions at once quickly lose track of where they applied, what stage they're in, and who they spoke with. This API provides a structured backend to organize the entire job search process from application to offer.

## Technologies Used
- Node.js
- Express.js
- Sequelize ORM
- SQLite
- JSON Web Tokens (JWT)
- bcryptjs
- CORS
- Jest & Supertest (testing)

## Live Demo
https://job-tracker-api-zp22.onrender.com

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

### 4. Seed the database
```bash
npm run seed
```

### 5. Start the server
```bash
npm start
```

### 6. Run tests
```bash
npm test
```

## User Roles
| Role | Permissions |
|------|-------------|
| user | Register, login, full CRUD on own applications and contacts |
| admin | All user permissions + view all applications across all users |

## API Endpoints

### Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | / | API info and available endpoints |
| POST | /api/register | Register a new user |
| POST | /api/login | Login and receive JWT token |

### Application Routes (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/applications | Get all your applications |
| POST | /api/applications | Create a new application |
| GET | /api/applications/:id | Get a single application |
| PUT | /api/applications/:id | Update an application |
| DELETE | /api/applications/:id | Delete an application |

### Contact Routes (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/applications/:id/contacts | Get all contacts for an application |
| POST | /api/applications/:id/contacts | Add a contact to an application |
| PUT | /api/applications/:id/contacts/:contactId | Update a contact |
| DELETE | /api/applications/:id/contacts/:contactId | Delete a contact |

### Admin Routes (requires admin JWT)
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

## Application Status Values
- `applied`
- `phone screen`
- `interview`
- `offer`
- `rejected`

## Future Improvements
- Add filtering and sorting for applications by status
- Add pagination for large datasets
- Migrate to PostgreSQL for persistent cloud storage
- Add email notifications for status changes