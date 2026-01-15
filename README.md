# Trace

**Asset Tracking & Project Management System**

Trace is a powerful, team-oriented asset tracking and project management platform built with modern web technologies. Track assets through their lifecycle, manage team assignments, monitor project health, and maintain comprehensive audit logs.

## Features

- 📦 **Asset Management**: Import assets from ZIP files, organize by folders, track status (Pending → Received → Implemented)
- 👥 **Team Collaboration**: Role-based access control, assign tasks to team members, track assignments
- 📊 **Project Health Monitoring**: Real-time project statistics, health percentage, high-risk alerts
- 📝 **Activity Logs**: Complete audit trail of all status changes with user attribution
- 🔄 **Revision Tracking**: Automatic revision counting for rework cycles
- 💬 **Notes & Comments**: Add notes to assets, forced comments for rework scenarios
- 🎯 **Smart Filtering**: Filter by "My Tasks", "High Churn" assets, search by name/path
- 📁 **Folder Organization**: Hierarchical folder structure with collapsible tree view

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd trace

# Install dependencies
npm install

# Set up environment variables
# Create .env file with your Supabase credentials:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev
```

### Database Setup

1. Create a Supabase project
2. Run the migration files from `supabase/migrations/` in order
3. Ensure RLS policies are configured correctly
4. Set up the `profiles` table with `nickname` column

## Project Structure

```
trace/
├── src/
│   ├── components/        # React components
│   │   ├── AssetTable/   # Asset table components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase client & types
│   ├── pages/            # Page components
│   └── lib/              # Utility functions
├── supabase/
│   └── migrations/      # Database migrations
└── public/               # Static assets
```

## Deployment

### Build for Production

```bash
npm run build
```

The `dist/` folder will contain the production-ready files.

### Deploy to Vercel/Netlify

1. Connect your repository
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy!

### Environment Variables

Required environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Usage

1. **Create a Project**: Click "NEW PROJECT" and enter a project name
2. **Invite Team Members**: Add member emails during project creation or via Project Settings
3. **Import Assets**: Use "Import Structure" to upload a ZIP file with your asset files
4. **Track Progress**: Update asset status, assign to team members, add notes
5. **Monitor Health**: View project statistics and health percentage
6. **Review Activity**: Check the Logs tab for complete activity history

## Role-Based Access

- **Project Owner**: Full control - can assign tasks to anyone, manage team members, delete project
- **Team Member**: Can only claim tasks (assign to self) or release them (unassign)

## License

[Your License Here]

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ using modern web technologies
