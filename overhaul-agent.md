I want you to completely overhaul the UI/visual design of this NBA standings prediction page.

## Core visual direction

The entire page should feel like a **punk rock / DIY show flyer / underground zine** that someone made at 2 AM with scissors, photocopies, Sharpie, glue, and a busted printer.

Think:

* Punk rock gig flyers
* DIY photocopied zines
* Cut-and-paste collage
* Hand-cut paper typography
* Xerox textures
* Ripped paper
* Tape
* Stapled/flyered-together elements
* Messy marker annotations
* Uneven alignment
* Distressed ink
* High-contrast black/white with a few loud accent colors
* Deliberately imperfect geometry
* Anti-corporate / anti-polished aesthetic

**Do NOT make it look like a generic "dark sports website."**

The goal is for the page to look like someone physically assembled the interface from pieces of paper and flyers.

## Most important design principle

The UI should look **intentionally messy, but still be highly usable**.

There is a difference between "chaotic" and "poorly designed."

Keep:

* Clear hierarchy
* Readable standings
* Obvious interactions
* Good spacing where usability requires it
* Responsive behavior
* Accessible contrast
* Obvious buttons and controls

But visually break the normal conventions of clean SaaS dashboards.

---

# Typography

Typography should be one of the biggest parts of the redesign.

Use a combination of:

### 1. Cut-out headline typography

Major headings should look like individual letters/words cut from different pieces of paper.

For example:

`NBA STANDINGS`

could visually look like:

* N on one white scrap
* B on a slightly rotated gray scrap
* A on a torn newspaper clipping
* etc.

Each word/letter can have:

* Slightly different rotation
* Slightly different size
* Uneven baseline
* Different paper texture
* Rough/torn edges
* Subtle shadow
* Occasional tape/staple effect

**Do not make every letter perfectly aligned.**

However, make sure the heading remains readable.

### 2. Secondary typography

Use a condensed, bold, slightly distressed or industrial typeface for:

* Team names
* Conference headings
* Section labels
* Buttons
* Metadata

Use a handwritten/marker-style font sparingly for:

* Notes
* Annotations
* Predictions
* Little labels
* Arrows
* Commentary

Do not overuse the handwritten font.

---

# Background

The background should feel like **aged photocopy paper / poster paper**, not a flat CSS background.

Consider:

* Off-white / warm paper
* Very subtle paper grain
* Faint photocopy noise
* Imperfect ink marks
* Tiny speckles
* Slightly different paper patches
* Very subtle stains or smudges

The texture should be subtle enough that it doesn't interfere with readability.

Avoid making the entire page look like a literal piece of parchment.

---

# Paper cutouts

This is the central visual motif.

Use irregular paper/cardboard shapes behind important UI elements.

Examples:

* Conference headers sitting on ripped paper strips
* "EAST" and "WEST" appearing on separate paper scraps
* Prediction cards sitting on slightly rotated pieces of paper
* Buttons looking like taped-on pieces of paper
* Important numbers appearing on little cut-out labels
* Section titles attached with tape
* Small notes appearing as scraps of graph paper

The paper should NOT be perfect rectangles everywhere.

Use CSS techniques such as:

* pseudo-elements
* clip-path
* border-radius variations
* transforms
* rotated elements
* masks where appropriate

to create irregular shapes.

Do not use giant excessive drop shadows.

A subtle physical-paper shadow is fine.

---

# The standings

The standings are the most important functional component of the page.

They should still be extremely easy to scan.

Instead of a sterile table, make the standings feel like a **wall of taped-up team cards / prediction sheets**.

Possible visual treatment:

Each team row/card could have:

* Team logo
* Team name
* projected record/seed
* prediction information
* small handwritten annotations
* slightly different rotation
* subtle paper background

But **do not randomly rotate things so much that comparing teams becomes difficult.**

Keep the actual ordering and hierarchy extremely clear.

Consider making the conference divisions feel like separate physical sheets pinned to a wall.

For example:

`EASTERN CONFERENCE`

could sit on a large torn piece of paper.

Then:

1. Team
2. Team
3. Team
4. Team

etc. appear underneath.

---

# Prediction interaction

This is an NBA standings prediction tool, so prediction controls need to feel fun.

Make prediction interactions feel like physically moving pieces around a messy desk/wall.

Potential ideas:

* Dragging teams feels like moving paper scraps
* Selected teams get a stronger paper treatment
* Hovering a team slightly lifts/rotates the paper
* Dragging a team gives it a subtle "paper in your hand" feeling
* Drop zones can look like taped areas
* Prediction changes could trigger a tiny visual movement

If the existing page already has drag-and-drop or prediction functionality, **preserve it exactly**.

Do not rewrite the business logic unless absolutely necessary.

---

# "My Predictions" / User-specific areas

Make personal predictions feel like something the user wrote on a physical flyer.

For example:

> MY PICKS

could appear as handwritten text on a ripped piece of paper with a little arrow pointing toward the relevant teams.

Use annotations such as:

* "LOCK"
* "NO WAY"
* "SLEEPER"
* "FRAUD WATCH"
* "HOT TAKE"
* "I'M TELLING YOU"
* "???"

These should be **visual flavor only** unless the existing application already supports these concepts.

Do not invent functionality just to support the aesthetic.

---

# Navigation / Header

The header should feel like the top of a DIY event flyer.

Instead of a polished SaaS navbar, consider:

* Large irregular title
* Small handwritten annotations
* Tape strips
* Tiny metadata
* Rough divider lines
* Slightly misaligned elements

The page title could be something like:

`NBA`
`STANDINGS`
`PREDICTIONS`

with each word/letter appearing as a separate pasted piece.

Do NOT make the navbar so chaotic that users cannot figure out where they are.

---

# Colors

Start with a mostly monochrome palette:

* Black
* Off-white
* Dirty white
* Gray
* Charcoal

Then use **1–3 aggressive accent colors**.

Potential accents:

* Toxic green
* Electric red
* Safety orange
* Hot pink
* Cobalt blue

The accents should feel like colored ink/marker/highlighter rather than a polished brand palette.

Do not use a conventional modern gradient-heavy UI.

Avoid:

* Purple/blue SaaS gradients
* Glassmorphism
* Excessive rounded cards
* Generic dashboard styling
* Perfectly symmetrical layouts
* Excessive shadows

---

# Borders and shapes

Replace generic modern UI styling where appropriate.

Instead of:

`border-radius: 12px`

everywhere, use:

* Rough edges
* Slightly irregular corners
* Torn-paper shapes
* Thin black borders
* Hand-drawn divider lines
* Uneven outlines

Not everything needs to be rectangular.

Not everything needs to be rounded.

---

# Texture and imperfections

Add small imperfections throughout the page:

* Slight rotations
* Misregistered ink
* Faint photocopy artifacts
* Tiny scribbles
* Underlines
* Arrows
* Circles around important information
* Cross-outs
* Handwritten notes
* Tape
* Staple marks
* Torn edges

But use these **as visual seasoning**.

Do not add so many decorations that the standings become difficult to use.

---

# Responsive design

The page must remain excellent on:

* Desktop
* Tablet
* Mobile

On mobile, simplify the collage rather than allowing it to become unusable.

Paper elements can become less rotated and decorative elements can disappear at smaller breakpoints.

The actual prediction functionality should remain fully usable on touch screens.

---

# Animation

Keep animations subtle and physical.

Good examples:

* Paper slightly lifts on hover
* Tape/card shifts by 1–3px
* Small rotation changes
* Dragged cards feel like they're being picked up
* Sections slide into place slightly imperfectly

Avoid:

* Huge transitions
* Excessive bouncing
* Generic Framer Motion animations everywhere
* Anything that makes the UI feel like a gimmick

The interface should feel tactile rather than flashy.

---

# Important implementation constraints

Before changing anything:

1. Inspect the existing page and understand its current structure.
2. Identify all existing functionality.
3. Preserve all existing functionality.
4. Do not remove prediction logic.
5. Do not remove data.
6. Do not change API behavior.
7. Do not change backend logic.
8. Do not break existing routing.
9. Do not replace working components unnecessarily.
10. Focus primarily on the presentation layer.

If the existing code already has reusable components, modify and restyle them rather than rebuilding the entire application from scratch.

---

# Visual hierarchy

The final page should have a clear hierarchy:

**1. Page identity**
→ BIG punk/DIY "NBA STANDINGS PREDICTIONS" treatment

**2. Controls**
→ Clear, tactile prediction controls

**3. Conference / standings**
→ Main focus of the page

**4. Team information**
→ Extremely readable

**5. Secondary information**
→ Smaller handwritten/photocopied details

---

# Overall vibe

Imagine this:

Someone printed an NBA standings sheet.

They cut it apart with scissors.

They slapped it onto a wall.

They wrote predictions on it with Sharpie.

They added arrows and notes.

They taped some pieces back together.

Then someone scanned the whole thing and turned it into a website.

**That is the aesthetic target.**

The page should feel like:

**NBA statistics × punk show flyer × DIY zine × messy collage × physical paper**

—not:

**NBA statistics × generic modern SaaS dashboard.**

Please inspect the existing implementation first, then implement the redesign throughout the page while preserving the existing functionality. Make the finished result feel cohesive rather than simply adding random "punk" decorations on top of the existing UI.
