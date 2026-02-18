# Logo Color Setup Guide

This guide explains how to customize the logo colors throughout the application.

## Quick Setup

1. **Identify your logo color**: Get the hex color code from your logo (e.g., `#0F766E`)

2. **Update the base color** in `frontend/src/styles/theme.css`:
   ```css
   --logo-base: #YOUR_COLOR_HERE; /* Update this to your logo color */
   ```

3. **Generate color shades** using the utility script:
   ```bash
   cd frontend
   node src/utils/generateLogoShades.js #YOUR_COLOR_HERE
   ```

4. **Copy the generated shades** to `theme.css` and replace the existing `--logo-*` variables.

## Color System

The application uses a comprehensive color system based on your logo color:

### Base Colors
- `--logo-base`: Your primary logo color (update this)
- `--logo-primary`: Same as base (used for main accents)
- `--logo-light`: 20% lighter (for hover states)
- `--logo-lighter`: 40% lighter (for light backgrounds)
- `--logo-lightest`: 60% lighter (for very light backgrounds)
- `--logo-pale`: 85% lighter (for subtle backgrounds)
- `--logo-dark`: 20% darker (for borders and emphasis)
- `--logo-darker`: 40% darker (for dark backgrounds)
- `--logo-darkest`: 60% darker (for deepest accents)

### Heatmap Colors
The system automatically generates 8 heatmap shades:
- `--heatmap-1` to `--heatmap-8`: From lightest (low values) to darkest (high values)

### Chart Colors
Chart colors automatically use logo variations:
- `--chart-1` to `--chart-7`: Various shades for different data series

## Usage in Components

### CSS Variables
```css
.my-element {
  background-color: var(--logo-primary);
  color: var(--logo-light);
  border-color: var(--logo-dark);
}
```

### Tailwind Classes
```tsx
<div className="bg-logo-primary text-logo-light">
  Content
</div>
```

### Heatmaps
```tsx
<div style={{ backgroundColor: 'var(--heatmap-5)' }}>
  Medium intensity
</div>
```

## Example: Updating to a New Logo Color

If your logo color is `#3B82F6` (blue):

1. Run the generator:
   ```bash
   node src/utils/generateLogoShades.js #3B82F6
   ```

2. Copy the output and update `theme.css`:
   ```css
   --logo-base: #3B82F6;
   --logo-darkest: #1E3A8A;
   --logo-darker: #2563EB;
   --logo-dark: #3B82F6;
   --logo-primary: var(--logo-base);
   --logo-light: #60A5FA;
   --logo-lighter: #93C5FD;
   --logo-lightest: #DBEAFE;
   --logo-pale: #EFF6FF;
   ```

3. All components, charts, and heatmaps will automatically use the new color scheme!

## Notes

- The accent color (`--accent`) automatically uses `--logo-primary`
- All chart colors reference logo variations
- Heatmaps use the full 8-shade scale for smooth gradients
- Dark mode automatically uses lighter logo shades for better contrast
