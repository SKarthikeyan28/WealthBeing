import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { colours, SENTIMENT_OPTIONS, PROMPT_CHIPS } from '../constants/theme'
import { useInsights, useAdviserChat } from '../hooks/useAdviser'
import RxCard from '../components/RxCard'
import ClinicalNoteInput from '../components/ClinicalNoteInput'
import ErrorCard from '../components/ErrorCard'

interface ChatMessage {
  role: 'user' | 'adviser'
  content: string
}

export default function PrescriptionPad() {
  const persona = useStore((s) => s.persona)
  const sentiment = useStore((s) => s.sentiment)
  const setSentiment = useStore((s) => s.setSentiment)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [noteForRxId, setNoteForRxId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: insightsData, isLoading: insightsLoading, isError: insightsError, error: insightsErrorDetail, refetch: refetchInsights } = useInsights()
  const insights = insightsData?.insights ?? []
  const chatMutation = useAdviserChat()
  const loading = chatMutation.isPending

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [messages])

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    chatMutation.mutate(
      { message: text, sentiment },
      {
        onSuccess: (data) => {
          setMessages((m) => [...m, { role: 'adviser', content: data.response }])
        },
        onError: () => {
          setMessages((m) => [
            ...m,
            { role: 'adviser', content: 'Unable to retrieve vital reading. Please try again.' },
          ])
        },
      }
    )
  }

  const handleChipClick = (prompt: string) => setInputValue(prompt)
  const isAdviserMode = persona === 'ADVISER'

  if (insightsError) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <ErrorCard
          title="Unable to load insights"
          message={insightsErrorDetail?.message ?? 'Check that the gateway and adviser service are running.'}
          onRetry={() => refetchInsights()}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg">
      <div className="flex-shrink-0 p-6 space-y-6">
        {/* RxCards from API */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insightsLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-surface h-40 animate-pulse" />
              ))
            : insights.map((insight) => (
                <div key={insight.id}>
                  <RxCard
                    vital={insight.vital}
                    title={insight.title}
                    body={insight.body}
                    prescribedAction={insight.prescribed_action}
                    rxId={insight.id}
                    isAdviserMode={isAdviserMode}
                    onAddNote={isAdviserMode ? () => setNoteForRxId((id) => (id === insight.id ? null : insight.id)) : undefined}
                  />
                  {isAdviserMode && noteForRxId === insight.id && (
                    <ClinicalNoteInput
                      rxId={insight.id}
                      vital={insight.vital}
                      onClose={() => setNoteForRxId(null)}
                    />
                  )}
                </div>
              ))}
        </div>

        {/* Sentiment selector */}
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-2">How are you feeling?</p>
          <div className="flex flex-wrap gap-2">
            {SENTIMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSentiment(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sentiment === opt.value
                    ? 'bg-teal text-bg'
                    : 'bg-surface border border-border text-text-muted hover:text-white hover:border-teal/50'
                }`}
                style={sentiment === opt.value ? { backgroundColor: colours.teal, color: colours.bg ?? '#080C14' } : undefined}
              >
                <span className="mr-1.5">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt chips */}
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-2">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_CHIPS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleChipClick(prompt)}
                className="px-3 py-1.5 rounded-lg text-sm border border-border bg-surface text-text-muted hover:text-white hover:border-teal/50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-border">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-text-muted text-center py-8">Send a message to get a prescribed action.</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              {msg.role === 'user' ? (
                <div
                  className="max-w-[85%] rounded-xl px-4 py-2.5 text-sm text-bg"
                  style={{ backgroundColor: colours.teal }}
                >
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[85%] rounded-xl border border-border bg-surface p-4 text-sm text-white">
                  {msg.content.split('\n\n').map((para, j) => {
                    const isPrescribed = para.startsWith('Prescribed Action:')
                    return (
                      <div
                        key={j}
                        className={isPrescribed ? 'mt-3 pl-3 border-l-2 py-1' : ''}
                        style={isPrescribed ? { borderColor: colours.teal } : undefined}
                      >
                        {para}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-border bg-surface px-4 py-3 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 p-4 border-t border-border flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask your financial health adviser..."
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:border-teal"
          />
          <button
            onClick={handleSend}
            disabled={loading || !inputValue.trim()}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-bg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: colours.teal }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
