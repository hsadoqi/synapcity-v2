# Synapcity UI Design Rules

## Product character

Synapcity is a professional knowledge and productivity workspace designed for prolonged daily use.

Interfaces should feel:

- precise
- quiet
- compact
- intentional
- technical
- editorial
- sophisticated without being decorative

Favor the visual discipline of high-quality developer and productivity tools such as Linear, Vercel, and shadcn/ui, without cloning any product.

Synapcity should feel like a professional instrument, not a conventional SaaS dashboard.

## Visual system

Use an achromatic foundation:

- white
- black
- graphite
- charcoal
- neutral grays

Create hierarchy primarily through subtle surface differences, typography, spacing, borders, and interaction states.

Use color sparingly and intentionally for:

- semantic state
- focus
- selection
- identity
- relationships
- meaningful emphasis

Never use accent color merely as decoration.

## Typography

Typography is a primary hierarchy mechanism.

Use a restrained modern sans-serif suitable for dense productivity software.

Application chrome should generally use compact 12–14px typography.

Establish clear hierarchy between:
- navigation
- breadcrumbs
- titles
- body/editor content
- metadata
- labels
- keyboard shortcuts
- secondary information

Do not make every interface element the same size or weight.

Avoid excessive uppercase tracking.

Maintain comfortable reading widths for long-form content.

## Spacing and geometry

Prefer compact but comfortable information density.

Use:

- disciplined spacing
- precise alignment
- subtle 1px boundaries
- small corner radii, generally 4–6px
- consistent control heights
- deliberate surface hierarchy

Do not create containers unless they communicate meaningful grouping, interaction, or elevation.

Not every section needs a box.

## Icons

Use one coherent icon family.

Maintain consistent stroke weight and optical sizing.

Prefer approximately 16px for standard application icons and 14px only for intentionally compact controls.

Equivalent controls must use equivalent icon sizing.

Never use oversized icons merely to fill space.

## Application chrome

Persistent application chrome should be compact and visually stable.

Clearly distinguish:

- global navigation
- contextual navigation
- current location
- workspace content
- global actions
- contextual actions
- utilities

Avoid making every navigation item look like a button.

Selected, hover, focus, and active states should be restrained but unmistakable.

Headers should feel composed rather than like arbitrary rows of controls.

Related controls should be visually grouped.

## Responsive behavior

Application chrome must adapt gracefully as available space changes.

When appropriate, controls may transition from:

icon + label → icon only

before becoming cramped or overflowing.

Preserve accessible names/tooltips for icon-only controls.

Prioritize essential navigation and actions over secondary controls.

Do not solve constrained layouts by indiscriminately shrinking everything.

## Interaction quality

Always design intentional:
- hover
- focus-visible
- active
- selected
- disabled
- loading
- empty states

Keyboard accessibility and visible focus treatment are first-class requirements.

Compact visual presentation must not produce unusably small interaction targets.

## Writing and content surfaces

Writing surfaces should feel open and immediate.

Avoid placing editors inside unnecessary bordered cards or conventional form-field containers.

Use typography, spacing, caret/focus treatment, placeholder copy, and surrounding context to communicate editability.

Content should remain visually dominant over metadata and controls.

## AI-design anti-patterns

Aggressively avoid generic AI-generated interface aesthetics.

Do not default to:

- purple or blue gradients
- gradients generally
- glassmorphism
- glowing borders
- giant hero typography
- excessive rounded rectangles
- nested cards
- card grids
- pill-shaped controls everywhere
- excessive badges
- excessive shadows
- arbitrary colorful icons
- decorative illustrations
- huge empty whitespace
- generic dashboard statistics
- fake analytics
- generic AI-assistant aesthetics

Do not equate minimalism with emptiness.

Do not equate premium design with excessive whitespace.

Do not equate modern design with rounded cards.

Do not equate information density with visual clutter.

## Design decision principle

When improving an interface, prioritize in this order:

1. information architecture
2. hierarchy
3. composition and proportion
4. typography
5. spacing and density
6. interaction states
7. surface treatment
8. decorative detail

Sophistication should emerge from the first seven rather than being added through decoration.

When an existing visual decision is weak, redesign it rather than preserving it merely because it already exists.