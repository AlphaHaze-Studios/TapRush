# Tap Rush - Hyper-Casual Reflex Game

## Overview

Tap Rush is a hyper-casual mobile reflex game built with React, TypeScript, and Canvas. Players must tap falling shapes that match dynamically changing rules (e.g., "Tap only RED circles"). The game features escalating difficulty, combo mechanics, frenzy modes, and Web Audio API sound effects. The application uses a full-stack architecture with Express backend and React frontend, though the current implementation is primarily client-side focused.

The project is structured as a monorepo with shared schemas between client and server, using Vite for frontend builds and esbuild for backend bundling. It's designed for eventual deployment to the Google Play Store as an HTML5 game.

## Recent Changes

### Production-Ready for Play Store (November 2025)
- **Removed all debug console.log statements** for production build
- **Fixed database security** - Removed unused users table with plaintext passwords
- **Optimized performance** - Score popups now use refs instead of state to prevent GC hitches
- **Added Privacy Policy** - Complete privacy documentation for Play Store compliance
- **Added Attribution** - Proper attribution for all fonts, assets, and libraries
- **Ready for AdMob integration** - Ad manager structure in place for future monetization

### Game Logic Fix (November 2025)
- **Fixed Critical Gameplay Bug**: Adjusted shape spawn probability dynamically
- Game now properly spawns a healthy mix of correct shapes (35%) and distractor shapes (65%)
- Previously, rules like "TAP FRUITS ONLY" would spawn too many fruits, making game too easy
- Previously, rules like "TAP GREEN ONLY" wouldn't spawn enough green shapes, making game impossible
- Balance now creates proper challenge where players must selectively tap correct shapes

### Sound System Upgrade
- Upgraded from HTMLAudio to Web Audio API for sound effects (pop, buzz, whoosh)
- Created `soundManager` with proper audio buffer loading and playback
- Integrated ad system placeholders for future AdMob integration

### Database & Persistence
- PostgreSQL database provisioned with Neon
- Created schema for leaderboard, daily challenges, and challenge completions
- Supports future Firebase/backend integration for global features

### New Features Complete
- **Daily Challenges**: Unique daily challenges with localStorage tracking and UI
- **Leaderboard**: Local leaderboard with score submission and top 10 ranking display
- **Skins System**: 5 unlockable color schemes with rewarded ad integration
  - Default (Neon Classic), Sunset Vibes, Ocean Depths, Fire Storm, Cyberpunk
- **Ad Integration**: Interstitial ads on restart, rewarded ads for skin unlocks

### All MVP and Next Phase Features Complete
- Web Audio API sound effects
- Daily challenges system
- Leaderboard (localStorage-based, ready for backend)  
- Skin/theme unlock system with ad rewards
- AdMob integration structure (placeholder for production)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React 18** with TypeScript for UI components
- **Vite** as the build tool and development server
- **Tailwind CSS** for styling with custom theme variables
- **Radix UI** for accessible component primitives
- **Canvas API** for game rendering (shape drawing, animations, particle effects)
- **Zustand** for state management with selector subscriptions
- **TanStack Query** for server state management (prepared but not actively used)

**Design Patterns:**
- Component-based architecture with clear separation between game logic and UI
- Custom hooks for responsive design (`useIsMobile`)
- Store-based state management for game phase and audio controls
- Local storage utilities for high score persistence

**Game Architecture:**
- Canvas-based rendering with requestAnimationFrame loop
- Shape spawning system with randomized types, colors, positions, and speeds
- Rule engine that changes game conditions every 10 seconds
- Particle system for visual feedback on successful taps
- Combo and frenzy mode mechanics for score multipliers

**Key Architectural Decisions:**
- **Problem:** Need smooth 60fps game rendering
- **Solution:** Direct Canvas API manipulation instead of DOM-based animations
- **Rationale:** Canvas provides better performance for dynamic, constantly updating game objects
- **Pros:** High performance, pixel-perfect control
- **Cons:** More complex than CSS animations, harder to debug

### Backend Architecture

**Technology Stack:**
- **Express.js** for HTTP server
- **TypeScript** with ESM modules
- **Drizzle ORM** for database operations
- **PostgreSQL** via Neon serverless driver
- **Session management** using connect-pg-simple (configured but not implemented)

**Design Patterns:**
- Middleware-based request handling
- Storage abstraction layer (interface pattern) allowing swap between memory and database storage
- Vite middleware integration for development HMR
- Separate route registration pattern

**Current State:**
- Backend routes are minimal (placeholder only)
- Storage interface defined but only in-memory implementation exists
- Authentication system prepared but not implemented
- API endpoints not yet created for game features

**Key Architectural Decisions:**
- **Problem:** Need flexibility to switch between development and production data storage
- **Solution:** IStorage interface with MemStorage and potential DbStorage implementations
- **Rationale:** Allows rapid prototyping without database while maintaining upgrade path
- **Pros:** Fast development iteration, easy testing
- **Cons:** In-memory storage loses data on restart

### Data Storage

**Database Schema:**
- PostgreSQL database using Drizzle ORM
- Schema location: `shared/schema.ts`
- Current tables: `users` (id, username, password)
- Zod validation schemas for type-safe inserts

**Key Architectural Decisions:**
- **Problem:** Need type-safe database operations shared between client and server
- **Solution:** Centralized schema in `shared/` directory with Drizzle + Zod
- **Rationale:** Single source of truth for data structures, compile-time type safety
- **Pros:** Type safety, schema migrations, excellent DX
- **Cons:** Requires database provisioning, migration management

**Future Expansion:**
- Daily challenges table (planned but not implemented)
- Leaderboard tables (prepared in `futureFeatures.ts`)
- User skins/themes data (interface defined)

### External Dependencies

**Database:**
- **Neon Serverless PostgreSQL** - Cloud PostgreSQL database
- Connection via `@neondatabase/serverless` package
- Configuration in `drizzle.config.ts`
- Environment variable: `DATABASE_URL`

**UI Component Libraries:**
- **Radix UI** - Headless accessible component primitives (accordion, dialog, dropdown, etc.)
- Extensive component library covering 30+ UI patterns
- Custom styled using Tailwind CSS utilities

**Build Tools:**
- **Vite** - Frontend build tool with HMR and development server
- **esbuild** - Backend bundling for production
- **GLSL plugin** - Shader support for potential 3D features
- **PostCSS** - CSS processing with Tailwind

**Graphics/Animation (Prepared):**
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components for 3D scenes
- **@react-three/postprocessing** - Post-processing effects
- Note: 3D libraries included but not currently utilized

**Utilities:**
- **date-fns** - Date manipulation
- **clsx** + **tailwind-merge** - Conditional className utilities
- **class-variance-authority** - Variant-based component styling
- **cmdk** - Command palette component
- **nanoid** - Unique ID generation

**Future Integration Points:**
- Ad monetization system (placeholder in `adManager.ts`)
- Google Play Store deployment configuration needed
- Social features (leaderboards, sharing) - interfaces defined

**Font Assets:**
- Google Fonts: Orbitron (dynamically loaded for game UI)
- Inter font (local via @fontsource)

#### Publishers: AlphaHaze Studios