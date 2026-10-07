import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Check, ChevronDown, Download, Github, Moon, Pentagon, RotateCcw, Sun, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { backing, blankColors, exportSvg, ids, neutral, paint, palette, restoreColors, stickers, storageKey, type Colors } from './editor'
import './index.css'
import { initialTheme } from './theme'

function App() {
  const [theme, setTheme] = useState(() => initialTheme({ getItem: key => localStorage.getItem(key) }, window.matchMedia('(prefers-color-scheme: dark)').matches))
  const themeLabel = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111827' : '#f7f8fa')
  }, [theme])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem('megaminx-studio-theme', next) }
    catch { /* The toggle still works when browser storage is unavailable. */ }
  }

  const [history, setHistory] = useState<Colors[]>(() => {
    try { return [restoreColors(localStorage.getItem(storageKey))] }
    catch { return [blankColors()] }
  })
  const colors = history[history.length - 1]
  const [selected, setSelected] = useState('FC')
  const [query, setQuery] = useState('FC')
  const [showLabels, setShowLabels] = useState(false)
  const [storageFailed, setStorageFailed] = useState(false)
  const [custom, setCustom] = useState('#2563eb')
  const labelInput = useRef<HTMLInputElement>(null)
  const coloredCount = ids.filter(id => colors[id] !== neutral).length

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(colors)); setStorageFailed(false) }
    catch { setStorageFailed(true) }
  }, [colors])

  function select(id: string, focus = false) {
    setSelected(id)
    setQuery(id)
    if (focus) labelInput.current?.focus({ preventScroll: true })
  }

  function commit(next: Colors) {
    if (ids.every(id => next[id] === colors[id])) return
    // ponytail: retain 100 undo steps; add deeper history if longer sessions need it.
    setHistory(previous => [...previous.slice(-100), next])
  }

  function download() {
    const url = URL.createObjectURL(new Blob([exportSvg(colors)], { type: 'image/svg+xml' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'megaminx.svg'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b bg-surface px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white"><Pentagon size={23} strokeWidth={1.8}/></div>
          <div><h1 className="text-lg font-semibold tracking-tight">Megaminx Studio</h1><p className="text-xs text-muted-foreground">SVG editor</p></div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel} aria-pressed={theme === 'dark'} className="rounded-lg">
            {theme === 'dark' ? <Sun size={20} aria-hidden="true"/> : <Moon size={20} aria-hidden="true"/>}
          </Button>
          <Button variant="ghost" size="icon" asChild className="rounded-lg">
            <a href="https://github.com/ricky9667/megaminx-studio" target="_blank" rel="noreferrer" aria-label="GitHub repository" title="GitHub"><Github size={20} aria-hidden="true"/></a>
          </Button>
          <Button onClick={download} aria-label="Export SVG" title="Export SVG" className="gap-2 rounded-lg shadow-sm"><Download size={16} aria-hidden="true"/><span className="hidden sm:inline">Export SVG</span></Button>
        </div>
      </header>

      <main className="workspace grid min-h-[calc(100svh-5rem)] lg:grid-cols-[320px_1fr]">
        <aside className="order-2 flex flex-col border-t bg-surface lg:order-1 lg:border-t-0 lg:border-r" aria-label="Sticker controls">
          <div className="w-full max-w-xl self-center space-y-7 p-6 lg:max-w-none">
            <section>
              <p className="section-title">Selected sticker</p>
              <div className="mt-3 flex items-center gap-3 rounded-xl border bg-background p-3">
                <span className="size-11 shrink-0 rounded-lg border shadow-sm" style={{ backgroundColor: colors[selected] }} aria-hidden="true"/>
                <div><p className="font-mono text-xl font-semibold">{selected}</p><p className="text-xs text-muted-foreground">{selected.endsWith('C') ? 'Center' : Number(selected.match(/\d+$/)?.[0]) % 2 ? 'Corner' : 'Edge'} sticker</p></div>
              </div>
              <label className="mt-4 mb-2 block text-xs font-medium text-muted-foreground" htmlFor="sticker-label">Find a label</label>
              <div className="relative">
                <input ref={labelInput} id="sticker-label" list="sticker-labels" autoComplete="off" spellCheck={false} value={query}
                  onFocus={event => event.currentTarget.select()}
                  onChange={event => { const value = event.target.value.toUpperCase(); setQuery(value); if (ids.includes(value)) setSelected(value) }}
                  onBlur={() => setQuery(selected)}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === 'Escape') { setQuery(selected); event.currentTarget.blur() } }}
                  className="h-10 w-full rounded-lg border bg-surface px-3 pr-8 font-mono text-sm"/>
                <ChevronDown className="pointer-events-none absolute top-3 right-3 size-4 text-muted-foreground"/>
                <datalist id="sticker-labels">{ids.map(id => <option key={id} value={id}/>)}</datalist>
              </div>
            </section>

            <section className="border-t pt-6">
              <p className="section-title">Sticker color</p>
              <p className="mt-1 text-xs text-muted-foreground">Choose a color to apply to {selected}.</p>
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-4">
                {palette.map(([name, color]) => (
                  <button key={name} type="button" title={name} aria-label={`Apply ${name}`} aria-pressed={colors[selected].toLowerCase() === color.toLowerCase()}
                    onClick={() => commit(paint(colors, selected, color))} className="swatch flex aspect-square items-center justify-center rounded-xl border shadow-sm" style={{ backgroundColor: color }}>
                    {colors[selected].toLowerCase() === color.toLowerCase() && <Check size={23} className={['White', 'Yellow', 'Light green', 'Beige', 'Gray', 'Pink', 'Light blue'].includes(name) ? 'text-slate-900' : 'text-white'}/>}
                  </button>
                ))}
              </div>
              <Button variant="outline" className="mt-4 w-full justify-start gap-3 rounded-lg" onClick={() => commit(paint(colors, selected, neutral))} aria-pressed={colors[selected] === neutral}>
                <span className="size-5 rounded border" style={{ backgroundColor: neutral }}/><span>Unassigned gray</span>{colors[selected] === neutral && <Check className="ml-auto size-4"/>}
              </Button>
              <div className="mt-4 flex items-center gap-3 rounded-lg border px-3 py-2">
                <input id="custom-color" type="color" aria-label="Apply a custom color" value={custom} onChange={event => { setCustom(event.target.value); commit(paint(colors, selected, event.target.value)) }} className="size-8 cursor-pointer border-0 bg-transparent"/>
                <label htmlFor="custom-color" className="flex-1 text-sm">Custom color</label>
                <button type="button" title="Apply current custom color" onClick={() => commit(paint(colors, selected, custom))} className="rounded px-1 py-2 font-mono text-xs text-muted-foreground">{custom.toUpperCase()}</button>
              </div>
            </section>

            <section className="border-t pt-5">
              <label className="flex cursor-pointer items-center justify-between text-sm" htmlFor="show-labels">Show preview labels
                <input id="show-labels" type="checkbox" checked={showLabels} onChange={event => setShowLabels(event.target.checked)} className="size-4 accent-blue-600"/>
              </label>
              <p className="mt-2 text-xs text-muted-foreground">Labels are hidden in the exported SVG.</p>
            </section>
          </div>
          <div className="mt-auto w-full border-t p-6">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="gap-2 rounded-lg" disabled={history.length < 2} onClick={() => setHistory(previous => previous.slice(0, -1))}><Undo2 size={15}/>Undo</Button>
              <Button variant="ghost" className="gap-2 rounded-lg text-muted-foreground" disabled={!coloredCount} onClick={() => commit(blankColors())}><RotateCcw size={15}/>Reset</Button>
            </div>
            <p role="status" className={`mt-4 text-center text-xs ${storageFailed ? 'text-amber-700' : 'text-muted-foreground'}`}>{storageFailed ? 'Browser saving is unavailable. Export to keep your work.' : 'Saved automatically in this browser'}</p>
          </div>
        </aside>

        <section className="preview-panel order-1 flex min-w-0 flex-col p-5 sm:p-8 lg:order-2" aria-label="Megaminx preview">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary"/><h2 className="text-sm font-medium">Preview</h2></div>
            <span className="rounded-full border bg-surface px-3 py-1 text-xs text-muted-foreground">{coloredCount} / 66 colored</span>
          </div>
          <div className="canvas relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border bg-surface">
            <svg viewBox="0 0 1225 913" className="megaminx w-full max-w-[1050px]" role="group" aria-label="Megaminx. Select a sticker to change its color.">
              <polygon points={backing.points} fill="#1D110E"/>
              {stickers.map(sticker => (
                <polygon key={sticker.id} id={sticker.id} points={sticker.points} fill={colors[sticker.id]} role="button" tabIndex={0}
                  aria-label={`Select sticker ${sticker.id}`} aria-pressed={selected === sticker.id} className="sticker"
                  onClick={() => select(sticker.id, true)}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(sticker.id, true) } }}>
                  <title>{sticker.id}</title>
                </polygon>
              ))}
              <g pointerEvents="none" fill="none" strokeLinejoin="round">
                <polygon points={stickers.find(sticker => sticker.id === selected)?.points} stroke="white" strokeWidth="7"/>
                <polygon points={stickers.find(sticker => sticker.id === selected)?.points} stroke="#2563eb" strokeWidth="3"/>
              </g>
              {showLabels && <g pointerEvents="none" fontFamily="Arial" fontSize="17" fontWeight="bold" textAnchor="middle" fill="white" stroke="#1D110E" strokeWidth="3" paintOrder="stroke" aria-hidden="true">
                {stickers.map(sticker => <text key={sticker.id} x={sticker.x} y={sticker.y}>{sticker.id}</text>)}
              </g>}
            </svg>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>Click a sticker, then choose a color.</p><p>1225 × 913 · Transparent SVG</p>
          </div>
        </section>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>)
