import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Headphones, Send, X } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import './SupportChat.css'

type Msg = {
  id: string
  from: 'bot' | 'user'
  text: string
}

type SupportChatProps = {
  open: boolean
  onClose: () => void
}

export function SupportChat({ open, onClose }: SupportChatProps) {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const seeded = useRef(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setShown(true))
      })
      return () => cancelAnimationFrame(id)
    }
    setShown(false)
    const timer = window.setTimeout(() => setMounted(false), 320)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open || !shown) return
    if (!seeded.current) {
      setMsgs([
        {
          id: 'welcome',
          from: 'bot',
          text: t('support.chat.welcome'),
        },
      ])
      seeded.current = true
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 280)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, shown, onClose, t])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, open])

  if (!mounted) return null

  const send = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    const userMsg: Msg = { id: `u${Date.now()}`, from: 'user', text: value }
    setText('')
    setMsgs((prev) => [...prev, userMsg])
    window.setTimeout(() => {
      setMsgs((prev) => [
        ...prev,
        {
          id: `b${Date.now()}`,
          from: 'bot',
          text: t('support.chat.reply'),
        },
      ])
    }, 550)
  }

  return (
    <div
      className={`support-chat${shown ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('support.chat.title')}
    >
      <header className="support-chat__head">
        <div className="support-chat__brand">
          <span className="support-chat__icon" aria-hidden>
            <Headphones size={16} />
          </span>
          <div>
            <strong>{t('support.chat.title')}</strong>
            <span>{t('support.chat.status')}</span>
          </div>
        </div>
        <button
          type="button"
          className="support-chat__close"
          onClick={onClose}
          aria-label={t('support.chat.close')}
        >
          <X size={16} />
        </button>
      </header>

      <div className="support-chat__list" ref={listRef}>
        {msgs.map((m) => (
          <div key={m.id} className={`support-chat__bubble support-chat__bubble--${m.from}`}>
            {m.text}
          </div>
        ))}
      </div>

      <form className="support-chat__form" onSubmit={send}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('support.chat.placeholder')}
        />
        <button type="submit" aria-label={t('support.chat.send')} disabled={!text.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
