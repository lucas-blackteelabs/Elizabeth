# Elizabeth - Cancer Support & Healing Journey App

## Overview
Elizabeth is a web application supporting cancer patients based on Radical Remission research focusing on nine key healing factors. Features include a warm, soft light mode interface, Google Gemini-powered AI assistance, medical tracking, AI-generated meal plans, and personalized guidance. The first user is named "Liz."

## Recent Changes
- **Feb 2026**: Switched AI from OpenAI to Google Gemini (gemini-2.5-flash)
  - AI Assistant chat now uses Gemini API via @google/generative-ai SDK
  - Added AI-generated personalised meal plans on Nutrition page
  - Added AI meal suggestions in meal logging dialog on Dashboard
  - Removed old server/ai.ts (had hardcoded OpenAI key)
  - New API endpoints: /api/ai/meal-plan, /api/ai/meal-suggestion
- **Feb 2026**: Complete redesign to LIGHT MODE - soft, warm, nurturing feel
  - Warm cream backgrounds, soft white cards, sage green primary, honey amber accent
  - Dark warm text on light backgrounds for readability
  - All 20+ component/page files updated for consistent light mode
  - Softer rounded corners (0.75rem), gentle shadows
- **Feb 2026**: Softened dark theme (superseded by light mode)
- **Feb 2026**: Initial dark elegant theme with serif typography (Cinzel/Lora)

## User Preferences
- LIGHT MODE - soft, warm, nurturing design aesthetic
- Serif fonts (Cinzel headings, Lora body)
- Honey/amber accent color for key elements
- Sage green primary color
- Warm cream/ivory backgrounds (not harsh white)
- Cancer support app should feel gentle, supportive, nurturing

## Project Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon-backed via Replit)
- **ORM**: Drizzle
- **Routing**: wouter (frontend), Express (backend)
- **State**: TanStack React Query + UserContext
- **AI**: Google Gemini API (gemini-2.5-flash via @google/generative-ai)

### Key Files
- `client/src/App.tsx` - Main router and providers
- `client/src/index.css` - Global styles and CSS variables (light theme)
- `client/src/components/Layout.tsx` - Main layout with sidebar
- `client/src/components/Sidebar.tsx` - Navigation sidebar (light themed)
- `client/src/pages/SimpleDashboard.tsx` - Main dashboard page
- `server/routes.ts` - API routes
- `server/storage.ts` - Data storage interface
- `shared/schema.ts` - Database schema and types

### Design System
- Background: `hsl(35, 45%, 96%)` - warm cream
- Card background: `hsl(36, 40%, 98%)` - soft white
- Primary: `hsl(158, 32%, 42%)` - sage green
- Accent/Honey: `hsl(34, 55%, 52%)` - honey amber
- Text: `hsl(25, 35%, 22%)` - warm dark brown
- Muted text: `hsl(25, 18%, 48%)` - warm medium brown
- Borders: `hsl(30, 25%, 87%)` - soft warm gray
- Sidebar: `hsl(32, 35%, 94%)` - warm off-white
- Border radius: `0.75rem` - rounded, friendly
- Heading font: `font-heading` (Cinzel)
- Body font: `font-body` (Lora)

### Notes
- AI Assistant uses Google Gemini API (GOOGLE_API_KEY secret)
- AI features: Chat assistant, personalised meal plans, meal suggestions
- App auto-logs in as user "." / "." (Liz account)
- Google Fonts loaded via CDN in index.html
