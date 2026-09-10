import { SmoothScroll } from '@/components/SmoothScroll'
import { Scene } from '@/components/Scene'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Scene />
        <SmoothScroll container>{children}</SmoothScroll>
      </body>
    </html>
  )
}
