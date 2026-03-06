import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg:          '#080C14',
        surface:     '#0F1623',
        border:      '#1E293B',
        teal:        '#00D4AA',
        'teal-muted':'#00A88B',
        amber:       '#F59E0B',
        orange:      '#F97316',
        danger:      '#EF4444',
        purple:      '#7C6FFF',
        'text-muted':'#94A3B8',
      },
    },
  },
  plugins: [forms],
}

export default config
