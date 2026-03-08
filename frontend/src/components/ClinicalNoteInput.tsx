import { useState } from 'react'
import { useStore } from '../store'
import { colours } from '../constants/theme'

interface Props {
  rxId: string
  vital: string       // pillar key — stored on the note for sidebar tagging
  onClose: () => void
}

export default function ClinicalNoteInput({ rxId, vital, onClose }: Props) {
  const [text, setText] = useState('')
  const addClinicalNote = useStore((s) => s.addClinicalNote)

  const handleSubmit = () => {
    if (!text.trim()) return
    addClinicalNote({
      id:        crypto.randomUUID(),
      rxId,
      vital,
      text:      text.trim(),
      createdAt: new Date().toISOString(),
    })
    setText('')
    onClose()
  }

  return (
    <div className="flex flex-col gap-2 mt-2 p-3 rounded-lg border border-border bg-bg">
      <textarea
        className="w-full rounded-lg border border-border bg-surface text-sm text-white p-3 resize-none focus:outline-none transition-colors"
        style={{ '--tw-ring-color': colours.purple } as React.CSSProperties}
        rows={3}
        placeholder="Add clinical observation..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
        }}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="text-xs text-text-muted hover:text-white transition-colors px-3 py-1.5 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="text-xs font-semibold rounded-lg px-3 py-1.5 transition-opacity disabled:opacity-40 hover:opacity-90"
          style={{ backgroundColor: colours.purple, color: '#fff' }}
        >
          Save Note
        </button>
      </div>
    </div>
  )
}
