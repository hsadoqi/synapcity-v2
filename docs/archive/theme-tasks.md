# Theme Functionality Tasks

## Theme Mode Tasks

1. Compare ThemeProvider and DarkModeProvider in the codebase. Identify the differences in their implementation and usage.
2. Create one canonical ThemeProvider that can be used across the codebase, and archive the DarkModeProvider. Ensure that the new ThemeProvider supports all the features previously provided by DarkModeProvider.

- Unless we should maintain a darkmodeprovider similar to colorprovider/textprovider/displayprovider
- If so, relocate alongside the other providers managing the theme system.
- Figure out how we are going to handle the theme syste with multiple providers include different use cases/contexts

3. Update all test files to use the new ThemeProvider instead of DarkModeProvider. Ensure that all tests pass successfully after the change.
2. Update the documentation to reflect the changes made to the theming system, including the removal of DarkModeProvider and the introduction of ThemeProvider.
3. Ensure that the new ThemeProvider is well-documented, with clear instructions on how to use it in different contexts and scenarios.
4. Ensure the ThemeProvider is compatible with existing components and does not introduce any breaking changes to the codebase.
5. Verify that the ThemeProvider handles the following functionality correctly:
    - Initial mode preference (light, dark, system)
    - Switching between themes dynamically
    - Providing theme context to child components
    - Sets/gets mode preferences via cookies; ensure there is no FOUC (Flash of Unstyled Content) when switching between themes.
    - Ensure that the ThemeProvider is compatible with server-side rendering (SSR) and does not cause any issues when rendering on the server.
    - Ensure that the values update appropriately both directions
    - Ensure that the ThemeProvider is compatible with different browsers and devices, and does not introduce any issues related to responsiveness or accessibility.
    - Verify that the ThemeProvider handles system use cases correctly, including detecting system theme changes and updating the theme accordingly.
    - Keep track of both the theme mode preference and the resolved theme mode (the actual theme being used) in the context, and ensure that both values are accessible to child components.
    - Ensure that the ThemeProvider is compatible with different rendering environments, including client-side rendering (CSR) and server-side rendering (SSR), and does not introduce any issues related to hydration or rehydration.
    - Ensure ThemeProvier is properly integrated with the rest of the theming system, including any other providers or components that rely on theme context.
6. Create a store for the theme system that can be used to manage the state of the theme across the application. This store should be able to handle theme changes, persist the theme preference, and provide a way for components to access the current theme state.
    - Will we create a single store to handle all theme-related state, or will we create separate stores for different aspects of the theme system (e.g., color, typography, layout)?
    - Add persistence to the store so that the theme preference is saved across sessions and can be restored when the user returns to the application.
    - Ensure that the store is compatible with both client-side and server-side rendering, and does not introduce any issues related to hydration or rehydration.
    - Ensure that the store is well-documented, with clear instructions on how to use it in different contexts and scenarios.
    - Integrate the store with the ThemeProvider, so that changes to the theme state are reflected in the context provided by the ThemeProvider and vice versa.
    - Ensure that the store is compatible with different browsers and devices, and does not introduce any issues related to responsiveness or accessibility.
    - Ensure that the store is compatible with different rendering environments, including client-side rendering (CSR) and server-side rendering (SSR), and does not introduce any issues related to hydration or rehydration.
    - Ensure that the store is properly integrated with the rest of the theming system, including any other providers or components that rely on theme context.
    - Ensure that the store is tested thoroughly, with unit tests and integration tests to verify that it behaves as expected in different scenarios and contexts.
    - Ensure that the store is optimized for performance, and does not introduce any unnecessary overhead or complexity to the application.
7. Properly integrate the new ThemeProvider and store with the rest of the theming system, including any other providers or components that rely on theme context. Ensure that the integration is seamless and does not introduce any issues or conflicts.
8. Ensure that the new ThemeProvider and store are compatible with existing components and do not introduce any breaking changes to the codebase.
9. Confirm different types of theming system use cases and contexts, and ensure that the new ThemeProvider and store can handle all of them correctly. This may include different rendering environments, different browsers and devices, and different user preferences or settings.
    - Finalize components used to manage theme mode in different contexts and scenarios, like a ThemeToggle component, a ThemeSelector component, or a ThemeSwitcher component. Ensure that these components are well-documented and easy to use in different contexts and scenarios.
    - Account for use cases like rendering in header, footer, sidebar, or other layout components, the theme editor and ensure that the new ThemeProvider and store can handle these use cases correctlyq.
10. Review theme mode functionality within the theme-editor and ensure that the new ThemeProvider and store can handle theme mode changes correctly within this context. This may include updating the theme mode preference, switching between themes dynamically, and providing theme context to child components within the theme-editor and vice versa.

## Colors

### Primary Colors

1. Ensure that the primary colors are defined correctly in the theme system, and that they are accessible to all components that rely on them.
2. Primary Color should be oklch color space, and should be defined in a way that is consistent with the rest of the theming system.
3. Ramp should be generated based on the primary color, and should be accessible to all components that rely on it.
4. Ramp should cover values from 50 to 950 (similar to tailwindcss), and should be defined in a way that is consistent with the rest of the theming system.
5. Generate ramp client-side, and ensure that it is properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
6. Ensure ramp is properly injected into the DOM, and that it is accessible to all components that rely on it, and with TailwindCSS system.
7. Allow ramp to be used in the code like `bg-primary-500` or `text-primary-500`, and ensure that it is properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
8. Update css variables to use the new primary color and ramp, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
  - For example, update the `--color-primary` variable to use the new primary color, and update the `--color-primary-50` to `--color-primary-950` variables to use the new ramp values.
  - Also use variables like `--color-primary-foreground` and `--color-primary-background` to define the foreground and background colors for the primary color, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
  - Make variables like primary-foreground and primary-background equal to the other variables like `--color-primary-50` and `--color-primary-950`, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
  - Ensure that other color variables like `--color-secondary`, `--color-accent`, `--color-neutral`, and `--color-base` are defined in a way that is consistent with the rest of the theming system, and that they are accessible to all components that rely on them.
  - Update any color variables that would/should use primary color or ramp values to use the new primary color and ramp, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
  - Ensure that the new primary color and ramp are compatible with existing components and do not introduce any breaking changes to the codebase.
9. Ensure that there are default values for the primary color and ramp, and that they are accessible to all components that rely on them. This may include defining default values in the ThemeProvider or in a separate configuration file, and ensuring that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
10. Ensure that the primary color and ramp are properly documented, with clear instructions on how to use them in different contexts and scenarios. This may include providing examples of how to use the primary color and ramp in different components, and ensuring that they are accessible to all developers working on the codebase.
11. Ensure that if a variable is defined by a primary color or ramp value, it is properly handled and accessible.
    - For example, if the theme mode is dark, ensure you use the appropriate ramp value (e.g., `--color-primary-900` for dark mode `--color-primary-background`) and if the theme mode is light, ensure you use the appropriate ramp value (e.g., `--color-primary-100` for light mode). Ensure that these values are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
    - Add checks that check whether the generated color being used in whatever context is appropriate and accessible.
    - Allow tweaks to ramp values/primary color values to ensure accessibility and proper contrast ratios, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
12. Ensure that the primary color is properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
13. Ensure that the primary color is used consistently across the codebase, and that it is accessible to all components that rely on it. This may include updating existing components to use the new primary color and ramp, and ensuring that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
14. Ensure that the primary color is updated properly in both directions.
15. Ensure that the primary color is compatible with different browsers and devices, and does not introduce any issues related to responsiveness or accessibility.
16. Ensure that the primary color is persisted via theme provider/store as well as cookies, according to best practices, and that it is accessible to all components that rely on it. This may include defining the primary color in the ThemeProvider or in a separate configuration file, and ensuring that it is properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
17. Primary Color can be represented by swatches, and/or a color picker and/or sliders for hue/chroma/lightness. Ensure that these representations are accessible to all components that rely on them, and that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
18. Genrate primary color ramps based on the primary color, and ensure that they are accessible to all components that rely on them, and that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.

### Harmony

- Based on the primary color, generate a harmonious color palette that can be used in the theming system. This may include generating complementary, analogous, or triadic colors based on the primary color, and ensuring that they are accessible to all components that rely on them.
- Ensure that the harmonious color palette is defined in a way that is consistent with the rest of the theming system, and that it is accessible to all components that rely on it. This may include defining the harmonious color palette in the ThemeProvider or in a separate configuration file, and ensuring that it is properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Generate a harmonious color palette that is accessible to all components that rely on it, and ensure that it is properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Generate color options for the harmonious color palette that are accessible to all components that rely on it, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the harmonious color palette is compatible with existing components and does not introduce any breaking changes to the codebase.
- Ensure that there are default values for the harmonious color palette, and that they are accessible to all components that rely on them. This may include defining default values in the ThemeProvider or in a separate configuration file, and ensuring that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the harmonious color palette is properly documented, with clear instructions on how to use it in different contexts and scenarios. This may include providing examples of how to use the harmonious color palette in different components, and ensuring that they are accessible to all developers working on the codebase.
- Keep track of the harmonious color palette in the context, and ensure that it is accessible to child components. This may include providing a way for components to access the harmonious color palette through the ThemeProvider or through a separate context provider, and ensuring that it is properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the harmonious color palette is compatible with different rendering environments, including client-side rendering (CSR) and server-side rendering (SSR), and does not introduce any issues related to hydration or rehydration.
- Ensure that the harmonious color palette is properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the harmonious color palette is used consistently across the codebase, and that it is accessible to all components that rely on it. This may include updating existing components to use the new harmonious color palette, and ensuring that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the harmonious color palette is updated properly in both directions.
- Ensure that the harmonious color palette is compatible with different browsers and devices, and does not introduce any issues related to responsiveness or accessibility.
- Ensure that the harmonious color palette is persisted via theme provider/store as well as cookies, according to best practices, and that it is accessible to all components that rely on it. This may include defining the harmonious color palette in the ThemeProvider or in a separate configuration file, and ensuring that it is properly integrated with the rest of the theming system, including any other providers or components that rely on color context.

### Accent Colors

1. Ensure that the accent colors are defined correctly in the theme system, and that they are accessible to all components that rely on them.
2. Accent colors are chosen from harmonious color palette based on the primary color, and should be defined in a way that is consistent with the rest of the theming system.
3. Ramps are then generated based on the accent colors, and should be accessible to all components that rely on them.
4. Ramps should cover values from 50 to 950 (similar to tailwindcss), and should be defined in a way that is consistent with the rest of the theming system.
5. Generate ramps client-side, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
6. Ensure ramps are properly injected into the DOM, and that they are accessible to all components that rely on them, and with TailwindCSS system.
7. Allow ramps to be used in the code like `bg-accent-500` or `text-accent-500`, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
8. Update css variables to use the new accent colors and ramps, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
  - For example, update the `--color-accent` variable to use the new accent color, and update the `--color-accent-50` to `--color-accent-950` variables to use the new ramp values.
  - Also use variables like `--color-accent-foreground` and `--color-accent-background` to define the foreground and background colors for the accent color, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
  - Make variables like accent-foreground and accent-background equal to the other variables like `--color-accent-50` and `--color-accent-950`, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
  - Ensure that other color variables like `--color-primary`, `--color-secondary`, `--color-neutral`, and `--color-base` are defined in a way that is consistent with the rest of the theming system, and that they are accessible to all components that rely on them.
  - Update any color variables that would/should use accent color or ramp values to use the new accent colors and ramps, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
  - Ensure that the new accent colors and ramps are compatible with existing components and do not introduce any breaking changes to the codebase.
  - Ensure that there are default values for the accent colors and ramps, and that they are accessible to all components that rely on them. This may include defining default values in the ThemeProvider or in a separate configuration file, and ensuring that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
  - Ensure that the accent colors and ramps are properly documented, with clear instructions on how to use them in different contexts and scenarios. This may include providing examples of how to use the accent colors and ramps in different components, and ensuring that they are accessible to all developers working on the codebase.
  - Ensure that if a variable is defined by an accent color or ramp value, it is properly handled and accessible.
    - For example, if the theme mode is dark, ensure you use the appropriate ramp value (e.g., `--color-accent-900` for dark mode `--color-accent-background`) and if the theme mode is light, ensure you use the appropriate ramp value (e.g., `--color-accent-100` for light mode). Ensure that these values are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
    - Add checks that check whether the generated color being used in whatever context is appropriate and accessible.
    - Allow tweaks to ramp values/accent color values to ensure accessibility and proper contrast ratios, and ensure that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the accent colors are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the accent colors are used consistently across the codebase, and that they are accessible to all components that rely on them. This may include updating existing components to use the new accent colors and ramps, and ensuring that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the accent colors are updated properly in both directions.
- Ensure that the accent colors are compatible with different browsers and devices, and do not introduce any issues related to responsiveness or accessibility.
- Ensure that the accent colors are persisted via theme provider/store as well as cookies, according to best practices, and that they are accessible to all components that rely on them. This may include defining the accent colors in the ThemeProvider or in a separate configuration file, and ensuring that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the accent colors are compatible with different rendering environments, including client-side rendering (CSR) and server-side rendering (SSR), and do not introduce any issues related to hydration or rehydration.
- Ensure that the accent colors are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the accent colors are used consistently across the codebase, and that they are accessible to all components that rely on them. This may include updating existing components to use the new accent colors and ramps, and ensuring that they are properly integrated with the rest of the theming system, including any other providers or components that rely on color context.
- Ensure that the accent color is persisted via theme provider/store as well as cookies, according to best practices, and that it is accessible to all components that rely on it. This may include defining the accent color in the ThemeProvider or in a separate configuration file, and ensuring that it is properly integrated with the rest of the theming system, including any other providers or components that rely on color context.

## General

- Consolidate/organize the theme system codebase, including any types, constants, defaults, hooks, providers, components, and utilities related to theming. Ensure that the codebase is well-structured and easy to navigate, and that it follows best practices for code organization and maintainability.
- Ensure that the theme system is well-documented, with clear instructions on how to use it in different contexts and scenarios. This may include providing examples of how to use the theme system in different components, and ensuring that they are accessible to all developers working on the codebase.
- Ensure that the theme system is compatible with different rendering environments, including client-side rendering (CSR) and server-side rendering (SSR), and does not introduce any issues related to hydration or rehydration.
- Ensure that the theme system is compatible with different browsers and devices, and does not introduce any issues related to responsiveness or accessibility.
- Ensure that the theme system is optimized for performance, and does not introduce any unnecessary overhead or complexity to the application.
- Ensure that the theme system is tested thoroughly, with unit tests and integration tests to verify that it behaves as expected in different scenarios and contexts.
- After each section, clean up existing code, remove any unused code, and ensure that the codebase is well-structured and easy to navigate. This may include removing any deprecated or unused components, hooks, or utilities related to theming, and ensuring that the remaining code is properly organized and documented. Finally, optimize and refactor the codebase to ensure that it follows best practices for code organization, performance, and maintainability.
