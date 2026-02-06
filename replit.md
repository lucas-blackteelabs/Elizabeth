# Elizabeth - Cancer Support & Healing Journey App

## Overview
Elizabeth is a web application supporting cancer patients based on Radical Remission research focusing on nine key healing factors. Features include a clean dark elegant interface, OpenAI-powered AI assistance, medical tracking, and personalized guidance. The first user is named "Liz."

## Recent Changes
- **Feb 2026**: Complete visual redesign - dark elegant theme inspired by "The Invitational" style
  - Color scheme: Dark background (hsl(30,15%,7%)), deep green primary (hsl(152,70%,18%)), gold accent (hsl(42,80%,55%))
  - Typography: Cinzel (serif) for headings, Lora (serif) for body text
  - All pages updated with consistent dark theme, gold accents, green highlights
  - Cards use dark backgrounds with subtle borders, gold heading text
  - Buttons: Primary CTAs use gold background with dark text

## User Preferences
- Dark, elegant, professional design aesthetic
- Serif fonts (Cinzel headings, Lora body)
- Gold accent color for key elements
- Cancer support app should feel warm and supportive

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
- Background: `hsl(30, 15%, 7%)` - warm dark brown-black
- Card background: `hsl(30, 10%, 11%)` - slightly lighter
- Primary: `hsl(152, 70%, 18%)` - deep forest green
- Accent/Gold: `hsl(42, 80%, 55%)` - warm gold
- Text: `hsl(40, 20%, 93%)` - warm off-white
- Muted text: `hsl(35, 10%, 55%)` - warm gray
- Borders: `hsl(30, 8%, 20%)` - subtle dark borders
- Heading font: `font-heading` (Cinzel)
- Body font: `font-body` (Lora)

### Notes
- AI Assistant requires OpenAI billing credits to function
- App auto-logs in as user "liz" (legacy auth mode)
- Google Fonts loaded via CDN in index.html
