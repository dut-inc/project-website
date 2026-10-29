# AGENTS.md

## Project Overview

This repository contains a multi-project website being redesigned as a whimsical, interactive clubhouse.

The homepage should feel like entering a cozy, magical living space. Different physical objects in the room serve as interactive navigation to existing project sections.

The goal is a polished, functional website with a distinctive visual identity, maintainable code, and artwork that can be upgraded independently in the future.

## 1. Established Design Direction

These decisions are final. Follow them throughout implementation.

### Art Style

Use a hand-drawn, illustrated storybook aesthetic.

The environment should feel warm, imaginative, slightly magical, and lived in. Use organic shapes, layered illustrations, earthy colors, subtle textures, and thoughtful lighting effects.

Avoid generic dashboard styling, uniform project cards, excessive gradients, and emoji as primary artwork.

### Room Composition

Use an angled or isometric room composition.

The room should feel like a cohesive physical space, with walls, a floor, furniture, and objects arranged to create depth.

Use perspective, layering, shadows, and object placement to make the environment feel natural.

Prioritize a convincing composition and usability over complex rendering techniques. Prefer lightweight solutions compatible with the existing stack.

The room is the whole homepage screen, not a framed box or card. It fills the viewport edge to edge, with no page heading, border, or rounded frame around it. On landscape screens the navbar floats over the top of the room's sky rather than pushing the room down. On landscape screens, the room fills the viewport at any aspect ratio without page scrolling or cropping interactive objects; the backdrop artwork extends beyond the core composition to cover the extra space. On phones and portrait screens, the room spans the full screen width and scrolls vertically. The navbar remains visible above the room.

### Navigation

The room is the primary navigation interface. The existing top navbar remains the fallback.

Users should be able to click the illustrated objects to access their corresponding sections.

Preserve and adapt the existing navbar rather than introducing a competing navigation system.

All navigation must remain usable with a mouse, keyboard, and touchscreen.

### Implementation Approach

Implement the redesign incrementally in coherent stages, but do not create a separate design-prototype phase.

Do not generate concept art, AI-generated images, mood boards, or standalone visual mockups as part of the implementation workflow.

Build directly in the existing website using lightweight placeholder illustrations and existing assets.

Perform comprehensive visual and functional verification after the implementation is complete.

## 2. Required Homepage Objects

The homepage must contain six top-level interactive objects. The Pack is nested under Board Games.

### Aquarium — Fish Projects

Represent fish-related projects with an aquarium.

Possible details include fish silhouettes, aquatic plants, bubbles, and subtle underwater lighting.

Use simple SVGs, CSS illustrations, or existing assets. Keep the artwork replaceable.

The aquarium navigates to the existing fish-related section.

### Television — Sports Lab

Represent sports analytics and sports-related projects with a television showing a stylized sports scene or scoreboard.

Use original, simple placeholder graphics rather than depending on copyrighted live sports footage.

The television navigates to Sports Lab.

### Overgrown Tree — Nature & Conservation

Represent nature, ecology, and conservation with a tree growing into the room.

Use branches, leaves, vines, and other lightweight illustrated details.

The tree navigates to Nature & Conservation.

### Bulletin Board — Loose Ends

Represent miscellaneous projects, utilities, experiments, and ideas with a corkboard.

Use pinned notes, sketches, photographs, and paper scraps as simple illustrations or existing assets.

Where appropriate, individual notes may link to projects.

The board navigates to Loose Ends.

### Game Shelf — Board Games

Represent board-game-related projects with a shelf of board-game boxes and accessories.

The shelf navigates to Board Games.

Preserve existing board-game tools, including the Root rulebook portal if present.

### Calendar — DLE

Represent DLE with a desk calendar, wall planner, or similar object.

Inspect the existing implementation to determine what DLE actually does. Preserve its current content, routes, and functionality. Do not invent a new meaning or purpose.

The calendar navigates to DLE.

### The Pack — Nested Under Board Games

The Pack is an existing seventh section, but it must no longer be a top-level homepage category.

Place it beneath Board Games as a nested destination or sub-area.

Choose a representation that fits its existing content, such as a special game box, a labeled storage crate, or a smaller object within the Board Games area.

Preserve existing Pack functionality and important URLs. Update the navigation and information architecture as necessary, using redirects or compatible routes where appropriate.

## 3. Asset and Illustration Architecture

The initial illustrations are placeholders, not final commissioned artwork.

Do not generate images or introduce a separate image-generation workflow.

Use whichever lightweight approach best fits the existing codebase:

- SVG illustrations.
- CSS-drawn shapes and environmental details.
- Existing project assets.
- Simple placeholder images already available in the repository.

Do not spend excessive time perfecting placeholder artwork. Prioritize the overall composition, functionality, and maintainability.

### Replaceability Requirements

- Keep each major object independently replaceable.
- Separate artwork from routing, navigation, and application logic.
- Use reusable components for interactive objects where practical.
- Centralize shared category metadata and route configuration.
- Use descriptive filenames and a clear asset directory.
- Provide reasonable fallbacks when an asset is missing.
- Avoid embedding essential navigation logic inside SVG files.
- Keep sizing, aspect ratios, positioning, and layering manageable.
- Delete components, styles, and assets that a change leaves unused.

Replacing an initial SVG or CSS illustration with a future custom illustration should not require rewriting the navigation system.

Document the asset replacement process when the implementation is complete.

## 4. Navigation and Interaction

Implement the room as the primary navigation experience.

Requirements:

- Each of the six main objects must navigate to the correct existing section.
- Interactive objects should have clear hover and focus states.
- Labels or tooltips should make their purpose discoverable.
- Keyboard and touchscreen navigation must work.
- Navigation must not depend on hover alone.
- The existing top navbar must remain functional.
- Users must have a straightforward way to return to the homepage.
- The Pack must appear under Board Games, not as a seventh top-level destination.
- Preserve existing routes and deep links wherever possible.

Do not replace functional project pages with placeholders.

## 5. Responsive Design

Design the desktop homepage around the angled, illustrated room.

Create an intentional mobile layout rather than shrinking the desktop composition without adjustment.

Consider repositioning objects, simplifying perspective, adjusting labels, and providing comfortable touch targets.

Ensure that:

- All six objects remain identifiable.
- No essential navigation is obscured.
- Text remains readable.
- Labels do not overlap important artwork.
- The top navbar works on small screens.
- The layout does not introduce unwanted horizontal scrolling.

## 6. Animation and Polish

After the main structure and navigation are implemented, add a limited number of subtle environmental effects where appropriate.

Examples include gently moving fish, rising bubbles, swaying leaves, or a subtle television flicker.

Prefer lightweight CSS and SVG animations.

Respect reduced-motion preferences. Do not add autoplaying audio or introduce a heavy animation library solely for decorative effects.

Do not allow animation work to delay the completion of essential functionality.

## 7. Preserve Existing Functionality

Before making changes, inspect the repository to understand its architecture, routes, project pages, dependencies, and deployment requirements.

Preserve existing:

- Project pages and content.
- Application functionality.
- APIs, integrations, and data flows.
- Working routes and important deep links.
- Build and deployment compatibility.
- The Pack's existing functionality.
- Additional projects and utilities discovered during the audit.

Avoid unrelated refactoring, unnecessary dependencies, framework replacements, and destructive changes.

Do not assume that the seven known sections represent every page or feature in the repository.

If an existing project does not fit naturally into one of the six main homepage objects, ensure it remains accessible through the appropriate section or existing navigation.

## 8. Implementation Workflow

Work incrementally in the following order.

### Stage 1: Repository Audit

Inspect the existing codebase, identify the framework and architecture, inventory the current pages and routes, and determine which functionality must be preserved.

Develop a concise implementation plan based on the actual repository.

### Stage 2: Structural Implementation

Build the room layout and establish the shared styling, typography, colors, spacing, perspective, and layering.

Use simple placeholder illustrations or existing assets. Do not generate concept art or build a separate visual prototype.

### Stage 3: Navigation Integration

Connect all six objects to the correct existing sections.

Integrate the design with the existing navbar and move The Pack beneath Board Games in the navigation hierarchy.

Preserve important URLs and project functionality.

### Stage 4: Responsive Design and Polish

Implement desktop and mobile layouts, interaction states, keyboard accessibility, reduced-motion support, and a small number of lightweight animations.

### Stage 5: Final Verification

Once the implementation is complete, perform a comprehensive verification pass.

Run the available build, lint, type-check, and test commands. Inspect the rendered website if browser or screenshot tooling is available.

Verify all six top-level destinations, The Pack under Board Games, the navbar, important existing routes, responsive behavior, and interactive controls.

Fix regressions and report any remaining issues.

Do not create separate screenshot reviews, visual mockup deliverables, or image-generation tasks as intermediate milestones. Testing and visual inspection are part of the final verification stage.

## 9. Quality and Accessibility

- Use semantic HTML and accessible interactive elements.
- Provide descriptive accessible names for interactive objects.
- Ensure visible keyboard focus indicators.
- Respect reduced-motion preferences.
- Maintain readable text and sufficient contrast.
- Optimize asset loading and animation performance.
- Avoid unnecessary dependencies and duplicated logic.
- Never claim that a build, test, or browser check passed unless it was actually performed.

## 10. Completion Report

At the end of the project, report:

- A summary of the redesign.
- The major files added or changed.
- The final route and navigation structure.
- Confirmation that The Pack is nested under Board Games.
- The build and tests performed, including their actual results.
- Any remaining placeholders or known limitations.
- Instructions for replacing the illustrations with custom artwork in the future.

The result must be a working, maintainable website, not just a static illustration or mockup.

## Final Principle

Build the actual website directly.

Use creative judgment to make the room feel cohesive, charming, and custom-designed. Keep placeholder art simple, preserve existing functionality, and prioritize a complete implementation over unnecessary prototyping.

Implement in stages, then verify the finished experience comprehensively at the end.