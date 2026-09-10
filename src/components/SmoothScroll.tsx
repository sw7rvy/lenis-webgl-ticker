'use client'

import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { subscribe, TICK_PRIORITY } from '@/lib/ticker'
import { registerGsapBridge } from '@/lib/gsap-bridge'

const LenisContext = createContext<Lenis | null>(null)

export function useLenis() {
  return useContext(LenisContext)
}

export function SmoothScroll({
  children,
  container = false,
}: {
  children: ReactNode
  container?: boolean
}) {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const wrapper = container ? wrapperRef.current : undefined
    const content = container ? contentRef.current : undefined
    if (container && (!wrapper || !content)) return

    const instance = new Lenis({
      ...(container ? { wrapper: wrapper!, content: content! } : {}),
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1,
      autoRaf: false,
    })

    setLenis(instance)

    const unsubscribe = subscribe((time) => {
      instance.raf(time)
    }, TICK_PRIORITY.SCROLL)

    const disposeGsap = registerGsapBridge(instance, wrapper)

    return () => {
      disposeGsap()
      unsubscribe()
      instance.destroy()
      setLenis(null)
    }
  }, [container])

  const tree = container ? (
    <div ref={wrapperRef} data-scroll-wrapper="">
      <div ref={contentRef} data-scroll-content="">
        {children}
      </div>
    </div>
  ) : (
    children
  )

  return <LenisContext.Provider value={lenis}>{tree}</LenisContext.Provider>
}
