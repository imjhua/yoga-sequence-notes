import DefaultTheme from 'vitepress/theme'
import CopyPrompt from './components/CopyPrompt.vue'
import Mindmap from './components/Mindmap.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CopyPrompt', CopyPrompt)
    app.component('Mindmap', Mindmap)
  },
}
