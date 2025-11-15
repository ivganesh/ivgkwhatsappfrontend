# IVGK WhatsApp Platform - Frontend

Next.js frontend application for the IVGK WhatsApp Business Platform.

## Features

- ✅ User Authentication (Login/Register)
- ✅ Company Onboarding
- ✅ WhatsApp Connection (Meta Embedded Signup)
- ✅ Dashboard with Statistics
- ✅ Messages Interface
- ✅ Templates Management
- ✅ Campaigns Management
- ✅ Modern UI with TailwindCSS & shadcn/ui

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_META_APP_ID=3449670348602936
   NEXT_PUBLIC_META_CONFIG_ID=2216301802211791
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3001](http://localhost:3001)

## Project Structure

```
frontend/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard pages
│   └── onboarding/        # Onboarding flow
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── dashboard/        # Dashboard components
├── lib/                   # Utilities and configurations
│   ├── api/              # API client functions
│   └── store/            # Zustand stores
└── public/               # Static assets
```

## Available Routes

- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/onboarding` - Company creation
- `/dashboard` - Main dashboard
- `/dashboard/messages` - Messages interface
- `/dashboard/templates` - Templates management
- `/dashboard/campaigns` - Campaigns management
- `/dashboard/whatsapp/connect` - WhatsApp connection

## Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Backend Integration

The frontend connects to the NestJS backend API. Make sure the backend is running on `http://localhost:3000` before starting the frontend.
