// Lightweight client-side Mermaid renderer using CDN (no build deps required)
;(function () {
  if (typeof window === 'undefined') return

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.async = true
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }

  async function initMermaid() {
    if (window.mermaid) return
    try {
      await loadScript('https://unpkg.com/mermaid@10.4.0/dist/mermaid.min.js')
      window.mermaid.initialize({ startOnLoad: false })
      renderAll()
    } catch (e) {
      // fail silently
      // console.warn('Mermaid load failed', e)
    }
  }

  function renderAll() {
    const codes = Array.from(document.querySelectorAll('pre code.language-mermaid'))
    codes.forEach((code, idx) => {
      const text = code.textContent || ''
      const wrapper = document.createElement('div')
      wrapper.className = 'mermaid'
      wrapper.dataset.mermaidId = `mmd-${idx}`
      wrapper.textContent = text
      const pre = code.parentElement
      if (pre && pre.parentElement) {
        pre.parentElement.replaceChild(wrapper, pre)
        try {
          // mermaid will automatically detect and render elements with class 'mermaid'
          window.mermaid.init(undefined, wrapper)
        } catch (err) {
          // ignore render errors
        }
      }
    })
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initMermaid()
  } else {
    window.addEventListener('DOMContentLoaded', initMermaid)
  }
})()
