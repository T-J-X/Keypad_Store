const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf-8');

// 1. Remove the @utility btn-base and btn-primary
css = css.replace(/\/\* Define reusable utilities.*?\n@utility btn-base[\s\S]*?@utility btn-primary[\s\S]*?\n}\n/g, '');

// 2. Move keyframes inside @theme
const keyframesRegex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{[\s\S]*?\n\}/g;
let keyframesMatch;
let keyframesToMove = [];
let replacementCss = css;

while ((keyframesMatch = keyframesRegex.exec(css)) !== null) {
  keyframesToMove.push(keyframesMatch[0]);
  replacementCss = replacementCss.replace(keyframesMatch[0], '');
}

// Ensure unique keyframes
keyframesToMove = [...new Set(keyframesToMove)];

const newThemeContent = `\n` + keyframesToMove.map(k => `  ` + k.replace(/\n/g, '\n  ')).join('\n') + `\n`;
replacementCss = replacementCss.replace(/@theme\s*\{/, `@theme {${newThemeContent}`);

// 3. Remove @layer utilities entirely since we move keyframes
replacementCss = replacementCss.replace(/@layer utilities\s*\{([^}]*)\}/g, (match, content) => {
  return content.trim() ? content : '';
});
replacementCss = replacementCss.replace(/@layer utilities\s*\{\s*\.font-geist-mono[\s\S]*?\n\}/g, '');
// Wait, the softPulse was inside @layer utilities. The previous logic might have caught it in keyframesToMove,
// leaving behind `.animate-soft-pulse { animation: softPulse 2.2s ease-in-out infinite; }`.
// Let's add that to @theme!
replacementCss = replacementCss.replace(/\.animate-soft-pulse[\s\S]*?\n\}/g, '');
replacementCss = replacementCss.replace(/@theme\s*\{/, `@theme {\n  --animate-soft-pulse: softPulse 2.2s ease-in-out infinite;`);
replacementCss = replacementCss.replace(/\.animate-icon-pulse-blue[\s\S]*?\n\}/g, '');
replacementCss = replacementCss.replace(/@theme\s*\{/, `@theme {\n  --animate-icon-pulse-blue: iconPulseBlue 2.2s ease-in-out infinite;`);


fs.writeFileSync('app/globals.css', replacementCss, 'utf-8');
console.log('CSS refactored');
