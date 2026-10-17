import React, { useMemo } from 'react';

// Shared marine-icon backdrop used by the Home hero and the Launching Soon page.
const ICON_SOURCES = [
  '/landing-icons-opt/Anchor_1.webp',
  '/landing-icons-opt/Anchor_2.webp',
  '/landing-icons-opt/Anchor_3.webp',
  '/landing-icons-opt/Boat_1.webp',
  '/landing-icons-opt/Boat_2.webp',
  '/landing-icons-opt/Boat_3.webp',
  '/landing-icons-opt/Bottle.webp',
  '/landing-icons-opt/Coral_1.webp',
  '/landing-icons-opt/Coral_2.webp',
  '/landing-icons-opt/Fish_1.webp',
  '/landing-icons-opt/Fish_2.webp',
  '/landing-icons-opt/Fish_3.webp',
  '/landing-icons-opt/Goggle_1.webp',
  '/landing-icons-opt/Goggle_2.webp',
  '/landing-icons-opt/Hook_1.webp',
  '/landing-icons-opt/Hook_2.webp',
  '/landing-icons-opt/Lifeboat_1.webp',
  '/landing-icons-opt/Lifeboat_2.webp',
  '/landing-icons-opt/Octopus_.webp',
  '/landing-icons-opt/Pearl.webp',
  '/landing-icons-opt/Pearl_2.webp',
  '/landing-icons-opt/Starfish.webp',
  '/landing-icons-opt/Surf_1.webp',
  '/landing-icons-opt/Surf_2.webp',
  '/landing-icons-opt/Surf_3.webp',
  '/landing-icons-opt/Turtle_1.webp',
  '/landing-icons-opt/Turtle_2.webp',
  '/landing-icons-opt/Turtle_3.webp',
  '/landing-icons-opt/Weed.webp',
  '/landing-icons-opt/Wheel.webp',
];

const ICON_COLORS = ['#DFF2EE', '#D8ECE8', '#E3F4F1', '#D5E8E3', '#DCEEEA'];

const getIconFamily = (src) => src.split('/').pop().replace('.webp', '').split('_')[0];

const createSeededRandom = (seed) => {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const createLandingDecor = (seed, config) => {
  const rand = createSeededRandom(seed);
  const items = [];
  const shuffledSources = [...ICON_SOURCES].sort(() => rand() - 0.5);
  let sourceIndex = 0;

  const fitsWithoutCollision = (candidate) => !items.some((item) => {
    const dx = item.x - candidate.x;
    const dy = item.y - candidate.y;
    const minDistance = item.radius + candidate.radius + config.minEdgeGap;
    return Math.hypot(dx, dy) < minDistance;
  });

  const canUseFamilyHere = (candidate, family) => !items.some((item) => {
    const dx = item.x - candidate.x;
    const dy = item.y - candidate.y;
    return Math.hypot(dx, dy) < config.nearRadius && item.family === family;
  });

  const totalRows = Math.ceil(config.canvasHeight / config.cellSize);
  const totalCols = Math.ceil(config.canvasWidth / config.cellSize);
  const leftBiasStrength = config.leftBiasStrength || 0;

  for (let row = 0; row < totalRows; row += 1) {
    for (let col = 0; col < totalCols; col += 1) {
      const baseX = col * config.cellSize + config.cellSize / 2;
      const baseY = row * config.cellSize + config.cellSize / 2;
      const size = Math.round(config.minSize + rand() * (config.maxSize - config.minSize));
      const radius = size / 2;
      const edgePadding = Math.max(2, radius * 0.25);
      const src = shuffledSources[sourceIndex % shuffledSources.length];
      sourceIndex += 1;
      const family = getIconFamily(src);
      const maxJitter = config.jitter;

      let placed = false;
      for (let attempt = 0; attempt < 8 && !placed; attempt += 1) {
        const spread = maxJitter * (0.5 + attempt * 0.2);
        const colProgress = totalCols > 1 ? col / (totalCols - 1) : 0;
        const leftBiasShift = (1 - colProgress) * leftBiasStrength * (0.7 + rand() * 0.3);
        const testX = Math.min(
          config.canvasWidth - edgePadding,
          Math.max(edgePadding, baseX + (rand() * 2 - 1) * spread - leftBiasShift),
        );
        const testY = Math.min(
          config.canvasHeight - edgePadding,
          Math.max(edgePadding, baseY + (rand() * 2 - 1) * spread),
        );
        const candidate = { x: testX, y: testY, radius };

        if (!fitsWithoutCollision(candidate)) continue;
        if (attempt < 5 && !canUseFamilyHere(candidate, family)) continue;

        items.push({
          x: testX,
          y: testY,
          radius,
          family,
          src,
          top: `${((testY / config.canvasHeight) * 100).toFixed(2)}%`,
          left: `${((testX / config.canvasWidth) * 100).toFixed(2)}%`,
          size,
          rotate: Math.round(-25 + rand() * 50),
          opacity: Number((config.opacityMin + rand() * (config.opacityMax - config.opacityMin)).toFixed(3)),
          color: ICON_COLORS[Math.floor(rand() * ICON_COLORS.length)],
          className: '',
        });
        placed = true;
      }
    }
  }

  let remainingTopFill = config.topFillCount || 0;
  let topFillAttempts = 0;
  while (remainingTopFill > 0 && items.length && topFillAttempts < (config.topFillCount || 0) * 20) {
    topFillAttempts += 1;
    const size = Math.round(config.minSize + rand() * (config.maxSize - config.minSize));
    const radius = size / 2;
    const edgePadding = Math.max(2, radius * 0.25);
    const src = shuffledSources[sourceIndex % shuffledSources.length];
    sourceIndex += 1;
    const family = getIconFamily(src);
    const testX = Math.min(
      config.canvasWidth - edgePadding,
      Math.max(edgePadding, edgePadding + rand() * Math.max(1, config.canvasWidth - edgePadding * 2)),
    );
    const topBandPx = config.canvasHeight * 0.14;
    const testY = Math.min(
      topBandPx,
      Math.max(edgePadding, edgePadding + rand() * Math.max(1, topBandPx - edgePadding)),
    );
    const candidate = { x: testX, y: testY, radius };

    if (!fitsWithoutCollision(candidate)) continue;
    if (!canUseFamilyHere(candidate, family)) continue;

    items.push({
      x: testX,
      y: testY,
      radius,
      family,
      src,
      top: `${((testY / config.canvasHeight) * 100).toFixed(2)}%`,
      left: `${((testX / config.canvasWidth) * 100).toFixed(2)}%`,
      size,
      rotate: Math.round(-25 + rand() * 50),
      opacity: Number((config.opacityMin + rand() * (config.opacityMax - config.opacityMin)).toFixed(3)),
      color: ICON_COLORS[Math.floor(rand() * ICON_COLORS.length)],
      className: '',
    });
    remainingTopFill -= 1;
  }

  let remainingGapFill = config.gapFillCount || 0;
  let gapFillAttempts = 0;
  while (remainingGapFill > 0 && gapFillAttempts < (config.gapFillCount || 0) * 24) {
    gapFillAttempts += 1;
    const size = Math.round(config.minSize + rand() * (config.maxSize - config.minSize));
    const radius = size / 2;
    const edgePadding = Math.max(2, radius * 0.25);
    const src = shuffledSources[sourceIndex % shuffledSources.length];
    sourceIndex += 1;
    const family = getIconFamily(src);
    const testX = edgePadding + rand() * Math.max(1, config.canvasWidth - edgePadding * 2);
    const testY = edgePadding + rand() * Math.max(1, config.canvasHeight * 0.78 - edgePadding * 2);
    const candidate = { x: testX, y: testY, radius };

    if (!fitsWithoutCollision(candidate)) continue;
    if (!canUseFamilyHere(candidate, family)) continue;

    items.push({
      x: testX,
      y: testY,
      radius,
      family,
      src,
      top: `${((testY / config.canvasHeight) * 100).toFixed(2)}%`,
      left: `${((testX / config.canvasWidth) * 100).toFixed(2)}%`,
      size,
      rotate: Math.round(-25 + rand() * 50),
      opacity: Number((config.opacityMin + rand() * (config.opacityMax - config.opacityMin)).toFixed(3)),
      color: ICON_COLORS[Math.floor(rand() * ICON_COLORS.length)],
      className: '',
    });
    remainingGapFill -= 1;
  }

  let remainingBottomFill = config.bottomFillCount || 0;
  let bottomFillAttempts = 0;
  const bottomBandStart = typeof config.bottomBandStart === 'number' ? config.bottomBandStart : 0.56;
  const bottomBandEnd = typeof config.bottomBandEnd === 'number' ? config.bottomBandEnd : 0.8;
  while (remainingBottomFill > 0 && bottomFillAttempts < (config.bottomFillCount || 0) * 36) {
    bottomFillAttempts += 1;
    const size = Math.round(config.minSize + rand() * (config.maxSize - config.minSize));
    const radius = size / 2;
    const edgePadding = Math.max(2, radius * 0.25);
    const src = shuffledSources[sourceIndex % shuffledSources.length];
    sourceIndex += 1;
    const family = getIconFamily(src);
    const testX = edgePadding + rand() * Math.max(1, config.canvasWidth - edgePadding * 2);
    const bottomStartPx = config.canvasHeight * bottomBandStart;
    const bottomEndPx = config.canvasHeight * bottomBandEnd;
    const testY = Math.min(
      config.canvasHeight - edgePadding,
      Math.max(edgePadding, bottomStartPx + rand() * Math.max(1, bottomEndPx - bottomStartPx)),
    );
    const candidate = { x: testX, y: testY, radius };

    if (!fitsWithoutCollision(candidate)) continue;
    if (!canUseFamilyHere(candidate, family)) continue;

    items.push({
      x: testX,
      y: testY,
      radius,
      family,
      src,
      top: `${((testY / config.canvasHeight) * 100).toFixed(2)}%`,
      left: `${((testX / config.canvasWidth) * 100).toFixed(2)}%`,
      size,
      rotate: Math.round(-25 + rand() * 50),
      opacity: Number((config.opacityMin + rand() * (config.opacityMax - config.opacityMin)).toFixed(3)),
      color: ICON_COLORS[Math.floor(rand() * ICON_COLORS.length)],
      className: '',
    });
    remainingBottomFill -= 1;
  }

  return items;
};

const LANDING_DECOR_MOBILE = createLandingDecor(20260421, {
  canvasWidth: 390,
  canvasHeight: 760,
  cellSize: 48,
  jitter: 14,
  minSize: 30,
  maxSize: 44,
  minEdgeGap: 3,
  nearRadius: 72,
  opacityMin: 0.3,
  opacityMax: 0.44,
  topFillCount: 12,
  leftBiasStrength: 7,
  gapFillCount: 16,
  bottomFillCount: 10,
  bottomBandStart: 0.57,
  bottomBandEnd: 0.82,
});

const LANDING_DECOR_TABLET = createLandingDecor(20260422, {
  canvasWidth: 900,
  canvasHeight: 760,
  cellSize: 60,
  jitter: 18,
  minSize: 42,
  maxSize: 60,
  minEdgeGap: 4,
  nearRadius: 88,
  opacityMin: 0.18,
  opacityMax: 0.28,
  topFillCount: 7,
  leftBiasStrength: 10,
  gapFillCount: 10,
  bottomFillCount: 6,
  bottomBandStart: 0.56,
  bottomBandEnd: 0.76,
});

const LANDING_DECOR_DESKTOP = createLandingDecor(20260423, {
  canvasWidth: 1440,
  canvasHeight: 760,
  cellSize: 70,
  jitter: 22,
  minSize: 50,
  maxSize: 74,
  minEdgeGap: 5,
  nearRadius: 96,
  opacityMin: 0.22,
  opacityMax: 0.34,
  topFillCount: 11,
  leftBiasStrength: 12,
  gapFillCount: 20,
  bottomFillCount: 10,
  bottomBandStart: 0.56,
  bottomBandEnd: 0.76,
});

const LandingMaskIcon = React.memo(({ src, top, right, bottom, left, size, rotate, opacity, color, className = '' }) => (
  <div
    aria-hidden="true"
    className={`absolute pointer-events-none select-none ${className}`}
    style={{
      top,
      right,
      bottom,
      left,
      width: `${size}px`,
      height: `${size}px`,
      opacity,
      backgroundColor: color,
      transform: `rotate(${rotate}deg)`,
      filter: 'saturate(1.35)',
      WebkitMaskImage: `url(${src})`,
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain',
      WebkitMaskPosition: 'center',
      maskImage: `url(${src})`,
      maskRepeat: 'no-repeat',
      maskSize: 'contain',
      maskPosition: 'center',
    }}
  />
));

// Picks the layout for the viewport and drops icons that would sit under the wave.
export default function LandingDecor({ viewportWidth }) {
  const landingDecor = viewportWidth < 768
    ? LANDING_DECOR_MOBILE
    : viewportWidth < 1024
      ? LANDING_DECOR_TABLET
      : LANDING_DECOR_DESKTOP;

  return useMemo(
    () => landingDecor
      .filter((icon) => {
        const topPercent = Number.parseFloat(icon.top);
        const lowerBandMax = viewportWidth < 768 ? 82 : 74;
        return topPercent > 2 && topPercent < lowerBandMax;
      })
      .map((icon) => (
        <LandingMaskIcon key={`${icon.src}-${icon.top}-${icon.left}`} {...icon} />
      )),
    [landingDecor, viewportWidth],
  );
}
