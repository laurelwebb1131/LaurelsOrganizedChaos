# Hearthwise

Hearthwise is a first working prototype of a gentle Life Operating System: a cozy dashboard for seeing the shape of today, tending small rituals, and choosing the next kind thing.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal. The production build can be checked with:

```bash
npm run build
```

## Prototype scope

This version uses mock data and focuses on the Today room. The sidebar rooms (Rituals, Quests, Realms, and Journal) have working navigation and intentional placeholder states, while Today includes interactive task completion, mood/energy check-in, familiar guidance, weekly rhythm, and realm overview.

## Stack

React, TypeScript, and Vite. Styling is plain CSS so the visual system stays easy to extend without introducing a component-library dependency.
