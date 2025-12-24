# STREAKD. - Gym Accountability Platform

A web platform that motivates users to go to the gym consistently through a streak-based accountability system. Users participate in weekly challenges, upload daily photos as proof of gym attendance, and face penalties for incomplete weeks.

## Features

- **Secure Authentication**: User registration and login with JWT-based authentication
- **Weekly Challenges**: 7-day cycles starting on Monday
- **Photo Upload**: One photo per day as proof of gym attendance
- **Progress Tracking**: Visual dashboard showing daily uploads and weekly progress
- **Streak System**: Tracks current and longest streaks of completed weeks
- **Credit System**: Users start with 1000 credits; lose 200 credits for incomplete weeks (< 5 days)
- **Penalty System**: Automatic 200 credit deduction when a week is not completed (fewer than 5 days)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT (jsonwebtoken)
- **File Storage**: Local filesystem (uploads stored in `public/uploads/`)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file (optional, for production):
```env
JWT_SECRET=your-secret-key-here
DATABASE_PATH=./data/gymble.db
NODE_ENV=production
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database

The database is automatically initialized on first run. The SQLite database file will be created at `./data/gymble.db`.

### Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── upload/       # Photo upload endpoint
│   │   └── dashboard/    # Dashboard data endpoint
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   └── layout.tsx        # Root layout
├── lib/
│   ├── db.ts             # Database setup and initialization
│   ├── auth.ts           # Authentication utilities
│   └── challenges.ts     # Challenge and streak logic
├── public/
│   └── uploads/          # User-uploaded photos
└── data/                 # SQLite database files
```

## How It Works

### Weekly Challenge System

- Each week runs from Monday to Sunday
- Users must upload at least 5 photos (one per day) to complete the week
- A new challenge automatically starts at the beginning of each week
- Previous challenges are automatically evaluated when a new week begins

### Photo Upload

- Users can upload one photo per day
- Photos must be image files (max 5MB)
- Uploads are stored in `public/uploads/{userId}/`
- Only today's date can be uploaded (prevents backdating)

### Streak Tracking

- A streak is maintained when a user completes at least 5 days in a week
- Streaks continue if the next week is completed within 7 days
- Streaks reset to 0 if a week is not completed
- The platform tracks both current streak and longest streak

### Credit System

- New users start with 1000 credits
- If a week is not completed (< 5 days), 200 credits are deducted
- Credits are displayed on the dashboard

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Upload

- `POST /api/upload` - Upload a photo for today

### Dashboard

- `GET /api/dashboard` - Get user dashboard data (challenge, progress, streak, credits)

## Development

### Build for Production

```bash
npm run build
npm start
```

### Database Schema

- **users**: User accounts with email, password hash, and credits
- **weekly_challenges**: Weekly challenge records
- **daily_uploads**: Daily photo uploads
- **streaks**: User streak tracking

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are stored in HTTP-only cookies
- File uploads are validated for type and size
- SQL injection protection via parameterized queries

## Future Enhancements

- Email notifications for reminders
- Social features (friends, leaderboards)
- Mobile app
- Cloud storage for photos (S3, etc.)
- Advanced analytics and insights
- Custom challenge goals

## License

ISC

