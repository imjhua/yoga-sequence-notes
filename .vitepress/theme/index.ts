import DefaultTheme from 'vitepress/theme'
import CopyPrompt from './components/CopyPrompt.vue'
import Mindmap from './components/Mindmap.vue'
import MindmapAside from './components/MindmapAside.vue'
import LyricFlow from './components/LyricFlow.vue'
import LyricFlowSaved from './components/LyricFlowSaved.vue'
import LyricFlowStudio from './components/LyricFlowStudio.vue'
import SequenceList from './components/SequenceList.vue'
import Layout from './Layout.vue'
import './custom.css'
import { loadSidebarHiddenPref } from './sidebarHide'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('CopyPrompt', CopyPrompt)
    app.component('Mindmap', Mindmap)
    app.component('MindmapAside', MindmapAside)
    app.component('LyricFlow', LyricFlow)
    app.component('LyricFlowSaved', LyricFlowSaved)
    app.component('LyricFlowStudio', LyricFlowStudio)
    app.component('SequenceList', SequenceList)

    if (typeof window !== 'undefined') {
      loadSidebarHiddenPref()
    }
  },
}
