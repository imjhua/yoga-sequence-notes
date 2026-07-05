const STORAGE_KEY = 'vp-sidebar-hidden'

export function isSidebarHidden(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('sidebar-hidden')
}

export function setSidebarHidden(hidden: boolean): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('sidebar-hidden', hidden)
  localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0')
}

export function loadSidebarHiddenPref(): boolean {
  if (typeof localStorage === 'undefined') return false
  const hidden = localStorage.getItem(STORAGE_KEY) === '1'
  setSidebarHidden(hidden)
  return hidden
}

export function toggleSidebarHidden(): boolean {
  const next = !isSidebarHidden()
  setSidebarHidden(next)
  return next
}
