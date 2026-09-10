import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { chromium } from 'playwright-core'

const URL = process.env.SCREENSHOT_URL ?? 'http://localhost:3210'
const OUT = process.env.SCREENSHOT_OUT ?? 'docs/preview.png'
const SCROLL = Number(process.env.SCREENSHOT_SCROLL ?? 1800)
const WIDTH = Number(process.env.SCREENSHOT_WIDTH ?? 1440)
const HEIGHT = Number(process.env.SCREENSHOT_HEIGHT ?? 900)

const CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
].filter(Boolean)

const executablePath = CANDIDATES.find((p) => existsSync(p))

if (!executablePath) {
  console.error(
    'No Chromium-based browser found. Set BROWSER_PATH to a Chrome or Edge binary.'
  )
  process.exit(1)
}

const reachable = await fetch(URL)
  .then((r) => r.ok)
  .catch(() => false)

if (!reachable) {
  console.error(`${URL} is not responding. Start the dev server first: npm run dev`)
  process.exit(1)
}

await mkdir(dirname(OUT), { recursive: true })

const browser = await chromium.launch({
  executablePath,
  args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'],
})

const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2,
})

await page.goto(URL, { waitUntil: 'networkidle' })

// Next's dev indicator would otherwise sit in the corner of the shot.
await page.addStyleTag({ content: 'nextjs-portal { display: none !important }' })

await page.waitForSelector('[data-scroll-wrapper]')
await page.waitForFunction(() => document.querySelectorAll('.pin-spacer').length >= 5)
await page.waitForTimeout(600)

// Write the scroll position and let Lenis adopt it, the same path a native
// scroll takes. ScrollTrigger then updates from Lenis's own scroll event.
await page.evaluate((y) => {
  const wrapper = document.querySelector('[data-scroll-wrapper]')
  wrapper.scrollTop = y
  wrapper.dispatchEvent(new Event('scroll'))
}, SCROLL)

await page.waitForTimeout(1500)

const state = await page.evaluate(() => {
  const wrapper = document.querySelector('[data-scroll-wrapper]')
  const track = document.querySelector('.rail-track')
  return {
    scrollTop: Math.round(wrapper.scrollTop),
    railTop: Math.round(document.querySelector('.rail').getBoundingClientRect().top),
    track: getComputedStyle(track).transform,
  }
})

await page.screenshot({ path: OUT })
await browser.close()

console.log(`${OUT} ${JSON.stringify(state)}`)
