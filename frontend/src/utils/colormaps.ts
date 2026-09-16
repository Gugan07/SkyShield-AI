/**
 * Micro-Doppler Spectrogram Colormap Palettes
 * Converts normalized intensity [0.0 - 1.0] to [r, g, b]
 */

export function plasmaColormap(val: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, val));
  // Plasma approximation
  const r = Math.floor(255 * Math.sin(Math.PI * (v - 0.2)));
  const g = Math.floor(255 * Math.sin(Math.PI * (v - 0.5)));
  const b = Math.floor(255 * (1 - Math.pow(v, 1.5)));

  return [
    Math.max(13, Math.min(255, Math.floor(255 * (0.05 + 0.95 * Math.pow(v, 0.75))))),
    Math.max(8, Math.min(255, Math.floor(255 * Math.pow(v, 1.4)))),
    Math.max(35, Math.min(255, Math.floor(255 * (0.3 + 0.7 * (1 - v)))))
  ];
}

export function defenseRadarColormap(val: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, val));
  if (v < 0.25) {
    // Navy to dark cyan
    const t = v / 0.25;
    return [Math.floor(10 + 10 * t), Math.floor(20 + 70 * t), Math.floor(40 + 100 * t)];
  } else if (v < 0.6) {
    // Dark cyan to bright emerald
    const t = (v - 0.25) / 0.35;
    return [Math.floor(20 + 30 * t), Math.floor(90 + 150 * t), Math.floor(140 * (1 - t) + 80 * t)];
  } else if (v < 0.85) {
    // Bright emerald to vibrant yellow
    const t = (v - 0.6) / 0.25;
    return [Math.floor(50 + 195 * t), 240, Math.floor(80 * (1 - t))];
  } else {
    // Yellow to bright white-hot
    const t = (v - 0.85) / 0.15;
    return [255, 255, Math.floor(200 * t)];
  }
}
