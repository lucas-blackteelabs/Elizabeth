# Elizabeth - Cancer Support & Healing Journey App

## Overview
Elizabeth is a web application supporting cancer patients based on Radical Remission research focusing on nine key healing factors. Features include a warm, soft light mode interface, Google Gemini-powered AI assistance, medical tracking, AI-generated meal plans, and personalized guidance. The first user is named "Liz."

## Recent Changes
- **Feb 2026**: Restaurant Search feature on Date Night page
  - New "Search" tab: search any Sydney restaurant by name, cuisine, or suburb
  - AI-powered dietary suitability assessment (1-10 score) with colour-coded badges
  - Review highlights, ratings, opening hours, contact info, and menu suggestions
  - Shortlist and "Book It" actions on searched restaurants
  - Detail dialog with full info including dietary notes, suitability explanation, and review quotes
  - New API endpoint: /api/ai/restaurant-search (Gemini-powered with multi-model fallback)
- **Feb 2026**: Meal Planner overhaul (DateNight-style)
  - AI-generated structured meal cards with photos, recipes, ingredients, instructions
  - 10 beautiful food category images (breakfast bowl, smoothie, salad, soup, fish, grain bowl, snack, tea, chicken, berry bowl)
  - Discover tab: AI generates 6 meals with filter by type (breakfast, lunch, dinner, snack, smoothie, tea)
  - Saved tab: shortlist recipes with pin/unpin (localStorage persistence)
  - Shopping tab: auto-generated categorised shopping list (produce, proteins, pantry, spices)
  - Dismiss functionality with smooth animations (dismissed meals don't reappear)
  - Click-to-detail dialog with full recipe, healing benefits, ingredients, step-by-step instructions
  - "More breakfast/lunch/dinner/snack" buttons to load additional recipes
  - Tags with color-coded badges (anti-inflammatory, liver-support, omega-3, etc.)
  - New API endpoint: /api/ai/meal-ideas (structured JSON from Gemini)
- **Feb 2026**: Design system modernisation
  - All hardcoded HSL color values replaced with CSS variable-based Tailwind classes
  - text-muted-foreground, text-foreground, text-accent, bg-white, bg-muted, border-border
  - Consistent theming across 20+ component/page files
- **Feb 2026**: Fixed authentication system
  - Login credentials: username "Liz", password "Cookie"
  - Persistent login with 90-day JWT + cookie session
  - First-time users can register via /register
  - Migrated old "." account to new "Liz" credentials
- **Feb 2026**: PWA (Progressive Web App) support
  - App can be installed on phones via "Add to Home Screen"
  - Install prompt popup appears on first visit with instructions
  - Service worker for offline caching (network-first strategy)
  - App icons (192px, 512px) and manifest.json configured
  - iOS and Android install flows supported
- **Feb 2026**: Compact clickable dashboard widgets with expand-to-detail UX
  - Top stats (Scan Countdown, Treatment Journey, Immune Recovery, Healing Streak) are compact tiles
  - Clicking a compact tile opens a dialog with full detail, charts, and milestones
  - Smooth hover animations, lift effects, and modern transitions throughout
  - Healing tools grid now includes Date Night link
- **Feb 2026**: Date Night feature (enhanced)
  - Gemini-powered structured restaurant cards with summaries, dietary notes, menu suggestions
  - Click-to-detail view for restaurants and activities with full information
  - Save date nights to calendar with date picker
  - History tab: upcoming planned dates and completed dates with star ratings and reviews
  - Dietary preferences stored on user profile (editable in Profile page)
  - AI factors dietary preferences but doesn't strictly exclude (partner can eat other things)
  - Liz's defaults: sugar-free, dairy-free, fish or organic chicken
  - Activity cards with categories (active, relaxing, creative, adventurous, romantic)
  - Database table: date_nights (with rating, review, status fields)
  - API endpoints: /api/ai/date-night (structured JSON), /api/date-nights (CRUD)
- **Feb 2026**: Customizable dashboard with pick-and-mix widget system
  - 10 widgets: Scan Countdown, Treatment Journey, Tumour Response chart, Today's Wellness, Immune Recovery, Healing Streak, Treatment Timeline, AI Assistant, Appointments, Daily Inspiration
  - Widget picker dialog stores preferences in localStorage
  - Tumour Response widget with recharts bar chart showing size/SUV reduction
  - Reframed "days off treatment" to "Days of Treatment Journey"
  - Visual scan countdown ring with SVG progress circle
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
- Login: username "Liz", password "Cookie" (90-day persistent session)
- Google Fonts loaded via CDN in index.html
