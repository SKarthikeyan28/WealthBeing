import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { colours, SENTIMENT_OPTIONS, PROMPT_CHIPS } from '../constants/theme'
import RxCard from '../components/RxCard'
import ClinicalNoteInput from '../components/ClinicalNoteInput'

// Hardcoded insight data (Phase 3: use useInsights)
const HARDCODED_INSIGHTS = [
  {
    id: 'rx-001',
    vital: 'liquidity',
    title: 'Emergency Fund Gap',
    body: 'Your liquidity coverage sits at 4.2 months — below the 6-month target. A shortfall of ~S$7,200.',
    prescribed_action: 'Redirect S$600/month to your emergency fund for 12 months.',
  },
  {
    id: 'rx-002',
    vital: 'risk_reward',
    title: 'Concentration Risk: NVDA',
    body: 'NVDA accounts for 38% of your equity portfolio — above the 35% safe threshold.',
    prescribed_action: 'Sell 5% of NVDA and reallocate to a broad ETF (e.g., VOO).',
  },
  {
    id: 'rx-003',
    vital: 'growth_momentum',
    title: 'Savings Rate Below Target',
    body: 'Current savings rate: 22%. Target: 30%. At current rate, retirement gap widens by ~S$45,000 by age 45.',
    prescribed_action: 'Automate an additional S$800/month transfer to investments on payday.',
  },
]

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
  const [loading, setLoading] = useState(false)
  const [noteForRxId, setNoteForRxId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [messages])

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    // Simulate response (Phase 3: use useAdviserChat)
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: 'adviser',
          content: `Based on your current Wealth Health Score of 724 (Moderate Health), your liquidity and concentration risk are the main areas to address.\n\nPrescribed Action: Increase your emergency fund from 4.2 to 6 months of expenses by redirecting S$600/month for 12 months.`,
        },
      ])
      setLoading(false)
    }, 1200)
  }

  const handleChipClick = (prompt: string) => setInputValue(prompt)

  const isAdviserMode = persona === 'ADVISER'

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg">
      <div className="flex-shrink-0 p-6 space-y-6">
        {/* 3 RxCards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HARDCODED_INSIGHTS.map((insight) => (
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
                <ClinicalNoteInput rxId={insight.id} onClose={() => setNoteForRxId(null)} />
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
