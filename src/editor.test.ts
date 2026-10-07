import { expect, test } from 'bun:test'
import { backing, blankColors, exportPng, exportSvg, ids, neutral, paint, restoreColors, stickers } from './editor'

test('batch coloring changes only selected stickers and preserves no-op snapshots', () => {
  const blank = blankColors()
  const selection = ['FC', 'U1', 'unknown', 'FC']
  const colored = paint(blank, selection, '#00D5E8')
  expect(colored).toEqual({ ...blank, FC: '#00D5E8', U1: '#00D5E8' })
  expect(blank).toEqual(blankColors())
  expect(selection).toEqual(['FC', 'U1', 'unknown', 'FC'])
  expect(paint(colored, ['FC', 'U1'], '#00D5E8')).toBe(colored)
  expect(paint(colored, [], '#ffffff')).toBe(colored)
  expect(paint(colored, selection, 'invalid')).toBe(colored)
})

test('all 66 labels map to geometry; colors restore safely and export without editor decoration', () => {
  expect(ids.length).toBe(66)
  expect(new Set(ids).size).toBe(66)
  expect(stickers.every(sticker => sticker.x && sticker.y)).toBe(true)
  const blank = blankColors()
  const colored = paint(blank, 'FC', '#00D5E8')
  expect(blank.FC).toBe(neutral)
  expect(colored.FC).toBe('#00D5E8')
  expect(paint(colored, 'unknown', '#ffffff')).toBe(colored)
  expect(paint(colored, 'FC', 'url(https://example.com)')).toBe(colored)
  expect(restoreColors(JSON.stringify(colored))).toEqual(colored)
  expect(restoreColors('invalid')).toEqual(blank)
  expect(restoreColors('{"FC":"<script>","U1":"#FF8A00","unknown":"#ffffff"}')).toEqual({ ...blank, U1: '#FF8A00' })
  const svg = exportSvg(colored)
  expect(svg).toContain('id="FC" fill="#00D5E8"')
  expect(svg).toContain('width="1225" height="913"')
  expect(svg.match(/<polygon /g)?.length).toBe(67)
  expect(svg).not.toMatch(/<text|<rect|aria-|tabindex|class=|metadata|onClick/)
  expect(exportSvg({ FC: '<script>' })).not.toContain('<script>')
})

test('PNG export draws the backing and colored stickers on a transparent 1225 × 913 canvas', () => {
  const originals = { document: globalThis.document, Path2D: globalThis.Path2D }
  const drawn: { path: string, color: string }[] = []
  const context = {
    fillStyle: '',
    fill(path: { data: string }) { drawn.push({ path: path.data, color: this.fillStyle }) },
  }
  const canvas = {
    width: 0, height: 0,
    getContext(type: string) { expect(type).toBe('2d'); return context },
    toDataURL(type: string) { expect(type).toBe('image/png'); return 'data:image/png;base64,png' },
  }
  Object.assign(globalThis, {
    document: { createElement(tag: string) { expect(tag).toBe('canvas'); return canvas } },
    Path2D: class { constructor(public data: string) {} },
  })
  try {
    const colors = paint(blankColors(), 'FC', '#00D5E8')
    expect(exportPng(colors)).toBe('data:image/png;base64,png')
    expect([canvas.width, canvas.height]).toEqual([1225, 913])
    expect(drawn).toEqual([backing, ...stickers].map(({ id, points }) => ({
      path: `M${points}Z`, color: id === 'lines' ? '#1D110E' : colors[id],
    })))
  } finally {
    Object.assign(globalThis, originals)
  }
})
