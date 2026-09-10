'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef } from 'react'
import { useLenis } from '@/components/SmoothScroll'
import { scrollState } from '@/lib/scroll-state'

export default function Page() {
  const lenis = useLenis()
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!lenis) return

    const ctx = gsap.context((self) => {
      const q = self.selector!

      gsap.to(q('.hero-inner'), {
        scale: 0.85,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: q('.hero')[0],
          start: 'top top',
          end: 'bottom top',
          pin: true,
          pinSpacing: false,
          scrub: true,
          anticipatePin: 1,
        },
      })

      const track = q('.rail-track')[0] as HTMLElement
      gsap.to(track, {
        x: () => -(track.scrollWidth - track.parentElement!.clientWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: q('.rail')[0],
          start: 'top top',
          end: () => `+=${track.scrollWidth}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (st) => {
            scrollState.railProgress = st.progress
            scrollState.railVelocity = st.getVelocity()
          },
        },
      })

      const cards = q('.card') as HTMLElement[]
      cards.forEach((card, i) => {
        gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top top',
            end: '+=100%',
            pin: true,
            pinSpacing: i === cards.length - 1,
            scrub: true,
            anticipatePin: 1,
          },
        }).to(card, { scale: 0.9, filter: 'brightness(0.5)', ease: 'none' })
      })

      ScrollTrigger.create({
        trigger: q('.rail')[0],
        start: 'top top',
        end: 'max',
        onUpdate: (st) => {
          gsap.set(q('.progress-bar'), { scaleX: st.progress })
        },
      })
    }, root)

    ScrollTrigger.refresh()

    return () => ctx.revert()
  }, [lenis])

  return (
    <div ref={root}>
      <div className="progress">
        <div className="progress-bar" />
      </div>

      <section className="hero">
        <div className="hero-inner">
          <h1>Wrapper Mode</h1>
          <p>Lenis drives a fixed scroll container. ScrollTrigger pins against it.</p>
        </div>
      </section>

      <section className="rail">
        <div className="rail-track">
          {['Ticker', 'Lenis', 'ScrollTrigger', 'WebGL'].map((label, i) => (
            <article key={label} className="panel">
              <span className="panel-index">0{i + 1}</span>
              <h2>{label}</h2>
            </article>
          ))}
        </div>
      </section>

      <section className="stack">
        {['One frame', 'One order', 'No tearing'].map((label) => (
          <div key={label} className="card">
            <h2>{label}</h2>
          </div>
        ))}
      </section>

      <section className="outro">
        <h2>End of scope</h2>
      </section>
    </div>
  )
}
