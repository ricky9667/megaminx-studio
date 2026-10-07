import geometry from './geometry.json'

export const backing = geometry[0]
export const stickers = geometry.slice(1)
export const ids = stickers.map(sticker => sticker.id)
export const neutral = '#717071'
export const storageKey = 'megaminx-studio-v1'
export type Colors = Record<string, string>
export const isColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
export const blankColors = (): Colors => Object.fromEntries(ids.map(id => [id, neutral]))

export function restoreColors(raw: string | null): Colors {
  const colors = blankColors()
  try {
    const saved: unknown = JSON.parse(raw ?? 'null')
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const id of ids) {
        const color = (saved as Colors)[id]
        if (isColor(color)) colors[id] = color
      }
    }
  } catch { /* An invalid saved draft starts with blank stickers. */ }
  return colors
}

export function paint(colors: Colors, id: string, color: string): Colors {
  if (!ids.includes(id) || !isColor(color) || colors[id] === color) return colors
  return { ...colors, [id]: color }
}

export function exportSvg(colors: Colors): string {
  const polygons = geometry.map(({ id, points }) => {
    const fill = id === 'lines' ? '#1D110E' : isColor(colors[id]) ? colors[id] : neutral
    return `  <polygon id="${id}" fill="${fill}" points="${points}"/>`
  }).join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1225 913" width="1225" height="913">\n  <title>Megaminx</title>\n${polygons}\n</svg>\n`
}

export function exportPng(colors: Colors): string {
  const canvas = document.createElement('canvas')
  canvas.width = 1225
  canvas.height = 913
  const context = canvas.getContext('2d')
  if (!context) throw new Error('PNG export requires canvas support.')
  for (const { id, points } of geometry) {
    context.fillStyle = id === 'lines' ? '#1D110E' : isColor(colors[id]) ? colors[id] : neutral
    context.fill(new Path2D(`M${points}Z`))
  }
  return canvas.toDataURL('image/png')
}

export const palette = [
  ['White', '#FFFFFF'], ['Yellow', '#FFD500'], ['Red', '#E53935'],
  ['Orange', '#FF8A00'], ['Dark green', '#2EAD4B'], ['Light green', '#A8DF65'],
  ['Dark blue', '#2454D6'], ['Light blue', '#00D5E8'], ['Purple', '#8E44C8'],
  ['Pink', '#FF85B4'], ['Beige', '#F2D5A3'], ['Gray', '#B3B7BF'],
] as const
