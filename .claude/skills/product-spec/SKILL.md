---
name: product-spec
description: Create or update the product specification in doc/spec/product-spec.md. Use when the user asks to add features to the spec, update existing sections, review the spec against the codebase, or create a new spec from scratch.
argument-hint: "[action] [details]"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(ls *), Bash(mkdir *)
---

# Product Specification Skill

You are a product manager maintaining a product specification for this project.

## Spec Location

The product spec lives at `doc/spec/product-spec.md`. If it does not exist, create it using the template below.

## How to Write a Good Spec

Follow these principles (based on https://addyosmani.com/blog/good-spec/):

1. **High-level vision first, details second** — start with objective and value propositions before diving into feature details.
2. **Structure like a professional PRD** — use consistent sections with tables, acceptance criteria, and clear boundaries.
3. **Modular sections** — each feature gets its own subsection with behavior, configuration, and acceptance criteria.
4. **Build in constraints** — use the three-tier boundary system (Always / Ask First / Never).
5. **Include success criteria** — measurable, testable outcomes for every major capability.

## Spec Structure

The spec MUST follow this section order:

| # | Section | Purpose |
|---|---------|---------|
| 1 | Objective | Vision, problem statement, target users, value propositions |
| 2 | Tech Stack | Dependencies, versions, build commands |
| 3 | Architecture | File structure, design principles, data flow |
| 4 | Features | One subsection per feature with behavior + acceptance criteria |
| 5 | User Flows | Step-by-step workflows for core scenarios |
| 6 | UI & Design System | Colors, components, responsive breakpoints |
| 7 | Non-Functional Requirements | Privacy, performance, accessibility, offline |
| 8 | Boundaries & Constraints | Always / Ask First / Never guardrails |
| 9 | Success Criteria | Measurable outcomes table |
| 10 | Future Considerations | Potential roadmap items (not committed) |

## Actions

Based on `$ARGUMENTS`, perform one of these actions:

### `add [feature-name]` — Add a new feature to the spec
1. Read the current spec at `doc/spec/product-spec.md`.
2. Read the relevant source code in `src/` to understand the implementation.
3. Add a new subsection under **4. Features** with:
   - Feature description and purpose
   - Configuration table (if applicable)
   - Behavior bullet points
   - Acceptance criteria
4. Add a corresponding user flow under **5. User Flows** if the feature has user-facing interaction.
5. Update **9. Success Criteria** with measurable outcomes for the new feature.
6. Update any other affected sections (UI components, non-functional requirements, boundaries).

### `update [section-or-feature]` — Update an existing section
1. Read the current spec.
2. Read the current source code to verify what has changed.
3. Update the specified section to reflect the current state of the codebase.
4. Ensure acceptance criteria and success criteria are still accurate.

### `sync` — Sync the entire spec with the codebase
1. Read the current spec.
2. Read all source files (`src/index.html`, `src/mymap.js`, `src/mymap.css`, `src/manifest.webmanifest`).
3. Compare the spec against the code and identify:
   - Features in code but missing from spec
   - Spec details that no longer match the code
   - New configuration values or behavior changes
4. Report the differences and update the spec accordingly.

### `review` — Review the spec for quality
1. Read the current spec.
2. Check each section against the quality criteria:
   - Does every feature have acceptance criteria?
   - Are success criteria measurable?
   - Are boundaries clear and complete?
   - Is the tech stack up to date with `package.json`?
   - Are user flows complete for all major features?
3. Report findings and fix any gaps.

### No arguments — Create from scratch
1. Read all source files to understand the full product.
2. Create `doc/spec/product-spec.md` using the structure above.
3. Populate every section based on what the code actually does.

## Quality Rules

- **Be precise**: use exact values from the code (timeout durations, pixel sizes, color codes, API parameters).
- **Tables over prose**: use tables for configuration, components, and criteria wherever possible.
- **Acceptance criteria are mandatory**: every feature subsection must end with testable acceptance criteria.
- **Keep Future Considerations honest**: only list items that are architecturally plausible given the current codebase, not wish lists.
- **Update the version date**: set `Last Updated` in the frontmatter to today's date on every edit.

## After Every Change

Update `CHANGELOG.md` under `[Unreleased]` with what was added or changed in the spec.
