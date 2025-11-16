# BHFE Dashboard

A comprehensive business management dashboard for CPE course providers. Built with Next.js, Supabase, and Vercel.

## Features

- **To-Do Lists**: Personal and company-wide tasks with recurring capabilities
- **Calendar**: Event management with automatic integration from tasks and to-dos
- **Reminders**: Set reminders with recurring patterns
- **Projects**: Manage projects with sections, priorities, and statuses
- **Contacts**: Business contact directory with tags and notes
- **Notes**: Note-taking with tags and pinning capabilities
- **State Info**: CPE/CE requirements and regulations by US state
- **Real-Time Chat**: Communication between users (Andy and Dave)
- **Quick Links**: Frequently visited websites
- **Time/Date Display**: Current time and date shown in the sidebar

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (auto-deploy from GitHub)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- GitHub account
- Vercel account

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/andyfreed/bhfe-dashboard.git
   cd bhfe-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ulcppgcgvymedvbtmulm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   OPENAI_API_KEY=your_openai_key_here
   ```

4. **Set up Supabase database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `supabase/schema.sql` to create all tables and policies
   - Enable Row Level Security (RLS) is already configured in the schema

5. **Create user accounts**
   - In Supabase Dashboard, go to Authentication > Users
   - Create accounts for Andy and Dave:
     - Email: andy@example.com (or your email)
     - Password: (choose a secure password)
     - Email: dave@example.com (or Dave's email)
     - Password: (choose a secure password)
   
   - After creating users, update their profiles:
     ```sql
     INSERT INTO public.profiles (id, name, email)
     VALUES (
       'user_id_from_auth_users', 
       'Andy', 
       'andy@example.com'
     );
     
     INSERT INTO public.profiles (id, name, email)
     VALUES (
       'user_id_from_auth_users', 
       'Dave', 
       'dave@example.com'
     );
     ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Automatic Deployment

1. **Connect GitHub repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository `andyfreed/bhfe-dashboard`
   - Vercel will auto-detect Next.js

2. **Configure environment variables in Vercel**
   - In your Vercel project settings, go to Environment Variables
   - Add all the variables from your `.env.local` file:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (optional, for server-side operations)
     - `OPENAI_API_KEY` (optional, for future chatbot feature)

3. **Deploy**
   - Vercel will automatically deploy when you push to GitHub
   - The main branch will trigger production deployments
   - Preview deployments are created for pull requests

### Manual Deployment

```bash
npm run build
vercel --prod
```

## Database Schema

The application uses the following main tables:

- `profiles` - User profiles
- `todos` - Personal and company to-do items
- `calendar_events` - Calendar events
- `reminders` - Reminders with recurring patterns
- `projects` - Project management
- `project_sections` - Project sections
- `contacts` - Business contacts
- `notes` - User notes
- `state_info` - CPE/CE state requirements
- `chat_messages` - Real-time chat messages
- `links` - Quick links to websites

See `supabase/schema.sql` for the complete schema definition.

## Features in Detail

### Authentication
- Email/password authentication via Supabase
- Protected routes with middleware
- Session management

### Real-Time Updates
- Real-time subscriptions for todos, calendar events, reminders, contacts, notes, chat messages, and links
- Instant updates when data changes

### Recurring Tasks
- Todos and reminders support recurring patterns:
  - Daily
  - Weekly
  - Monthly
  - Yearly

### Calendar Integration
- Calendar automatically shows:
  - Calendar events
  - Todo items with due dates
  - Visual distinction between personal and company tasks

### State Information
- Pre-loaded with all 50 US states
- Each state can have:
  - CPE requirements
  - CE requirements
  - Renewal period information
  - Contact information
  - Website links
  - Notes

## 1Password Integration

To integrate 1Password for password lookups:

1. **Install 1Password CLI**
   - Download from: https://developer.1password.com/docs/cli/get-started/
   - Follow the setup instructions

2. **Use 1Password Connect API** (for production)
   - Set up 1Password Connect server
   - Configure API credentials
   - Add environment variables for 1Password API

3. **Alternative: Browser Extension**
   - Install 1Password browser extension
   - Users can use it to fill passwords on login forms
   - Can search for passwords directly from the browser

For more information, see: https://developer.1password.com/

## Future Enhancements

- WordPress plugin integration for website communication
- OpenAI chatbot integration for app assistance
- Email notifications for reminders and tasks
- File attachments for notes and contacts
- Advanced filtering and sorting
- Export/import functionality
- Mobile app

## Development

### Project Structure

```
bhfe-dashboard/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page (redirects)
├── components/            # React components
│   ├── dashboard/        # Dashboard-specific components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions
│   └── supabase/         # Supabase client utilities
├── supabase/             # Database schema
│   └── schema.sql        # SQL schema file
├── middleware.ts         # Next.js middleware for auth
└── vercel.json           # Vercel configuration
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Support

For issues or questions, please open an issue on GitHub.

## License

Private - All rights reserved
