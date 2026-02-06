# Elizabeth - Cancer Support & Healing Journey App

## Overview
Elizabeth is a web application supporting cancer patients based on Radical Remission research focusing on nine key healing factors. Features include a clean dark elegant interface, OpenAI-powered AI assistance, medical tracking, and personalized guidance. The first user is named "Liz."

## Recent Changes
- **Feb 2026**: Softened visual design for warmer, more supportive feel
  - Palette shifted warmer: backgrounds lighter/warmer, sage green primary, gentle honey accent
  - Reduced harsh contrasts, increased border-radius for softer rounded elements
  - Glow effects toned down for gentler visual impact
  - All pages updated with consistent soft warm dark theme
- **Feb 2026**: Initial dark elegant theme with serif typography (Cinzel/Lora)

## User Preferences
- Soft, warm, supportive design aesthetic (cancer support app)
- Dark theme but not too harsh - warm cocoa-toned backgrounds
- Serif fonts (Cinzel headings, Lora body)
- Honey/amber accent color (not sharp gold) for key elements
- Sage green primary (not deep forest green) for softer feel

## Project Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon-backed via Replit)
- **ORM**: Drizzle
- **Routing**: wouter (frontend), Express (backend)
- **State**: TanStack React Query + UserContext
- **AI**: OpenAI API (requires billing credits)

### Key Files
- `client/src/App.tsx` - Main router and providers
- `client/src/index.css` - Global styles and CSS variables (dark theme)
- `client/src/components/Layout.tsx` - Main layout with sidebar
- `client/src/components/Sidebar.tsx` - Navigation sidebar (dark themed)
- `client/src/pages/SimpleDashboard.tsx` - Main dashboard page
- `server/routes.ts` - API routes
- `server/storage.ts` - Data storage interface
- `shared/schema.ts` - Database schema and types

### Design System
- Background: `hsl(25, 20%, 13%)` - warm cocoa dark
- Card background: `hsl(25, 16%, 17%)` - warm brown
- Primary: `hsl(158, 28%, 38%)` - soft sage green
- Accent/Honey: `hsl(34, 45%, 62%)` - gentle honey amber
- Text: `hsl(30, 28%, 92%)` - warm cream white
- Muted text: `hsl(28, 15%, 58%)` - warm taupe
- Borders: `hsl(25, 10%, 25%)` - soft borders
- Border radius: `0.625rem` - rounded, friendly
- Heading font: `font-heading` (Cinzel)
- Body font: `font-body` (Lora)

### Notes
- AI Assistant requires OpenAI billing credits to function
- App auto-logs in as user "liz" (legacy auth mode)
- Google Fonts loaded via CDN in index.html
