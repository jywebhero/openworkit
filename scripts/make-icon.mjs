import { _electron as electron } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const source = path.join(root, 'src/renderer/src/components/logo.svg')
const target = path.join(root, 'src/main/app-icon.png')
const size = 512

const svg = readFileSync(source, 'utf8')
const app = await electron.launch({
  timeout: 30_000,
  env: {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key !== 'ELECTRON_RUN_AS_NODE')
    )
  }
})
const page = await app.firstWindow()
await page.goto('about:blank')

const dataUrl = await page.evaluate(
  async ({ markup, px }) => {
    const image = new Image()
    image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(markup)))}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = px
    canvas.height = px
    canvas.getContext('2d').drawImage(image, 0, 0, px, px)
    return canvas.toDataURL('image/png')
  },
  { markup: svg, px: size }
)

writeFileSync(target, Buffer.from(dataUrl.split(',')[1], 'base64'))
console.log('wrote', path.relative(root, target), `${size}x${size}`)

await app.close()
