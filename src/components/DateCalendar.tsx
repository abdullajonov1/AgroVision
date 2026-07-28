import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './DateCalendar.css'

export function formatDisplayDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

export function DateCalendar({
  value,
  onChange,
  onClose,
  align = 'right',
}: {
  value: Date
  onChange: (d: Date) => void
  onClose: () => void
  align?: 'left' | 'right'
}) {
  const [view, setView] = useState(new Date(value.getFullYear(), value.getMonth(), 1))
  const weekdays = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

  const days = useMemo(() => {
    const year = view.getFullYear()
    const month = view.getMonth()
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: Array<{ date: Date; inMonth: boolean }> = []

    for (let i = 0; i < firstDow; i++) {
      cells.push({ date: new Date(year, month, -firstDow + i + 1), inMonth: false })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: new Date(year, month, day), inMonth: true })
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date
      cells.push({
        date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
        inMonth: false,
      })
    }
    return cells
  }, [view])

  const monthLabel = view.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

  return (
    <div className={`date-cal date-cal--${align}`} role="dialog">
      <div className="date-cal__nav">
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
        >
          <ChevronLeft size={16} />
        </button>
        <strong>{monthLabel}</strong>
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="date-cal__week">
        {weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="date-cal__grid">
        {days.map(({ date, inMonth }) => {
          const selected =
            date.getFullYear() === value.getFullYear() &&
            date.getMonth() === value.getMonth() &&
            date.getDate() === value.getDate()
          return (
            <button
              key={date.toISOString()}
              type="button"
              className={[
                'date-cal__day',
                inMonth ? '' : 'is-muted',
                selected ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                onChange(date)
                onClose()
              }}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
