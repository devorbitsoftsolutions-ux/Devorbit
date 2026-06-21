# DevOrbit Backend + Admin Panel

Complete backend API and admin panel for the DevOrbit software house website.

## Tech Stack

**Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL  
**Admin Panel:** React + TypeScript + Tailwind CSS + Vite

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL

### 1. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE devorbit;"
```

### 2. Backend Setup

```bash
cd devorbit-backend

# Install dependencies (already done)
npm install

# Update .env with your database credentials
# DATABASE_URL="postgresql://postgres:password@localhost:5432/devorbit?schema=public"

# Push schema to database
npx prisma db push

# Seed database with default data
npx prisma db seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:3000`

### 3. Admin Panel Setup

```bash
cd devorbit-admin

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

Admin panel runs on `http://localhost:5173`

### 4. Login Credentials

- **Email:** admin@devorbit.com
- **Password:** admin123

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password

### Portfolio
- `GET /api/portfolio` - List all
- `GET /api/portfolio/:id` - Get one
- `POST /api/portfolio` - Create (admin)
- `PUT /api/portfolio/:id` - Update (admin)
- `DELETE /api/portfolio/:id` - Delete (admin)

### Services
- `GET /api/services` - List all
- `POST /api/services` - Create (admin)
- `PUT /api/services/:id` - Update (admin)
- `DELETE /api/services/:id` - Delete (admin)

### Jobs
- `GET /api/jobs` - List all (with search/filter)
- `POST /api/jobs` - Create (admin)
- `PUT /api/jobs/:id` - Update (admin)
- `DELETE /api/jobs/:id` - Delete (admin)

### Initiatives
- `GET /api/initiatives` - List all
- `POST /api/initiatives` - Create (admin)
- `PUT /api/initiatives/:id` - Update (admin)
- `DELETE /api/initiatives/:id` - Delete (admin)

### Consulting
- `GET /api/consulting` - List all
- `POST /api/consulting` - Create (admin)
- `PUT /api/consulting/:id` - Update (admin)
- `DELETE /api/consulting/:id` - Delete (admin)

### Notifications
- `GET /api/notifications` - List all (admin)
- `POST /api/notifications` - Create (admin)
- `PATCH /api/notifications/:id/read` - Mark read (admin)
- `PATCH /api/notifications/read-all` - Mark all read (admin)
- `DELETE /api/notifications/:id` - Delete (admin)

### Contact Messages
- `POST /api/contact` - Submit message (public)
- `GET /api/contact` - List all (admin)
- `PATCH /api/contact/:id/read` - Mark read (admin)
- `DELETE /api/contact/:id` - Delete (admin)

### Settings
- `GET /api/settings` - Get settings (public)
- `PUT /api/settings` - Update settings (admin)

### Dashboard
- `GET /api/stats/dashboard` - Dashboard stats (admin)

## Admin Panel Features

- **Dashboard** - Overview stats, recent activity
- **Portfolio** - CRUD for portfolio projects
- **Services** - CRUD for service offerings
- **Careers** - CRUD for job listings with department/type filters
- **Initiatives** - CRUD for company initiatives
- **Consulting** - CRUD for consulting services
- **Notifications** - Create/manage system notifications
- **Messages** - View/manage contact form submissions
- **Settings** - Update site configuration

## Frontend Integration

The admin panel manages data that powers the frontend website. To connect:

1. Update the frontend's API calls to point to `http://localhost:3000/api`
2. Use the public endpoints (no auth required) for displaying data:
   - `GET /api/portfolio` - Portfolio items
   - `GET /api/services?active=true` - Active services
   - `GET /api/jobs?active=true` - Active job listings
   - `GET /api/initiatives?active=true` - Active initiatives
   - `GET /api/consulting?active=true` - Active consulting services
   - `GET /api/settings` - Site settings# Devorbit
