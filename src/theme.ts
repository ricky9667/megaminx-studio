export function initialTheme(storage: Pick<Storage, 'getItem'>, systemDark: boolean): 'light' | 'dark' {
  try {
    const saved = storage.getItem('megaminx-studio-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Use the system theme when browser storage is unavailable. */ }
  return systemDark ? 'dark' : 'light'
}
