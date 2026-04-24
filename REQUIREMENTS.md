# Game Dashboard Requirements

## Project Overview

Build a standalone React game dashboard application with multiple playable games (currently Hangman and Pacman-lite), polished UI/UX, and configurable settings based on user preferences.

## Core Requirements

### 1) Standalone App

- The app must run independently as a separate React + TypeScript project.
- It must include routing between dashboard and game pages.

### 2) Multi-Game Dashboard

- A dashboard page must list available games.
- Each game card must provide:
  - Game title
  - Short description
  - Play action
- Navigation should support quick switching among Dashboard, Hangman, and Pacman.

### 3) Hangman Enhancements

- Hangman must be fully playable end-to-end.
- Word source must support category tagging.
- Category selection must support:
  - Single category play
  - Multi-category play
- Add dynamic settings so users can tune gameplay:
  - Category multi-select
  - Max wrong attempts
  - Category hint visibility toggle
- The game must include:
  - Keyboard and button letter input
  - Win and lose states
  - Restart/new word flow
  - Gameplay feedback (status text, attempts left, streak)

### 4) Pacman-lite Enhancements

- Pacman-lite must be playable with:
  - Board rendering
  - Movement
  - Pellet collection
  - Ghost movement
  - Collision handling
  - Lives and score
  - Pause/resume and restart
- Add dynamic settings for user requirements:
  - Player speed
  - Ghost speed
  - Ghost count
- Include keyboard controls and on-screen control pad for accessibility and mobile support.

### 5) Interactive and Catchy UI

- Improve visual quality with a modern arcade-style look.
- Add richer interactions:
  - Hover states
  - Press states
  - Smooth transitions
  - Strong visual hierarchy
- Keep game UI consistent using shared layout patterns.

### 6) Code and Architecture Standards

Follow `ai-prompt/react-expert.md` principles:

- Feature-based folder structure
- Reusable and composable components
- Functional components and hooks
- Minimal state and clear separation of concerns
- Performance-aware rendering and maintainable code

## Non-Functional Expectations

- Responsive behavior for desktop and smaller screens
- Clear accessibility labels for interactive controls
- Production-ready code organization for future game expansion

## Current Scope (v1)

- Included games:
  - Hangman (category-driven, multi-category, configurable)
  - Pacman-lite (configurable, playable)
  - Imposter (fully customizable setup and social round flow)
- Future games can be added as new feature modules with dashboard integration.

## Additional Delivered Enhancements

- Hangman dictionary expanded to 50 built-in words per category for:
  - tech
  - gaming
  - movies
  - science
  - sports
  - travel
- Hangman setup includes difficulty filtering:
  - easy
  - medium
  - hard
  - mixed
- Imposter setup dialog includes:
  - number of players
  - number of imposters
  - category
  - number of rounds
  - category hint toggle
