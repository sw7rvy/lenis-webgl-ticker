type TickFn = (time: number, deltaMs: number) => void

type Subscriber = { fn: TickFn; priority: number }

const subscribers: Subscriber[] = []
let rafId: number | null = null
let last = 0

function loop(time: number) {
  rafId = requestAnimationFrame(loop)
  const deltaMs = last === 0 ? 16.6667 : time - last
  last = time
  for (let i = 0; i < subscribers.length; i++) {
    subscribers[i].fn(time, deltaMs)
  }
}

export function subscribe(fn: TickFn, priority = 0) {
  subscribers.push({ fn, priority })
  subscribers.sort((a, b) => a.priority - b.priority)
  if (rafId === null) rafId = requestAnimationFrame(loop)
  return () => {
    const i = subscribers.findIndex((s) => s.fn === fn)
    if (i !== -1) subscribers.splice(i, 1)
    if (subscribers.length === 0 && rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
      last = 0
    }
  }
}

export const TICK_PRIORITY = {
  SCROLL: -100,
  ANIMATION: 0,
  RENDER: 100,
} as const
