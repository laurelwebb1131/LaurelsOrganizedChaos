# Hearthwise design system

## Direction

**Playful Spooky Familiar** is a high-detail, friendly-gothic visual world for a 3D life operating system. Hearthwise should feel like stepping into a high-end stylized RPG: an Earth-like mythic planet with cinematic lighting, tactile materials, expressive characters, recognizable oceans and continents, and gods, spirits, dragons, and folklore creatures living alongside everyday life.

The interface is not a generic productivity dashboard, a Halloween theme, or a dark-mode SaaS template. It is a personal world where a crow, owl, bat, moon, dragon, and divine beings act as a living visual language for attention, wisdom, motion, rest, courage, and mystery. Locations are the primary information architecture: the user visits a place to work on a part of life.

## Color roles

Use color by role, not decoration:

| Role | Token | Use |
| --- | --- | --- |
| Void | `#08080B` | App shell, page edges, deepest contrast |
| Ink | `#111118` | Main work surfaces and cards |
| Plum | `#24152F` | Familiar surfaces, selected navigation, atmospheric depth |
| Plum light | `#38204A` | Hover states, subtle illustration fields |
| Hot pink | `#FF3D9B` | Primary actions, completion, active signal, familiar spark |
| Pink soft | `#FF9DCD` | Secondary emphasis on dark surfaces |
| Ritual purple | `#9257E3` | Rituals, streaks, magical/detail accents |
| Moon blue | `#56B4FF` | Energy, time, links, moonlight data |
| Silver | `#C9CDD8` | Primary cool text, borders, moon surfaces |
| Ash | `#938C9D` | Secondary text and metadata |

Hot pink is the strongest signal. Purple, blue, and silver should create hierarchy around it, not compete with it. Avoid gradients on text and avoid using all accents in one component.

## Typography

- **Display:** Fraunces, weight 500-600. Use for page titles, familiar messages, and room names.
- **Interface:** DM Sans, weight 400-700. Use for navigation, controls, metadata, and task content.
- Display copy should be short and expressive. Interface copy should be direct and kind.
- Body text must remain readable on `#111118` at accessible contrast. Never use ash for essential actions.

## Illustration language

Illustrations are high-detail, expressive companion characters with clear faces, readable gestures, and a slightly mischievous storybook personality. Use layered SVG or authored CSS art over emoji as the final visual. Characters can sit inside crisp silhouette and line-work environments:

- **Crow:** Juniper, the primary guide; curious eyes, feather tufts, and a knowing head tilt. Appears near Today and insight moments.
- **Owl:** reflection and journal; round expressive eyes and a calm, observant posture.
- **Bat:** motion and quests; small, energetic, and a little chaotic near transitions and active tasks.
- **Moon:** rhythm and rest; anchors dates, energy, and weekly cadence.
- **Gravestones:** milestones and completed chapters; use sparingly as charming, hand-lettered progress markers, never as morbid decoration.
- **Stars and botanical marks:** small navigation and state details, never wallpaper.

The illustration system should have visible craft: layered feather and fur shapes, tiny silver rim-light, hot-pink eye or charm accents, facial expression, hand-drawn gesture, varied silhouette edges, and controlled shadow depth. Characters should remain legible at mobile sizes and never feel childish or clip-art-like.

## Surface and interaction language

- Cards use dark ink surfaces, 1px violet-gray borders, and compact 12-16px radii.
- Elevation comes from offset shadows and controlled purple/pink light, never a generic glass blur.
- Primary buttons are hot pink with dark ink text. Secondary buttons are outlined silver or plum.
- Completion is a hot-pink check with a small glow and a clearly changed label state.
- Focus rings are silver-blue or hot pink and must remain visible on every control.
- Motion should be purposeful: a subtle familiar blink/float, a moon phase shift, and a single authored page entrance. Respect `prefers-reduced-motion`.

## 3D world contract

- The planet is the home screen and the user's life map.
- The planet must read as Earth-like before the magic layer appears: blue oceans, green land, cloud veil, atmosphere, and a believable globe silhouette.
- Magic is part of the world, not a filter: mythic creatures, spirits, gods, and sacred landmarks have distinct roles and locations.
- Rendering should feel like a premium game world: smooth silhouettes, controlled specular highlights, soft contact shadows, atmospheric falloff, cinematic color grading, and deliberate scale.
- Characters should use layered forms and expressive poses rather than placeholder primitives; procedural geometry is acceptable for the prototype only when it preserves the intended silhouette and material feel.
- Locations are meaningful, selectable destinations rather than decorative points.
- The camera supports orbit and zoom but never loses the planet or its orientation.
- The current location is always explained in plain language outside the canvas.
- Characters are a future interaction layer: grounded in real relationships and user-provided context, never fabricated as claims about real people.

## Layout contract

- Desktop: full-bleed world canvas, quiet navigation rail, and selected-location panel.
- Tablet: preserve the planet as the dominant surface and move location details into a lower sheet.
- Mobile: compact navigation dock, responsive canvas, no horizontal scrolling, all location actions reachable with a thumb.
- The first viewport must show: moon/date context, the planet, four life locations, the current realm, and one companion toggle.

## Quality bar

Every room needs real hierarchy, empty/loading/error states, keyboard-visible focus, and responsive behavior. No placeholder room should pretend to be complete. No decorative detail should obscure the next action. High detail belongs in the illustration and state transitions, not in visual noise.
