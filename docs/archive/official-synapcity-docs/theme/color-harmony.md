# Accent Harmony

Accent color is optional.

When the user does not provide an accent, the theme engine may generate one from the primary color and selected harmony strategy.

---

## Strategies

- Automatic
- Monochromatic
- Analogous
- Complementary
- Split Complementary
- Triadic
- Tetradic
- Square
- Custom

---

## Rule

The accent should act as a marker, not as a second brand competing with the primary color.

Use accent for:

- highlights
- small indicators
- active states
- metadata markers
- gentle emphasis

Avoid using accent for:

- large page backgrounds
- every card border
- noisy gradients
- decorative overload

---

## Fallback

```text
if userAccent exists:
  use userAccent
else:
  generatedAccent = createAccent(primary, harmonyStrategy)
```
