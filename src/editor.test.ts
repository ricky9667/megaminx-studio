import { expect, test } from 'bun:test'
import { blankColors, exportSvg, ids, neutral, paint, restoreColors, stickers } from './editor'

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
