# Fish Identification Quiz — Agent Guidelines

## 1. Project Overview

Build a polished, interactive fish identification quiz for a personal website.

The application should allow users to identify fish using photographs, common names, and scientific names. The experience should feel like an educational marine biology application, not a generic quiz template or AI-generated landing page.

The project has two equally important objectives:

1. Build a functional, reusable quiz system that supports multiple question formats.
2. Establish a distinctive underwater visual identity that feels intentional, sophisticated, and cohesive.

**The design must not look vibecoded.** Avoid generic AI-generated website aesthetics, excessive gradients, oversized rounded cards, glassmorphism, unnecessary animations, and decorative elements that do not contribute to the experience.

## 2. Quiz Modes

The application must eventually support four distinct quiz modes.

### Mode 1: Identify the Fish (Common Name)

- Display a photograph of a fish.
- Present four multiple-choice answers.
- Ask the user to identify the fish by its common name.
- Exactly one answer should be correct.

### Mode 2: Identify the Fish (Scientific Name)

- Display a photograph of a fish.
- Present four multiple-choice answers.
- Ask the user to identify the fish by its scientific name.
- Exactly one answer should be correct.

### Mode 3: Scientific Name to Common Name

- Display the scientific name of a fish.
- Present four multiple-choice answers.
- Ask the user to identify its common name.
- Exactly one answer should be correct.

### Mode 4: Common Name to Scientific Name

- Display the common name of a fish.
- Present four multiple-choice answers.
- Ask the user to identify its scientific name.
- Exactly one answer should be correct.

### Quiz Behavior

All four modes should share a common quiz engine rather than having four separately implemented quiz systems.

The quiz should support:

- Four answer choices per question.
- Randomized answer order.
- Randomized question order.
- Immediate feedback after selecting an answer.
- A clear indication of the correct answer.
- Score tracking.
- Question progress tracking.
- A final results screen.
- An option to restart the quiz.
- An option to return to the quiz selection screen.

Do not allow multiple answers to be selected for a single question.

The quiz should be designed so that additional question formats can be introduced later without rewriting the underlying system.

## 3. Visual Identity and Art Direction

### Overall Direction

Create an immersive underwater environment.

The aesthetic should draw inspiration from:

- Marine biology field guides.
- Oceanographic research publications.
- Underwater photography.
- Aquarium identification displays.
- Scientific specimen catalogs.
- Natural history museum exhibits.

The experience should feel like exploring a carefully curated marine field guide.

It should be visually interesting without sacrificing readability or usability.

### Color Palette

Use a restrained ocean-inspired palette.

Suggested colors:

- Deep ocean navy: `#071D2B`
- Abyssal blue: `#0B2B3B`
- Ocean teal: `#145566`
- Muted seafoam: `#8DB9AE`
- Pale sand: `#E7E0CC`
- Soft white: `#F1F3EF`

These are starting points, not mandatory values. Establish a consistent palette and use color purposefully.

Avoid:
- Bright electric blue.
- Excessive cyan.
- Purple-to-blue gradients.
- Generic SaaS-style gradient backgrounds.
- Excessive use of pure white.

### Typography

Typography should contribute significantly to the identity.

Consider:
- A distinctive editorial or serif typeface for major headings.
- A clean, highly readable sans-serif for navigation and interface elements.
- Italic styling for scientific names.
- Small uppercase labels for metadata and section identifiers.

Scientific names must always be presented in italics, following standard biological naming conventions.

Use a deliberate typographic hierarchy. Do not make every heading oversized.

### Underwater Atmosphere

The underwater theme should be integrated into the environment itself.

Possible design elements:

- Subtle underwater lighting.
- Restrained depth-inspired background textures.
- Fine particulate or suspended sediment effects.
- Subtle water movement.
- Layered ocean-depth color transitions.
- Delicate marine-inspired borders and dividers.
- Understated depth indicators or navigational details.

These are optional design directions, not a checklist.

Do not implement all of them simultaneously.

The result should feel atmospheric and natural rather than like a video game or a cartoon aquarium.

### Interface Design

Use:
- Clean spacing.
- Intentional alignment.
- Consistent sizing.
- Restrained borders.
- Thoughtful hover and selection states.
- Clear visual hierarchy.
- Responsive layouts.

Avoid:
- Excessively rounded cards.
- Generic dashboard layouts.
- Random decorative circles.
- Excessive shadows.
- Floating UI elements without purpose.
- Emoji as primary interface icons.
- Unnecessary animations.

## 4. Images and Assets

**Do not generate images or illustrations unless explicitly instructed.**

Prefer genuine fish photography.

Potential image sources include:
- Wikimedia Commons.
- iNaturalist (respect image licensing and attribution).
- NOAA Fisheries.
- FishBase (where image usage permits).
- Other reputable, appropriately licensed marine photography collections.

Important requirements:

1. Respect image licensing and usage restrictions.
2. Store image attribution and source information alongside the fish record.
3. Do not hotlink images without considering availability and usage rights.
4. Do not invent image URLs.
5. Do not substitute an unrelated fish photograph when an image is missing.

If suitable images are unavailable, use a deliberate placeholder that preserves the layout.

A missing image should never break the quiz.

Build the application so real images can be added incrementally.

## 5. Fish Data Architecture

Fish information should be stored separately from the quiz interface.

A fish record should accommodate:

- Unique ID.
- Common name.
- Scientific name.
- Image URL or local image path.
- Image attribution.
- Image source URL.
- Optional description.
- Optional family.
- Optional genus.
- Optional habitat.
- Optional geographic distribution.

Example structure:

```json
{
  "id": "fish-001",
  "commonName": "Clownfish",
  "scientificName": "Amphiprion ocellaris",
  "image": null,
  "imageAttribution": null,
  "imageSource": null,
  "family": "Pomacentridae",
  "habitat": "Coral reefs"
}
```

This is an illustrative record, not a complete dataset.

### Data Integrity

- Common and scientific names must be accurate.
- Scientific names must be formatted correctly.
- Do not fabricate species information.
- Avoid duplicate fish records.
- Distractors must be valid answers of the same type as the correct answer.
- Do not include the correct answer more than once.
- Handle missing images and missing optional metadata gracefully.

Initially, a small curated dataset is preferable to a large inaccurate dataset.

The data architecture should make it easy to add more species later.

## 6. Technical Architecture

First inspect the existing repository.

Respect the existing:
- Framework.
- Language.
- Component architecture.
- Routing.
- Styling conventions.
- Package manager.
- Dependencies.

Do not introduce a new framework or unnecessarily restructure the project.

Keep the implementation modular.

Suggested logical separation:

- Fish data.
- Quiz configuration.
- Question generation.
- Quiz state management.
- Answer evaluation.
- Results and scoring.
- Reusable interface components.

The four quiz modes should be configurations of a shared system.

Avoid unnecessary dependencies. Prefer existing project capabilities and lightweight implementations.

## 7. Accessibility and Responsiveness

The quiz must work on desktop and mobile.

Requirements:

- Responsive image sizing.
- Readable typography at all screen sizes.
- Keyboard-accessible answer selection.
- Visible focus states.
- Semantic HTML.
- Sufficient color contrast.
- Accessible feedback for correct and incorrect answers.
- Respect `prefers-reduced-motion`.

Animations must never interfere with answering questions.

## 8. Development Philosophy

Prioritize quality over quantity.

Do not attempt to build an elaborate application in one pass.

Work in stages:

1. Inspect the existing project.
2. Establish the visual direction.
3. Build the quiz selection interface.
4. Build the reusable quiz engine.
5. Implement all four quiz modes.
6. Add a small, accurate fish dataset.
7. Implement results and restart functionality.
8. Refine responsiveness and visual details.
9. Test the complete experience.

Do not add features just because they are easy to generate.

Do not invent content, imagery, or functionality to make the application appear more complete than it is.

If a feature depends on assets or information that are not yet available, build the necessary framework and document what remains.

## 9. Definition of Done

The initial implementation should:

- Have a cohesive underwater visual identity.
- Support all four quiz modes.
- Display exactly four answer choices per question.
- Correctly evaluate answers.
- Track scores and progress.
- Show a final results screen.
- Allow the user to restart or switch modes.
- Handle missing fish photographs gracefully.
- Work on desktop and mobile.
- Use accurate fish information.
- Have reusable, maintainable code.

The final result should feel like a thoughtfully designed marine identification experience, not a generic AI-generated quiz website.

**When in doubt, choose restraint, accuracy, and intentional design over visual novelty or unnecessary complexity.**

## 10. Owner Decisions and Current State

Updated 2026-11-12. These decisions came after the brief above. Where they differ from it, they win.

### Decisions (2026-11-12)

- **Licensing is not a constraint.** Only the owner and their friends use the site. Attribution is still stored on every record (author, license label, source link) and shown under each photograph.
- **As many species as possible.** Species come from iNaturalist through an import script, not hand entry.
- **Two species sets.**
  - **World** is the most-observed fish worldwide.
  - **Pacific Northwest** covers Washington, Oregon, Idaho and British Columbia.

  Every mode works on either set.
- **Streak runs replace fixed-length quizzes.** A run has no set length: it continues until the first wrong answer, and the score is the streak.
  - The end-of-run screen is the "final results screen".
  - "Question progress" is the plate number plus the current streak.
  - Each browser keeps a best streak per set and mode.
- **Common names follow iNaturalist**, so no choice stands out by its style. This renamed some of the original hand-picked species, for example Ocean Sunfish → Common Mola, Regal Blue Tang → Palette Tang, Picasso Triggerfish → Lagoon Triggerfish.

### Status

The Definition of Done (section 9) is met, adapted to streak runs.

- All four modes run on both sets.
- 1,231 species: World 1,004, Pacific Northwest 326 (some are in both).
- 20 hand-picked species have local photos from Wikimedia Commons. The rest hotlink iNaturalist photos.
- `npm test`, `npm run lint` and `npx tsc --noEmit` pass. Checked in a browser at desktop and phone widths.

Open items:

- No production build has been run since the streak work. Run `npm run build` once, with the dev server stopped.
- 114 species have no description note, and 1 has no family (*Schuettea scalaripinnis*). The UI handles both.
- Wrong answers favour the same genus or family, so runs are hard. There is no difficulty setting. The owner hasn't asked for one yet.

Implementation notes for agents are in `CLAUDE.md` ("Fish Identification Quiz"). The overview is in `README.md`.
