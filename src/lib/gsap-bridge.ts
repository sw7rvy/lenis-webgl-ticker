import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'
import { subscribe, TICK_PRIORITY } from '@/lib/ticker'

gsap.registerPlugin(ScrollTrigger)

export function registerGsapBridge(lenis: Lenis, wrapper?: HTMLElement | null) {
  gsap.ticker.remove(gsap.updateRoot)
  gsap.ticker.lagSmoothing(0)

  if (wrapper) {
    ScrollTrigger.scrollerProxy(wrapper, {
      scrollTop(value) {
        if (arguments.length && typeof value === 'number') {
          lenis.scrollTo(value, { immediate: true, force: true, lock: true })
        }
        return lenis.scroll
      },
      pinType: 'transform',
    })
    ScrollTrigger.defaults({ scroller: wrapper })
  }

  const onScroll = () => ScrollTrigger.update()
  lenis.on('scroll', onScroll)

  const unsubscribe = subscribe((time) => {
    gsap.updateRoot(time / 1000)
  }, TICK_PRIORITY.ANIMATION)

  const onResize = () => ScrollTrigger.refresh()
  const observer = wrapper ? new ResizeObserver(onResize) : null
  observer?.observe(wrapper!)

  ScrollTrigger.refresh()

  return () => {
    observer?.disconnect()
    unsubscribe()
    lenis.off('scroll', onScroll)
    if (wrapper) {
      ScrollTrigger.defaults({ scroller: undefined })
      ScrollTrigger.scrollerProxy(wrapper, null as never)
    }
    gsap.ticker.lagSmoothing(500, 33)
    gsap.ticker.add(gsap.updateRoot)
  }
}
