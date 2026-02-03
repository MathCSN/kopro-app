# Dark Mode Implementation

This directory contains the dark mode implementation for the Kopro application.

## Components

### ThemeProvider
Wraps the entire application to provide theme context. Already configured in `App.tsx`.

**Configuration:**
- `attribute="class"` - Uses class-based theme switching
- `defaultTheme="system"` - Defaults to system preference
- `enableSystem` - Respects OS-level dark mode preference
- `storageKey="kopro-theme"` - Persists user preference in localStorage
- `disableTransitionOnChange={false}` - Enables smooth transitions

### DarkModeToggle
Full dropdown menu with options for Light, Dark, and System modes.

**Usage:**
```tsx
import { DarkModeToggle } from "@/components/theme/DarkModeToggle";

<DarkModeToggle />
```

### DarkModeToggleSimple
Simple button that toggles between light and dark modes only.

**Usage:**
```tsx
import { DarkModeToggleSimple } from "@/components/theme/DarkModeToggle";

<DarkModeToggleSimple />
```

## Features

### CSS Variables
All colors are defined using CSS custom properties in `src/index.css`:
- Automatically switch based on `.dark` class
- Proper contrast ratios in both modes
- Smooth 200ms transitions for all color changes

### Persistent Storage
User preference is saved to localStorage as `kopro-theme` and restored on page load.

### System Preference Support
Automatically detects and respects the user's OS-level dark mode setting when "System" is selected.

### Accessibility
- Proper ARIA labels on all buttons
- Screen reader text for icon-only toggles
- Keyboard navigation support
- Focus indicators

### Where It's Used
The dark mode toggle has been added to:
- AppSidebar (main sidebar)
- AdminSidebar (admin panel)
- BailleurSidebar (landlord view)
- SyndicSidebar (syndic view)

## Customization

### Adding to Other Components
Simply import and use the toggle component:

```tsx
import { DarkModeToggleSimple } from "@/components/theme/DarkModeToggle";

function MyComponent() {
  return (
    <div>
      <DarkModeToggleSimple />
    </div>
  );
}
```

### Using Theme in Code
```tsx
import { useTheme } from "next-themes";

function MyComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      Current theme: {theme}
      <button onClick={() => setTheme("dark")}>Go Dark</button>
    </div>
  );
}
```

### Updating Colors
Edit the CSS variables in `src/index.css`:

```css
.dark {
  --background: 220 20% 10%;
  --foreground: 36 20% 95%;
  /* etc... */
}
```

## Color System

The application uses HSL color values for easy manipulation:
- `--background` - Main background
- `--foreground` - Main text
- `--card` - Card backgrounds
- `--primary` - Primary brand color
- `--secondary` - Secondary accent
- `--muted` - Muted backgrounds
- `--border` - Border colors
- `--destructive` - Error states
- `--success` - Success states
- `--warning` - Warning states

All colors maintain WCAG AA contrast ratios in both light and dark modes.
