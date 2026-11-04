
# AGENTS.md

## Project Overview

This project is a shared website for a small group, containing projects, tools, experiments, resources, and other useful or entertaining features.

The website is called **Perpetual Studio**.

The site should feel like a creative development workspace. Its interface is inspired by Visual Studio Code, with a file explorer on the left and a main editor area on the right.

The website is a real application. The editor-inspired interface must display actual pages and preserve their existing functionality.

## Established Design Direction

The established design direction is a polished, editor-inspired workspace.

The interface should include:

- A top application bar branded Perpetual Studio.
- A left file explorer that serves as the primary navigation.
- A main editor area that displays the selected page.
- Tabs for pages that have been opened.
- Clear active, inactive, hover, and focus states.
- A cohesive visual identity inspired by development tools.

Use Visual Studio Code as a reference for layout and interaction patterns, not as a design to copy exactly.

Perpetual Studio should have its own personality through its typography, colors, spacing, icons, and details.

Do not revert to the previous illustrated clubhouse, isometric room, or interactive-object navigation concept unless explicitly requested.

## Required Navigation Structure

The top-level website sections are:

- Fish Lab
- Sports Lab
- Nature & Conservation
- Loose Ends
- Board Games
- DLE
- About Us (a page per member: Ben, Dennis, Ivan, Senlin; listed in `lib/members.ts`)

The Pack is a subsection of Board Games. It must not appear as a separate top-level section.

Use the existing application and documentation to determine the actual pages and purpose of each section. Do not guess what DLE means or invent content for it.

The explorer's file and folder names are a visual navigation metaphor. They do not need to match the underlying source-code filenames.

## File Explorer Behavior

The left sidebar is the primary navigation.

It should support:

- Expanding and collapsing folders.
- Opening a page by clicking its file-like item.
- Highlighting the currently active page.
- Showing open-file indicators where appropriate.
- Clear hover and keyboard focus states.
- Usable navigation on both desktop and mobile.

Explorer items must connect to real application pages and routes.

## Editor and Tab Behavior

The main editor area displays the actual page associated with the selected explorer item.

The editor should support:

- Opening a page in a tab.
- Switching between existing tabs.
- Avoiding duplicate tabs for the same page.
- Closing tabs without deleting the underlying page.
- Selecting a sensible remaining tab when the active tab closes.
- Displaying a useful empty state when no page is open.

The active editor tab and active explorer item should remain synchronized.

The editor should display actual website content, not source code, unless a specific page is intended to display code.

## Routing and Functionality

Preserve the existing application routing system.

Every page should retain a real URL and support:

- Direct navigation.
- Browser refresh.
- Deep links.
- Existing navigation behavior where applicable.

The editor interface must integrate with the existing routes rather than replacing them with a mock navigation system.

Do not remove or replace functioning pages, APIs, data, or features with placeholders.

Do not make unrelated refactors.

## Asset and Component Architecture

Keep the editor shell, file explorer, tab system, and page content appropriately separated.

Prefer reusable components for shared interface elements.

Navigation logic should remain independent from decorative icons and visual assets. Icons and styling should be replaceable without rewriting route behavior.

Use the project's existing framework, conventions, dependencies, and asset organization.

Use existing assets or simple SVG/CSS icons where appropriate. Do not generate images or concept art unless explicitly requested.

## Current Implementation

- `app/layout.tsx` wraps every route in `components/workspace/WorkspaceShell.tsx` (title bar, explorer, tabs, editor).
- The URL is the source of truth: the active tab is `usePathname()`, and explorer files and tabs are Next.js `<Link>`s. Tab, folder and sidebar state lives in `WorkspaceProvider.tsx` and persists in `localStorage`.
- Tabs follow VS Code's preview mode: a newly opened page is the single italic preview tab and replaces the previous preview; double-clicking its explorer row or its tab makes it permanent (`pinTab`).
- `lib/projects.ts` defines sections, titles, routes and nesting. `lib/workspace.ts` defines the explorer tree (file names, icon kinds, and which route each file opens). New pages must be added there to appear in the explorer.
- Every page starts with the shared `components/PageHeader.tsx` (section pages via `components/CaseHeader.tsx`), so the back link, kicker, title typography and page width (`max-w-6xl`, set on the editor's `<main>`) are the same everywhere. Each tool's own UI below the header keeps its theme; don't add per-page titles or back links. Exception: the NBA standings pool keeps its own headline and back link (user's request).
- The Pack is a regular file (`the-pack.deal`) in the Board Games folder, not a nested folder or a special-cased card; its open rooms appear as `room-<code>.deal` files beside it.
- Folders are pages: a folder's name opens its section's index route (`project.href`) and expands it; its chevron only toggles it. There are no separate README files for sections.
- Icons live in `components/workspace/icons.tsx` and are referenced only by kind. Workspace colors are the `studio.*` Tailwind tokens (accent is Visual Studio blue `#007ACC`, with `studio.link` `#3794FF` for blue text); shell layout is the `.ps-*` CSS in `app/globals.css`.
- The window is the scroll container. Shell chrome stays at z-index 45 or below so page dialogs (z-50 and up) cover it.
- The previous clubhouse room, its artwork and the old top navbar were removed; they remain in Git history.

## Responsive Design

The desktop workspace is the primary layout.

On smaller screens:

- The explorer should collapse or open as a drawer.
- The editor should use the available width.
- Tabs should remain accessible.
- Navigation should remain usable through touch.
- The interface should not create unnecessary horizontal overflow.

Support keyboard navigation, visible focus states, and reduced-motion preferences.

## Animation and Polish

Use subtle interaction feedback where it improves usability.

Avoid:

- Excessive animation.
- Unnecessary visual clutter.
- Autoplay audio.
- Heavy 3D effects without a clear need.
- Animations that interfere with navigation or readability.

Prioritize a coherent, functional workspace over decorative effects.

## Preserve Existing Functionality

Before modifying the application:

1. Inspect the existing codebase and routes.
2. Read relevant project documentation.
3. Identify existing page functionality and dependencies.
4. Determine how current navigation and content are implemented.
5. Verify the purpose of DLE and the current implementation of The Pack.

Preserve all existing functionality unless the user explicitly requests a change.

Do not assume a page is disposable because it is not immediately visible in the main navigation.

Do not replace real functionality with static mockups or placeholder pages.

## Implementation Workflow

Work incrementally and verify changes as they are made.

For substantial changes:

1. Inspect the relevant implementation.
2. Identify the smallest appropriate change.
3. Implement the change using existing conventions.
4. Test the affected functionality.
5. Check for regressions in related pages.
6. Update project documentation when meaningful progress or durable decisions occur.

Do not perform broad unrelated refactors.

Do not claim a feature works unless it has been implemented and appropriately checked.

## Quality and Accessibility

Prioritize:

- Functional navigation.
- Correct routing.
- Consistent visual design.
- Responsive behavior.
- Accessible interaction.
- Maintainable components.
- Readable code.
- Reliable existing functionality.

Verify the actual application in a browser after substantial interface changes. Do not rely only on screenshots of a static mockup or on the absence of build errors.

## Project Continuity and Documentation

Keep this file focused on durable project requirements, design direction, architecture, and recurring workflow expectations.

Update `AGENTS.md` when:

- The established design direction changes.
- A lasting architectural decision is made.
- A recurring project requirement changes.
- A durable coding or workflow convention is established.

Do not add one-off bug fixes, temporary experiments, completed task lists, or conversation transcripts.

Maintain a root-level `PROJECT_STATUS.md` for current project progress, including:

- Current implementation state.
- Completed major features.
- Outstanding issues and unfinished work.
- Important technical decisions.
- Verification performed.
- Recommended next steps.

Update `PROJECT_STATUS.md` at meaningful milestones and when preparing to switch machines or sessions.

When preparing a handoff:

- Inspect the actual Git state.
- Record what changed.
- Identify uncommitted work.
- Identify unresolved issues and failed checks.
- Distinguish completed work from planned or unverified work.
- Do not discard changes or commit/push without authorization.

When starting a new session, inspect `AGENTS.md`, `PROJECT_STATUS.md`, and the current Git state before continuing.

## Final Principle

Perpetual Studio should feel like a real, polished development workspace where the website's pages are organized as files and opened in an editor.

The editor-inspired interface is the navigation and presentation layer. The actual pages, routes, and functionality remain the substance of the website.
