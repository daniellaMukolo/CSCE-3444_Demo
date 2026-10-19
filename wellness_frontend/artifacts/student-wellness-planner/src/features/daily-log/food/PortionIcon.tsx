// =============================================================================
// Portion size drawings - Malika
// =============================================================================
// WHAT IT DOES
//   Simple drawings for portion sizes: plates and bowls grow with their scale,
//   cups get taller, and "snack size" is a small dish.
//
// HOW IT CONNECTS
//   - FoodPicker.tsx shows one on each portion button. Portions are defined in
//     data/food_catalog.json (shape and scale).
// =============================================================================

import type { Portion } from '@/lib/types';

const STROKE = '#4f7a63';
const FILL = '#e3ecd5';

export function PortionIcon({ portion }: { portion: Portion }) {
  const scale = portion.scale ?? 2; // 1 small, 2 medium, 3 large
  let shape;
  if (portion.shape === 'plate') {
    const rx = 12 + scale * 5;
    shape = (
      <>
        <ellipse cx="32" cy="30" rx={rx} ry={rx * 0.36} fill={FILL} stroke={STROKE} strokeWidth="2" />
        <ellipse
          cx="32"
          cy="30"
          rx={rx * 0.62}
          ry={rx * 0.2}
          fill="none"
          stroke={STROKE}
          strokeWidth="1.2"
          opacity="0.6"
        />
      </>
    );
  } else if (portion.shape === 'bowl') {
    const w = 10 + scale * 5;
    const depth = 8 + scale * 3;
    shape = (
      <>
        <path
          d={`M${32 - w} 22 Q32 ${22 + depth * 2} ${32 + w} 22 Z`}
          fill={FILL}
          stroke={STROKE}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <ellipse cx="32" cy="22" rx={w} ry="3" fill="#f6f2e5" stroke={STROKE} strokeWidth="2" />
      </>
    );
  } else if (portion.shape === 'cup') {
    const h = 14 + scale * 5;
    shape = (
      <path
        d={`M24 ${38 - h} L40 ${38 - h} L38 38 L26 38 Z`}
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    );
  } else {
    shape = (
      <>
        <rect x="22" y="24" width="20" height="10" rx="4" fill={FILL} stroke={STROKE} strokeWidth="2" />
        <circle cx="28" cy="23" r="2.4" fill={STROKE} opacity="0.55" />
        <circle cx="34" cy="21.5" r="2.4" fill={STROKE} opacity="0.55" />
        <circle cx="38" cy="23.5" r="2" fill={STROKE} opacity="0.55" />
      </>
    );
  }
  return (
    <svg viewBox="0 0 64 44" width="64" height="44" aria-hidden="true">
      {shape}
    </svg>
  );
}
