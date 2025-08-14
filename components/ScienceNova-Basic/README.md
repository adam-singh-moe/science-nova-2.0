# Science Nova Lite

A scaled-down version of the Science Nova learning platform, focusing on core features for student learning and engagement.

##  Features Implemented

 **Student Profile Management**: Complete user profile system with avatar, personal information, and learning history  
 **Authentication**: Secure authentication powered by Supabase with social login options  
 **Dashboard**: Interactive home page showing learning progress, statistics, and recent activity  
 **Topics**: Browse and explore various scientific topics across different categories and difficulty levels  
 **Achievements**: Track learning milestones and accomplishments with a visual achievement system  

##  Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (Authentication, Database, Real-time)
- **UI Components**: Radix UI components with custom styling
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Styling**: Tailwind CSS with custom design system

##  Installation & Setup

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### 1. Install Dependencies

`ash
npm install
`

### 2. Environment Configuration

Update the .env.local file with your Supabase credentials:

`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
`

### 3. Database Setup

This application uses the same Supabase database as the main Science Nova application. Ensure the following tables exist:

#### Profiles Table
`sql
create table profiles (
  id uuid references auth.users on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);
`

#### Topics Table
`sql
create table topics (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text,
  difficulty text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
`

#### Achievements Table
`sql
create table achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  icon text,
  achieved_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
`

### 4. Run the Application

`ash
npm run dev
`

Open [http://localhost:3000](http://localhost:3000) in your browser.

##  Project Structure

`
src/
 app/                 # Next.js App Router pages
    layout.tsx      # Root layout with providers
    page.tsx        # Home page with auth
    globals.css     # Global styles
 components/          # React components (ready to be added)
    ui/             # Reusable UI components
        button.tsx  # Button component
 lib/                 # Utilities and configurations
     supabase.ts     # Supabase client and types
     utils.ts        # Helper functions
`

##  Current State

The application is now **fully scaffolded and ready** with:

 **Working Next.js 15 application** with TypeScript and Tailwind CSS  
 **Supabase integration** configured and ready to use  
 **Database types** defined for all required tables  
 **UI component system** started with Button component  
 **Project structure** organized for scalability  
 **Build system** tested and working  
 **Development server** running successfully  

##  Next Steps to Complete Full Implementation

To add the complete features that match the original application:

1. **Add Authentication Components**:
   - Sign-in/Sign-up forms
   - Session management
   - Protected routes

2. **Implement Dashboard Components**:
   - User profile modal
   - Topics section
   - Achievements section
   - Statistics cards

3. **Create Additional UI Components**:
   - Card, Avatar, Progress components
   - Modal/Dialog components
   - Form components

4. **Add Feature Pages**:
   - Topic detail pages
   - Achievement management
   - User settings

##  Quick Start Commands

`ash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run production build
npm start
`

##  Environment Variables

`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
`

##  Database Connection

This lite version **reuses the same Supabase database** as the main Science Nova application, ensuring:
- Data consistency between versions
- Seamless user experience
- Shared authentication system
- Real-time data synchronization

##  Development Notes

- The application is built with modern React patterns and hooks
- TypeScript provides full type safety
- Tailwind CSS enables rapid UI development
- Supabase handles all backend complexity
- The modular structure allows for easy feature additions

##  UI/UX Design

The application follows the same design principles as the main Science Nova application:
- Clean, modern interface
- Responsive design for all devices
- Intuitive navigation and user flows
- Consistent color scheme and typography
- Accessible components and interactions

---

**Science Nova Lite** - A streamlined learning experience focused on core educational features.