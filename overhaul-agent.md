## Website Redesign — Coral Reef / DIY Punk Zine

I want you to substantially rethink the visual design of the existing website.

The core concept is that the website is a **coral reef made out of DIY punk/zine artwork**. Each major category/section of the site should feel like its own coral colony growing as part of one larger reef.

This should NOT look like a typical polished "underwater" website.

The visual inspiration is a combination of:

* DIY punk flyers
* Cut-and-paste zines
* Xerox/photocopied artwork
* Risograph/screen-print aesthetics
* Hand-drawn underground comics
* Rough ink illustrations
* 80s/90s skate and punk graphics
* Handmade collage
* Scrapbook/cut-paper layouts
* Energetic comic-book illustration
* Imperfect, physical, handmade artwork

Think **something a person physically assembled out of paper, ink, photocopies, and drawings**, then turned into a website.

### Core visual metaphor

The category sections should behave like **coral colonies**.

Imagine a collection of irregular pieces of brown/kraft paper scattered across a page. Each piece of paper represents a category or section.

For example:

* Games
* Tools
* Projects
* Utilities
* Random stuff
* Whatever categories already exist in the current website

Each category gets its own irregular paper scrap, and a hand-drawn coral formation grows out of/on that piece.

The coral should feel like an illustration rather than a realistic 3D coral model.

The paper pieces should have:

* Irregular hand-cut or torn edges
* Slight rotations
* Visible paper texture
* Imperfect shadows
* Overlapping pieces
* Slight variations in size
* Occasional pieces extending beyond their boundaries

The coral itself can overlap or extend beyond the paper.

The overall composition should feel deliberately messy and organic rather than like a conventional CSS grid.

---

# VERY IMPORTANT: ARTWORK MUST BE REAL IMAGE ASSETS

Do **not** build the coral artwork entirely out of:

* CSS shapes
* SVG geometry
* gradients
* procedural shapes
* generated DOM elements
* icon libraries
* purely CSS "coral"

The coral illustrations should be treated as **actual image assets**.

For example:

```text
/assets/reef/coral-games.png
/assets/reef/coral-tools.png
/assets/reef/coral-projects.png
/assets/reef/coral-random.png
```

Prefer PNG/WebP images with transparent backgrounds where appropriate so the artwork can sit naturally on top of the paper.

The UI should simply position, scale, rotate, and interact with these images.

For example, conceptually:

```js
{
    name: "Games",
    artwork: "/assets/reef/coral-games.png",
    projects: [...]
}
```

The important architectural separation is:

**CONTENT DATA**
→ category names, descriptions, projects, links, etc.

**ARTWORK ASSETS**
→ coral illustrations, paper textures, decorative illustrations, etc.

**UI COMPONENTS**
→ layout, positioning, hover behavior, navigation, responsiveness, etc.

This separation is extremely important because the coral artwork is intended to be **replaceable**.

---

# PLACEHOLDER ARTWORK WORKFLOW

For the initial implementation, use **placeholder/generated artwork** if appropriate.

The goal at this stage is NOT to create the final illustrations.

Instead, create enough placeholder artwork to establish the visual system and make sure the UI actually works with image assets.

The placeholders should already follow the intended visual direction:

* rough hand-drawn coral
* punk/zine aesthetic
* imperfect ink
* limited print colors
* transparent backgrounds when useful
* physical/printed appearance
* different silhouettes for different categories

However, treat these as **temporary assets**.

Later, I want to be able to have a human artist create the actual coral illustrations and simply replace:

```text
coral-games.png
coral-tools.png
coral-projects.png
```

with the final artwork.

**The UI architecture should not need to change when the placeholder artwork is replaced by human-made artwork.**

Do not bake the appearance of the coral into the components themselves.

The components should not care whether the image came from an AI generator, a human illustrator, a scanned drawing, or a photographed piece of artwork.

They should simply render the supplied asset.

---

# INTERACTION

The site should feel physical and slightly alive.

When hovering over a category/paper/coral:

* The paper can shift or rotate slightly
* The coral can move independently from the paper
* The piece can wobble slightly
* It can lift off the page a little
* The artwork can subtly scale
* Project information can be revealed
* There can be small physical/collage-like movement

Avoid extremely polished SaaS-style hover animations.

The interaction should feel like you're grabbing a physical piece of paper on a messy desk.

Keep animations relatively subtle so the website remains usable.

---

# LAYOUT

Do NOT make the main category section a conventional uniform CSS grid.

The reef should have an intentionally irregular composition.

Use:

* Different sizes
* Different rotations
* Overlapping elements
* Uneven spacing
* Variable whitespace
* Coral growing in different directions
* Some paper pieces sitting behind others
* Some artwork extending beyond the paper
* Different visual density in different areas

But this still needs to be **responsive and usable**.

On smaller screens, the composition can simplify rather than attempting to preserve every desktop overlap exactly.

The site should still be easy to navigate.

---

# COLOR / PRINT AESTHETIC

Use a restrained, dirty print-inspired palette.

Think:

* Aged paper
* Kraft brown
* Off-white
* Faded black
* Muted reds
* Muted oranges
* Muted greens
* Occasional brighter coral colors

Avoid making it look like a bright tropical vacation website.

The colors should feel like they came from:

* old posters
* photocopies
* screen prints
* cheap colored paper
* old comic books
* worn zines

---

# TEXTURE

Texture is important.

Consider subtle use of:

* Paper grain
* Ink imperfections
* Photocopy noise
* Halftone patterns
* Faded printing
* Registration imperfections
* Slightly rough edges
* Scanned-paper characteristics

But don't put texture everywhere just for the sake of texture.

The goal is for the website to feel **physical and printed**, not visually noisy and difficult to use.

---

# TYPOGRAPHY

Typography should support the DIY/punk aesthetic.

Potential directions include:

* Handwritten lettering
* Condensed bold display type
* Rough printed lettering
* Typewriter-like text
* Photocopied text
* Large imperfect headlines

However, body text and navigation still need to be highly readable.

Don't sacrifice usability for the aesthetic.

---

# WHAT TO AVOID

Do NOT turn this into:

* A generic modern portfolio
* A polished startup landing page
* Glassmorphism
* Generic gradients
* Neon cyberpunk
* Tropical beach aesthetics
* Underwater photography
* Realistic 3D coral
* A clean corporate design system
* Perfectly symmetrical layouts
* Uniform cards
* Generic rounded rectangles
* Excessive polished SVG illustrations
* CSS-generated "coral"
* A standard dashboard with coral decorations added afterward

The **collage/reef metaphor should be fundamental to the layout**, not just decoration applied on top of an existing design.

---

# IMPLEMENTATION APPROACH

Before changing things, inspect the existing codebase and understand:

1. What framework is being used
2. How categories/projects are currently represented
3. How routing works
4. How styling is currently organized
5. Where static assets belong
6. Which existing functionality should be preserved

Do not unnecessarily rewrite working functionality.

The goal is primarily to **rethink the visual architecture and presentation**, while preserving useful existing behavior.

Structure the implementation so that:

```text
Content
    ↓
Category/project data
    ↓
Reef UI components
    ↓
External artwork assets
```

The artwork should remain independent from the component logic.

For example, a category component should conceptually receive:

```js
{
    title: "Games",
    artwork: "/assets/reef/coral-games.png"
}
```

rather than containing hard-coded SVG paths or CSS instructions describing what the coral looks like.

---

# PLACEHOLDER → FINAL ARTWORK PIPELINE

Build the site with the assumption that there will eventually be a dedicated artwork pass.

### Phase 1 — UI prototype

Use generated/placeholder coral artwork to establish:

* Composition
* Scale
* Paper sizes
* Overlap
* Positioning
* Hover behavior
* Responsive behavior
* Typography
* Color system

### Phase 2 — Art direction

Once the UI is working, evaluate the placeholder artwork as a visual system.

Make sure the different coral pieces feel like they belong to the same world while still being visually distinct.

### Phase 3 — Human artwork

Eventually replace the placeholder/generated coral with human-made illustrations.

Those illustrations may be:

* Hand-drawn
* Inked
* Scanned
* Painted
* Screen printed
* Digitally illustrated
* Created specifically for each category

The final assets should be dropped into the artwork directory and referenced by the existing category data.

**No UI rewrite should be necessary.**

This replaceability is a core requirement of the architecture.

---

# FINAL GOAL

I want the finished site to feel like:

> Someone took a messy punk zine, cut it apart, drew an entire coral reef across the pages, scattered the pieces across a table, and somehow turned that physical collage into a really good website.

It should feel:

**handmade + weird + energetic + tactile + personal + playful**

rather than:

**clean + corporate + polished + generic + "AI-designed website."**

Build the first version as a **functional art-directed prototype**.

Prioritize getting the visual system, layout, interaction model, and asset architecture right.

The placeholder artwork is temporary.

The **system that displays and interacts with the artwork is the important part**, because the eventual goal is to replace the generated placeholders with real human-made illustrations without having to redesign the website.
