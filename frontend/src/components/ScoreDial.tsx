import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { wwsColour, HEALTH_LABEL } from '../constants/theme'

interface Props {
  score: number
  max?: number
  label?: string
}

const SIZE = 260
const STROKE = 18
const R = (SIZE - STROKE) / 2
const CIRCUMFERENCE = Math.PI * R  // half-circle arc

export default function ScoreDial({ score, max = 1000, label }: Props) {
  const motionScore = useMotionValue(0)
  const displayScore = useRef(0)

  const dashOffset = useTransform(motionScore, (v) => {
    const pct = v / max
    return CIRCUMFERENCE * (1 - pct)
  })

  useEffect(() => {
    const controls = animate(motionScore, score, { duration: 1.8, ease: 'easeOut' })
    motionScore.on('change', (v) => { displayScore.current = Math.round(v) })
    return controls.stop
  }, [score, motionScore])

  const colour = wwsColour(score)
  const cx = SIZE / 2

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={SIZE} height={SIZE / 2 + STROKE} viewBox={`0 0 ${SIZE} ${SIZE / 2 + STROKE}`}>
        {/* Track */}
        <path
          d={`M ${STROKE / 2} ${SIZE / 2} A ${R} ${R} 0 0 1 ${SIZE - STROKE / 2} ${SIZE / 2}`}
          fill="none"
          stroke="#1E293B"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Fill */}
        <motion.path
          d={`M ${STROKE / 2} ${SIZE / 2} A ${R} ${R} 0 0 1 ${SIZE - STROKE / 2} ${SIZE / 2}`}
          fill="none"
          stroke={colour}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset: dashOffset }}
        />
        {/* Score text */}
        <text x={cx} y={SIZE / 2 - 12} textAnchor="middle" fill="#FFFFFF" fontSize="42" fontWeight="700" fontFamily="DM Sans">
          {score}
        </text>
        <text x={cx} y={SIZE / 2 + 10} textAnchor="middle" fill={colour} fontSize="14" fontWeight="500" fontFamily="DM Sans">
          {label ?? HEALTH_LABEL(score)}
        </text>
      </svg>
      <p className="text-xs text-text-muted">out of {max}</p>
    </div>
  )
}
