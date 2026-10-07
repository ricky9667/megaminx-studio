import { expect, test } from 'bun:test'
import { initialTheme } from './theme'

test('saved theme takes priority; missing, invalid, or unavailable storage uses the system theme', () => {
  for (const systemDark of [false, true]) {
    for (const saved of ['light', 'dark', null, 'invalid']) {
      expect(initialTheme({ getItem: () => saved }, systemDark)).toBe(
        saved === 'light' || saved === 'dark' ? saved : systemDark ? 'dark' : 'light'
      )
    }
    expect(initialTheme({ getItem: () => { throw new Error('Storage blocked') } }, systemDark)).toBe(systemDark ? 'dark' : 'light')
  }
})
