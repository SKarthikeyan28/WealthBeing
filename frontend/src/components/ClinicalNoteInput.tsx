import { useState } from 'react'
import { useStore } from '../store'

interface Props {
  rxId: string
  onClose: () => void
}

export default function ClinicalNoteInput({ rxId, onClose }: Props) {
  const [text, setText] = useState('')
  const addClinicalNote = useStore((s) => s.addClinicalNote)

  const handleSubmit = () => {
    if (!text.trim()) return
    addClinicalNote({
      id: crypto.randomUUID(),
      rxId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    })
    setText('')
    onClose()
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <textarea
        className="w-full rounded-lg border border-border bg-bg text-sm text-white p-3 resize-none focus:outline-none focus:border-purple"
        rows={3}
        placeholder="Add clinical observation..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="text-xs text-text-muted hover:text-white transition-colors px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="text-xs font-medium bg-purple text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
        >
          Save Note
        </button>
      </div>
    </div>
  )
}
