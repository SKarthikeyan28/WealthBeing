import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { wwsColour, HEALTH_LABEL, colours } from '../constants/theme'

interface Props {
  score: number
  max?: number
  label?: string
}

// ─── Arc geometry ────────────────────────────────────────────────────────────
// A half-circle (180°) dial. The arc runs left → right, bowing upward.
const SIZE        = 260
const STROKE      = 18
const R           = (SIZE - STROKE) / 2            // 121
const CIRCUMFERENCE = Math.PI * R                  // arc length of a semicircle

// The flat base of the arc sits at y = SIZE / 2 (130).
// ViewBox height = SIZE / 2 + STROKE gives room for the stroke cap below the base.
const VB_HEIGHT   = SIZE / 2 + STROKE             // 148
const CX          = SIZE / 2                       // 130 — horizontal centre

// Arc path: clockwise from left end to right end of the diameter.
const ARC = `M ${STROKE / 2} ${SIZE / 2} A ${R} ${R} 0 0 1 ${SIZE - STROKE / 2} ${SIZE / 2}`

// ─── Component ───────────────────────────────────────────────────────────────

export default function ScoreDial({ score, max = 1000, label }: Props) {
  const motionScore = useMotionValue(0)

  // Drives the arc fill via stroke-dashoffset
  const dashOffset = useTransform(motionScore, (v) => CIRCUMFERENCE * (1 - v / max))

  // Drives the visible counter — state so React re-renders on each frame
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    const controls = animate(motionScore, score, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    })
    return controls.stop
  }, [score, motionScore])

  const colour = wwsColour(score)

  return (
    <div className="flex flex-col items-center">
      <svg
        width={SIZE}
        height={VB_HEIGHT}
        viewBox={`0 0 ${SIZE} ${VB_HEIGHT}`}
        aria-label={`Wealth Wellness Score: ${score} out of ${max}`}
        role="img"
      >
        {/* ── Track (background arc) ── */}
        <path
          d={ARC}
          fill="none"
          stroke={colours.border}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* ── Filled arc (animated) ── */}
        <motion.path
          d={ARC}
          fill="none"
          stroke={colour}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset: dashOffset }}
        />

        {/* ── Glow hint at the leading tip ── */}
        <motion.path
          d={ARC}
          fill="none"
          stroke={colour}
          strokeWidth={STROKE + 4}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset: dashOffset, opacity: 0.15, filter: 'blur(4px)' }}
        />

        {/* ── Animated score counter ── */}
        <text
          x={CX}
          y={SIZE / 2 - 16}
          textAnchor="middle"
          fill={colours.textPrimary}
          fontSize="48"
          fontWeight="700"
          fontFamily="DM Sans, ui-sans-serif, sans-serif"
        >
          {displayScore}
        </text>

        {/* ── Health label below the number ── */}
        <text
          x={CX}
          y={SIZE / 2 + 8}
          textAnchor="middle"
          fill={colour}
          fontSize="13"
          fontWeight="500"
          fontFamily="DM Sans, ui-sans-serif, sans-serif"
          letterSpacing="0.02em"
        >
          {label ?? HEALTH_LABEL(score)}
        </text>
      </svg>

      <p className="text-xs text-text-muted -mt-1">out of {max}</p>
    </div>
  )
}
