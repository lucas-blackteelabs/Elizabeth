# Elizabeth - Cancer Support & Healing Journey App

## Overview
Elizabeth is a web application designed to support cancer patients by integrating insights from Radical Remission research. It focuses on nine key healing factors, offering personalized tools and guidance to assist users throughout their healing journey. The application provides features such as an AI-powered assistant (Google Gemini), medical tracking, AI-generated meal plans, and a nurturing user interface. Its core purpose is to empower cancer patients with accessible, personalized support and resources.

## User Preferences
- LIGHT MODE - soft, warm, nurturing design aesthetic
- Serif fonts (Cinzel headings, Lora body)
- Honey/amber accent color for key elements
- Sage green primary color
- Warm cream/ivory backgrounds (not harsh white)
- Cancer support app should feel gentle, supportive, nurturing

## System Architecture
The application is built with a React, Vite, TypeScript, and Tailwind CSS frontend, utilizing `shadcn/ui` for UI components. The backend is an Express.js application written in TypeScript. Data persistence is managed with PostgreSQL, hosted on Neon, and accessed via the Drizzle ORM. Frontend routing is handled by `wouter`, while backend routing uses Express. State management relies on TanStack React Query and a UserContext. All AI functionalities are powered by the Google Gemini API.

**UI/UX Decisions:**
- **Color Scheme:** Warm cream backgrounds, soft white cards, sage green primary, honey amber accent, warm dark brown text.
- **Typography:** Serif fonts (Cinzel for headings, Lora for body).
- **Design Elements:** Soft rounded corners (0.75rem), gentle shadows, consistent theming across components.

**Technical Implementations:**
- **Authentication:** JWT-based persistent login with a 90-day session. Role-based access: "user" (default) and "admin" roles.
- **Admin Panel:** Admin users (role=admin) can view all registered users (with email, phone, address, timezone), moderate community threads/replies/group posts. Lucas/Cookie is the seeded admin account.
- **PWA Support:** Configured for Progressive Web App installation with offline caching via a service worker. App store ready manifest with categories and orientation.
- **Dashboard:** Features a streamlined dashboard with core widgets (Scan Countdown, Treatment Journey, Tumour Response, Today's Vibe, Worth Fighting For), customizable via a widget picker.
- **Medical Tracking:** Comprehensive system including AI-generated medical summaries, document management (scans, blood tests, pathology), visual tumour cards with SVG graphics and progress bars, and scan comparison tables. Users can manually add new scan entries and edit existing tumour data. Tumour Response widget supports adding tumours directly and uploading medical documents for AI-powered tumour data extraction.
- **Nutrition:** AI-generated personalized meal plans, structured meal cards with recipes, a "Discover" tab for new meal ideas, a "Saved" tab for shortlisted recipes, and an auto-generated shopping list.
- **Treatment+:** Visual management of treatment programs (immunotherapy, complementary therapies), progress tracking, side effect logging, and AI-powered treatment suggestions.
- **Community:** A Reddit-style discussion forum with thread creation, replies, categories, and live data synchronization. Community Groups feature (Facebook/LinkedIn-style) with browse, join/leave, group-specific feeds, posts and replies. Membership enforcement on posting/replying (admin users bypass). 6 seeded groups. User profile popup on author name tap (cancer type, treatment days, bio). Admin badge on admin user posts/replies. Seeded accounts: Liz/Cookie (user), Lucas/Cookie (admin), Test/Test (user, mirrors Liz's profile).
- **Timeline:** Vertical chronological view integrating appointments and treatment sessions with full CRUD operations and ICS calendar download.
- **Date Night:** AI-powered restaurant and activity suggestions with dietary suitability assessments, shortlisting, and integration with the user's calendar.
- **Nano Banana:** Utilizes multimodal AI to generate personalized motivational captions from user-uploaded images and personal notes.
- **Community - Verified Survivors:** Tabbed community section (Threads, Survivors, Talks). Verified survivors have distinct visual treatment (amber badges, gradient avatars). Users can book 1-on-1 video sessions via available time slots. Survivors host periodic talks/events with RSVP system. Includes double-booking prevention and duplicate RSVP guards.
- **Sleep Tracker:** Dashboard widget for tracking sleep hours and quality (1-5 stars). Manual entry with hours slider, quality picker, and optional notes. 7-day bar chart visualization, today's sleep stats, and weekly averages. Future-proofed with `source` field for wearable integrations (Whoop, etc.).
- **Stripe Subscription:** New users must subscribe to access the app. Two plans: Monthly ($9.95/month) and Annual ($7.99/month, billed $95.88/year). Registration flow: Register -> auto-login -> redirect to /subscribe pricing page -> Stripe Checkout -> verify session -> access granted. Grandfathered users (Liz, Lucas) and admins bypass subscription requirement. Webhook handler syncs subscription status (active/canceled/past_due) from Stripe events to users table. Stripe integration uses stripe-replit-sync for schema management and data sync, with webhook route registered before express.json() middleware.

## External Dependencies
- **Database:** PostgreSQL (Neon)
- **AI:** Google Gemini API (gemini-2.5-flash)
- **Image Generation:** Google Imagen (for AI-generated images, when billing is available)
- **Payments:** Stripe (via stripe-replit-sync connector) - subscription billing for membership plans
- **Frontend Libraries:** React, Vite, Tailwind CSS, shadcn/ui, TanStack React Query, wouter
- **Backend Libraries:** Express.js, Drizzle ORM, stripe, stripe-replit-sync
- **Other Services:** Google Fonts (via CDN)