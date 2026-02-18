/**
 * Color utility functions for generating shades and variations
 */

/**
 * Converts hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Lightens a color by a percentage
 */
function lighten(color: string, percent: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * percent));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * percent));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * percent));
  
  return rgbToHex(r, g, b);
}

/**
 * Darkens a color by a percentage
 */
function darken(color: string, percent: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const r = Math.max(0, Math.round(rgb.r * (1 - percent)));
  const g = Math.max(0, Math.round(rgb.g * (1 - percent)));
  const b = Math.max(0, Math.round(rgb.b * (1 - percent)));
  
  return rgbToHex(r, g, b);
}

/**
 * Adjusts color saturation
 */
function saturate(color: string, percent: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  // Convert to HSL for saturation adjustment
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  // Adjust saturation
  s = Math.min(1, Math.max(0, s * (1 + percent)));
  
  // Convert back to RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  
  let rNew = 0, gNew = 0, bNew = 0;
  
  if (h < 1/6) { rNew = c; gNew = x; bNew = 0; }
  else if (h < 2/6) { rNew = x; gNew = c; bNew = 0; }
  else if (h < 3/6) { rNew = 0; gNew = c; bNew = x; }
  else if (h < 4/6) { rNew = 0; gNew = x; bNew = c; }
  else if (h < 5/6) { rNew = x; gNew = 0; bNew = c; }
  else { rNew = c; gNew = 0; bNew = x; }
  
  return rgbToHex(
    Math.round((rNew + m) * 255),
    Math.round((gNew + m) * 255),
    Math.round((bNew + m) * 255)
  );
}

/**
 * Generates a color palette from a base color
 * Returns an object with various shades for use in UI
 */
export function generateColorPalette(baseColor: string): {
  base: string;
  darkest: string;
  darker: string;
  dark: string;
  light: string;
  lighter: string;
  lightest: string;
  pale: string;
  saturated: string;
  desaturated: string;
} {
  return {
    base: baseColor,
    darkest: darken(baseColor, 0.6),
    darker: darken(baseColor, 0.4),
    dark: darken(baseColor, 0.2),
    light: lighten(baseColor, 0.2),
    lighter: lighten(baseColor, 0.4),
    lightest: lighten(baseColor, 0.6),
    pale: lighten(baseColor, 0.85),
    saturated: saturate(baseColor, 0.3),
    desaturated: saturate(baseColor, -0.3),
  };
}

/**
 * Generates heatmap colors from a base color
 * Returns an array of colors from lightest to darkest for heatmaps
 */
export function generateHeatmapColors(baseColor: string, steps: number = 5): string[] {
  const colors: string[] = [];
  const palette = generateColorPalette(baseColor);
  
  // Generate gradient from pale to darkest
  colors.push(palette.pale);
  colors.push(palette.lighter);
  colors.push(palette.base);
  colors.push(palette.dark);
  colors.push(palette.darkest);
  
  // If more steps needed, interpolate
  if (steps > 5) {
    const additional: string[] = [];
    for (let i = 0; i < steps - 5; i++) {
      const ratio = i / (steps - 4);
      if (ratio < 0.5) {
        // Interpolate between lighter and base
        const t = ratio * 2;
        const rgb1 = hexToRgb(palette.lighter)!;
        const rgb2 = hexToRgb(palette.base)!;
        const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
        const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
        const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
        additional.push(rgbToHex(r, g, b));
      } else {
        // Interpolate between base and dark
        const t = (ratio - 0.5) * 2;
        const rgb1 = hexToRgb(palette.base)!;
        const rgb2 = hexToRgb(palette.dark)!;
        const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
        const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
        const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
        additional.push(rgbToHex(r, g, b));
      }
    }
    return [colors[0], ...additional, ...colors.slice(1)];
  }
  
  return colors;
}
