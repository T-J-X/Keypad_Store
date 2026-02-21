import fs from 'fs';

let css = fs.readFileSync('app/globals.css', 'utf-8');

// 1. Remove redundant @utility definitions
css = css.replace(/\/\* Define reusable utilities so v4 can resolve @apply references\. \*\/\s*@utility btn-base \{[\s\S]*?\}\s*@utility btn-primary \{[\s\S]*?\}/, '');

// 2. Extract keyframes
const keyframesRegex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{[\s\S]*?\n\}/g;
let keyframesMatch;
let keyframesToMove = [];
let replacementCss = css;

while ((keyframesMatch = keyframesRegex.exec(css)) !== null) {
    keyframesToMove.push(keyframesMatch[0]);
}

for (const kf of keyframesToMove) {
    replacementCss = replacementCss.replace(kf, '');
}

// Ensure unique keyframes
keyframesToMove = [...new Set(keyframesToMove)];

// 3. Remove .animate-* classes that should be in @theme
replacementCss = replacementCss.replace(/\.animate-soft-pulse\s*\{[\s\S]*?\}/g, '');
replacementCss = replacementCss.replace(/\.animate-icon-pulse-blue\s*\{[\s\S]*?\}/g, '');

// Remove standard font-mono from layer utilities as it's redundant
replacementCss = replacementCss.replace(/@layer utilities\s*\{\s*\.font-geist-mono,\s*\.font-mono\s*\{\s*font-family:\s*var\(--font-mono\);\s*\}\s*\}/g, '');

// Clean up empty @layer utilities
replacementCss = replacementCss.replace(/@layer utilities\s*\{\s*\}/g, '');

// Add missing animations to @theme
const extraThemeAnim = `
  --animate-soft-pulse: softPulse 2.2s ease-in-out infinite;
  --animate-icon-pulse-blue: iconPulseBlue 2.2s ease-in-out infinite;
  --animate-float-soft: float-soft 3s ease-in-out infinite;
  --animate-backlit-glow-pulse: backlitGlowPulse 2.6s ease-in-out infinite;
`;

const newThemeContent = extraThemeAnim + `\n` + keyframesToMove.map(k => `  ` + k.replace(/\n/g, '\n  ')).join('\n') + `\n`;
replacementCss = replacementCss.replace(/@theme\s*\{/, `@theme {${newThemeContent}`);

fs.writeFileSync('app/globals.css', replacementCss, 'utf-8');
console.log('CSS refactored successfully.');
