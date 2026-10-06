// Flag artwork used only by the unlisted three-clock wallpaper.
// IHYC burgee reference: https://www.crwflags.com/Fotw/Flags/us~yihyc.html
export const dialThemes = new Set(['ihyc', 'czech', 'iceland', 'gray']);

export function drawDialFlag(ctx, theme, size, soften = true) {
  if (!dialThemes.has(theme)) return false;
  const n = size;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, n, n);
  if (theme === 'gray') {
    ctx.fillStyle = '#909da9'; ctx.fillRect(0, 0, n, n);
  } else if (theme === 'czech') {
    ctx.fillStyle = '#d7141a'; ctx.fillRect(0, n / 2, n, n / 2);
    ctx.fillStyle = '#11457e';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(n / 2, n / 2); ctx.lineTo(0, n); ctx.closePath(); ctx.fill();
  } else if (theme === 'iceland') {
    // The national flag's 25:18 aspect and 7:1:2:1:14 / 7:1:2:1:7 cross.
    // Fit the complete flag into the circular dial without stretching its cross.
    const width = n, top = n * .10, unit = n / 25;
    ctx.fillStyle = '#02529c'; ctx.fillRect(0, 0, n, n);
    ctx.fillStyle = '#fff';
    ctx.fillRect(7 * unit, 0, 4 * unit, n);
    ctx.fillRect(0, top + 7 * unit, width, 4 * unit);
    ctx.fillStyle = '#dc1e35';
    ctx.fillRect(8 * unit, 0, 2 * unit, n);
    ctx.fillRect(0, top + 8 * unit, width, 2 * unit);
  } else {
    // Keep the recognizable triangular pennant, with its star above the atlas.
    ctx.fillStyle = '#909da9'; ctx.fillRect(0, 0, n, n);
    ctx.save(); ctx.translate(n * .04, -n * .10);
    const w = n * .94, h = w * 216 / 310;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h / 2); ctx.lineTo(0, h); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ed101b'; ctx.lineWidth = w * .115;
    ctx.beginPath(); ctx.moveTo(-w * .035, -h * .04); ctx.lineTo(w * .45, h * 1.04);
    ctx.moveTo(-w * .035, h * 1.04); ctx.lineTo(w * .45, -h * .04); ctx.stroke();
    const x = w * .68, y = h / 2, radius = w * .073;
    ctx.fillStyle = '#001fc4'; ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? radius * .382 : radius;
      const X = x + Math.cos(angle) * r, Y = y + Math.sin(angle) * r;
      if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // Slightly soften the bright white so the gold rings remain clear.
  if (soften) { ctx.fillStyle = 'rgba(10,18,30,0.22)'; ctx.fillRect(0, 0, n, n); }
  return true;
}

// Reduce daily flag colors and contrast while keeping their shapes recognizable.
function muteDailyFlag(pixels) {
  for (let k = 0; k < pixels.length; k += 4) {
    const r = pixels[k], g = pixels[k+1], b = pixels[k+2];
    const gray = .2126*r + .7152*g + .0722*b;
    for (let channel = 0; channel < 3; channel++) {
      pixels[k+channel] = Math.round(104 + (gray-128)*.32 + (pixels[k+channel]-gray)*.06);
    }
  }
  return pixels;
}

export async function flagPixels(theme, size = 1024, muted = true) {
  const country = /^country-(us|eg|is|fi|no|gb|mx|pk|ca|it|in|kr|jp|cz|fr)$/.exec(theme);
  if (!country && !dialThemes.has(theme)) return null;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (country) {
    const img = new Image();
    img.src = new URL(`./flags/${country[1]}.png`,import.meta.url).href;
    await img.decode();
    ctx.drawImage(img,0,0,size,size);
    if (muted) { ctx.fillStyle = 'rgba(10,18,30,0.22)';ctx.fillRect(0,0,size,size); }
  } else drawDialFlag(ctx, theme, size, muted);
  const pixels = ctx.getImageData(0, 0, size, size).data;
  return muted && (country || theme === 'iceland') ? muteDailyFlag(pixels) : pixels;
}
