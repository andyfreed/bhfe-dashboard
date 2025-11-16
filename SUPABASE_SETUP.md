# Supabase Setup Guide

## Initial Database Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project or use existing: `ulcppgcgvymedvbtmulm`
   - Note your project URL and API keys

2. **Run Database Schema**
   - In Supabase Dashboard, go to SQL Editor
   - Open the file `supabase/schema.sql`
   - Copy and paste the entire SQL script
   - Click "Run" to execute

   This will create:
   - All necessary tables
   - Indexes for performance
   - Row Level Security (RLS) policies
   - Triggers for automatic timestamp updates

3. **Set Up Authentication**
   - Go to Authentication > Users in Supabase Dashboard
   - Create two users:
     - **Andy**: `andy@example.com` (or your actual email)
     - **Dave**: `dave@example.com` (or Dave's actual email)
   - Set secure passwords for both
   - Copy the user IDs (UUIDs) for the next step

4. **Create User Profiles**
   - Go to SQL Editor in Supabase
   - Run this query (replace UUIDs with actual user IDs from step 3):

   ```sql
   -- Update profiles for existing users
   UPDATE public.profiles
   SET name = 'Andy', email = 'andy@example.com'
   WHERE id = 'andy_user_uuid_here';
   
   UPDATE public.profiles
   SET name = 'Dave', email = 'dave@example.com'
   WHERE id = 'dave_user_uuid_here';
   
   -- Or insert if profiles don't exist
   INSERT INTO public.profiles (id, name, email)
   VALUES 
     ('andy_user_uuid_here', 'Andy', 'andy@example.com'),
     ('dave_user_uuid_here', 'Dave', 'dave@example.com')
   ON CONFLICT (id) DO UPDATE
   SET name = EXCLUDED.name, email = EXCLUDED.email;
   ```

5. **Configure Row Level Security**
   - The schema.sql already includes RLS policies
   - Verify in Supabase Dashboard > Authentication > Policies
   - All tables should have appropriate policies for:
     - Viewing own data
     - Creating new records
     - Updating own records
     - Deleting own records

6. **Set Up Realtime Subscriptions**
   - Go to Database > Replication in Supabase Dashboard
   - Enable replication for these tables:
     - `todos`
     - `calendar_events`
     - `reminders`
     - `projects`
     - `contacts`
     - `notes`
     - `chat_messages`
     - `links`
   - This allows real-time updates in the application

7. **Initialize State Information**
   - The app will automatically create placeholder entries for all 50 US states
   - You can edit state information through the States page in the dashboard
   - Or bulk import via SQL if you have the data

## Environment Variables

Make sure you have these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ulcppgcgvymedvbtmulm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Optional (for server-side operations):
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Testing the Setup

1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000
3. Try logging in with one of the created users
4. Verify you can:
   - Create todos
   - Add calendar events
   - Send chat messages
   - Create contacts
   - Edit state information

## Troubleshooting

### "Error loading data" messages
- Check that RLS policies are enabled
- Verify your user profile exists in the `profiles` table
- Check browser console for specific errors

### Real-time updates not working
- Ensure Realtime is enabled in Supabase Dashboard
- Verify replication is enabled for the tables
- Check network tab for WebSocket connections

### Authentication issues
- Verify users exist in Supabase Auth
- Check that profiles are created for each user
- Ensure email confirmation is not required (or verify emails)

## Additional Configuration

### Email Templates (Optional)
- Go to Authentication > Email Templates
- Customize login and password reset emails

### Storage (Future)
- If you plan to add file uploads:
  - Go to Storage in Supabase Dashboard
  - Create buckets for uploads
  - Set up storage policies

### Edge Functions (Future)
- For WordPress plugin integration:
  - May need Supabase Edge Functions
  - Can be set up later as needed

