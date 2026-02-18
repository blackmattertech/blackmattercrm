/**
 * Utility script to generate logo color shades
 * Run this with: node src/utils/generateLogoShades.js <HEX_COLOR>
 * Example: node src/utils/generateLogoShades.js #0F766E
 */

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function lighten(color, percent) {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * percent));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * percent));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * percent));
  
  return rgbToHex(r, g, b);
}

function darken(color, percent) {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const r = Math.max(0, Math.round(rgb.r * (1 - percent)));
  const g = Math.max(0, Math.round(rgb.g * (1 - percent)));
  const b = Math.max(0, Math.round(rgb.b * (1 - percent)));
  
  return rgbToHex(r, g, b);
}

const baseColor = process.argv[2] || '#0F766E';

console.log('\n🎨 Logo Color Palette Generator\n');
console.log(`Base Color: ${baseColor}\n`);
console.log('Generated Shades:');
console.log('─'.repeat(50));
console.log(`--logo-darkest:  ${darken(baseColor, 0.6)}  /* 60% darker */`);
console.log(`--logo-darker:   ${darken(baseColor, 0.4)}  /* 40% darker */`);
console.log(`--logo-dark:     ${darken(baseColor, 0.2)}  /* 20% darker */`);
console.log(`--logo-primary:  ${baseColor}  /* Base color */`);
console.log(`--logo-light:    ${lighten(baseColor, 0.2)}  /* 20% lighter */`);
console.log(`--logo-lighter:  ${lighten(baseColor, 0.4)}  /* 40% lighter */`);
console.log(`--logo-lightest: ${lighten(baseColor, 0.6)}  /* 60% lighter */`);
console.log(`--logo-pale:     ${lighten(baseColor, 0.85)}  /* 85% lighter */`);
console.log('─'.repeat(50));
console.log('\n💡 Copy these values to theme.css\n');
