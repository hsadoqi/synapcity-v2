# Motion

Motion should communicate state, not decorate the interface.

---

## Settings

- Reduced
- Normal
- Expressive, optional future mode

---

## Duration Tokens

```text
--duration-instant: 0ms
--duration-fast: 100ms
--duration-normal: 150ms
--duration-slow: 200ms
--duration-slower: 250ms
```

---

## Motion Uses

Good uses:

- panel open/close
- drag/drop feedback
- focus transitions
- selection movement
- command menu entrance

Avoid:

- decorative bouncing
- constant ambient animation
- motion that obscures layout changes

---

## Accessibility

Respect reduced motion preferences.
