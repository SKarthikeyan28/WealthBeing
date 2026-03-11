// ─── Colour Tokens ──────────────────────────────────────────────────────────

export const colours = {
  bg:          '#080C14',
  surface:     '#0F1623',
  border:      '#1E293B',
  teal:        '#00D4AA',
  tealMuted:   '#00A88B',
  amber:       '#F59E0B',
  orange:      '#F97316',
  red:         '#EF4444',
  purple:      '#7C6FFF',
  textPrimary: '#FFFFFF',
  textMuted:   '#94A3B8',
} as const

export const statusColour = {
  healthy:  colours.teal,
  monitor:  colours.amber,
  critical: colours.red,
} as const

export const wwsColour = (score: number): string => {
  if (score >= 900) return colours.teal
  if (score >= 750) return colours.tealMuted
  if (score >= 600) return colours.amber
  if (score >= 400) return colours.orange
  return colours.red
}

// ─── Panel Names ────────────────────────────────────────────────────────────

export type PanelId = 'pulse' | 'vitals' | 'prescription' | 'treatment' | 'anatomy' | 'cashflow'

export const PANEL_NAMES: Record<PanelId, string> = {
  pulse:        'Pulse',
  vitals:       'Vitals',
  prescription: 'Prescription Pad',
  treatment:    'Treatment Plan',
  anatomy:      'Financial Anatomy',
  cashflow:     'Cash Flow',
}

// ─── Status Labels ───────────────────────────────────────────────────────────

export type Status = 'healthy' | 'monitor' | 'critical'

export const STATUS_LABELS: Record<Status, string> = {
  healthy:  'Healthy Range',
  monitor:  'Requires Monitoring',
  critical: 'Critical',
}

export const STATUS_COLOUR = (status: Status): string => statusColour[status]

// ─── Health Labels ───────────────────────────────────────────────────────────

export const HEALTH_LABEL = (wws: number): string => {
  if (wws >= 900) return 'Excellent Health'
  if (wws >= 750) return 'Good Health'
  if (wws >= 600) return 'Moderate Health'
  if (wws >= 400) return 'Requires Attention'
  return 'Critical'
}

// ─── Sentiment ───────────────────────────────────────────────────────────────

export type Sentiment = 'stressed' | 'unsure' | 'okay' | 'great' | 'celebrating'

export const SENTIMENT_OPTIONS: { value: Sentiment; label: string; emoji: string }[] = [
  { value: 'stressed',    label: 'Stressed',    emoji: '😰' },
  { value: 'unsure',      label: 'Unsure',      emoji: '🤔' },
  { value: 'okay',        label: 'Okay',        emoji: '😐' },
  { value: 'great',       label: 'Great',       emoji: '😊' },
  { value: 'celebrating', label: 'Celebrating', emoji: '🎉' },
]

// ─── Prompt Chips ────────────────────────────────────────────────────────────

export const PROMPT_CHIPS: string[] = [
  'Am I healthy enough to retire at 60?',
  'How can I close my liquidity gap faster?',
  'Should I sell some NVDA to rebalance?',
  "What's my biggest financial risk right now?",
]
