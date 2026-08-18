# Button Styling Guidelines

When creating or modifying buttons in the OpenEdPuzzle (WaslaLearn) project, YOU MUST follow these styling rules to ensure UI consistency with the landing page aesthetic:

1. **Shape & Structure**: 
   - Buttons should use `rounded-full` for a pill-shaped appearance.
   - Do NOT use standard `rounded-md` or `rounded-xl` for primary action buttons.

2. **Interactivity (Framer Motion)**:
   - Interactive buttons must use `framer-motion` for hover and tap scaling effects.
   - Use `<motion.button>` (or `motion(Link)`).
   - Apply `whileHover={{ scale: 1.02 }}`.
   - Apply `whileTap={{ scale: 0.96 }}`.

3. **Example Implementation**:
```tsx
import { motion } from "framer-motion";

<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.96 }}
  className="flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-[40px] px-5 font-semibold text-sm transition-colors shadow-sm"
>
  Click Me
</motion.button>
```

Failure to apply these properties will result in a design that the user rejects. Always check if a button is an interactive call-to-action and apply the pill shape and Framer Motion scale effects.
