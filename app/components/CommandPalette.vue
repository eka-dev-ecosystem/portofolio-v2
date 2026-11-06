<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useWelcomeIntro } from '~/composables/useWelcomeIntro'

const { triggerReplay } = useWelcomeIntro()

const isOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)

const props = defineProps<{
  userEmail?: string
  cvUrl?: string
  githubUrl?: string
  linkedinUrl?: string
}>()

const emit = defineEmits<{
  (e: 'open-ai'): void
}>()

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  category: 'Navigation' | 'Quick Actions' | 'Connect'
  icon: string
  action: () => void
}

const copyEmail = () => {
  navigator.clipboard.writeText(props.userEmail || 'contact@eka-dev.cloud')
  alert('Email address copied to clipboard!')
}

const router = useRouter()

const navigateToSection = (target: string) => {
  isOpen.value = false
  if (target.startsWith('/')) {
    router.push(target)
    return
  }
  const el = document.querySelector(target)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const commands: CommandItem[] = [
  // Navigation
  { id: 'nav-about', title: 'About Me', subtitle: 'Background & core focus', category: 'Navigation', icon: 'carbon:user', action: () => navigateToSection('#about') },
  { id: 'nav-music', title: 'Apple Music', subtitle: 'Now playing track & daily coding soundtracks', category: 'Navigation', icon: 'carbon:music', action: () => navigateToSection('#music') },
  { id: 'nav-projects', title: 'Featured Projects', subtitle: 'Production software and cloud systems', category: 'Navigation', icon: 'carbon:application-web', action: () => navigateToSection('#projects') },
  { id: 'nav-stack', title: 'Technical Stack', subtitle: 'Technologies, languages, and tools', category: 'Navigation', icon: 'carbon:code', action: () => navigateToSection('#stack') },
  { id: 'nav-experience', title: 'Work Experience', subtitle: 'Career milestones and engineering impact', category: 'Navigation', icon: 'carbon:milestone', action: () => navigateToSection('#experience') },
  { id: 'nav-contact', title: 'Get in Touch', subtitle: 'Inquiries, opportunities, and contact form', category: 'Navigation', icon: 'carbon:email', action: () => navigateToSection('#contact') },

  // Quick Actions
  { id: 'act-replay-intro', title: 'Replay Welcome Intro', subtitle: 'Experience the Apple iPhone style Exa handwriting animation', category: 'Quick Actions', icon: 'carbon:play', action: () => { isOpen.value = false; triggerReplay() } },
  { id: 'act-tech-radar', title: 'Daily Tech Radar', subtitle: 'Curated tech updates & AI daily briefing', category: 'Quick Actions', icon: 'carbon:radar', action: () => { isOpen.value = false; router.push('/dashboard/tech-radar') } },
  { id: 'act-resume', title: 'Download Resume / CV', subtitle: 'PDF format', category: 'Quick Actions', icon: 'carbon:document-download', action: () => { if (props.cvUrl) window.open(props.cvUrl, '_blank') } },
  { id: 'act-copy-email', title: 'Copy Email Address', subtitle: props.userEmail || 'contact@eka-dev.cloud', category: 'Quick Actions', icon: 'carbon:copy', action: copyEmail },
  { id: 'act-ai', title: 'Ask Portfolio AI Copilot', subtitle: 'Interactive Gemini assistant', category: 'Quick Actions', icon: 'carbon:bot', action: () => { isOpen.value = false; emit('open-ai') } },

  // Connect
  { id: 'conn-github', title: 'GitHub Profile', subtitle: 'View open-source repositories', category: 'Connect', icon: 'line-md:github', action: () => window.open(props.githubUrl || 'https://github.com', '_blank') },
  { id: 'conn-linkedin', title: 'LinkedIn Profile', subtitle: 'Connect professionally', category: 'Connect', icon: 'jam:linkedin', action: () => window.open(props.linkedinUrl || 'https://linkedin.com', '_blank') }
]

const filteredCommands = computed(() => {
  if (!searchQuery.value.trim()) return commands
  const q = searchQuery.value.toLowerCase()
  return commands.filter(c => c.title.toLowerCase().includes(q) || c.subtitle?.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
})

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    isOpen.value = !isOpen.value
  }

  if (!isOpen.value) return

  if (e.key === 'Escape') {
    isOpen.value = false
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % filteredCommands.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = filteredCommands.value[selectedIndex.value]
    if (item) {
      item.action()
      isOpen.value = false
    }
  }
}

watch(isOpen, (val) => {
  if (val) {
    searchQuery.value = ''
    selectedIndex.value = 0
    setTimeout(() => {
      searchInput.value?.focus()
    }, 50)
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  open: () => { isOpen.value = true }
})
</script>

<template>
  <div>
    <!-- Backdrop & Modal Container -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 sm:pt-28 px-4"
        @click.self="isOpen = false"
      >
        <!-- Command Dialog -->
        <div class="w-full max-w-xl bg-[#141417] border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-black/80">
          
          <!-- Search Header -->
          <div class="relative flex items-center px-4 py-3.5 border-b border-white/10 bg-[#0f0f12]">
            <Icon name="carbon:search" size="18" class="text-zinc-400 shrink-0 mr-3" />
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Type a command, jump to section, or open links..."
              class="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-400 border border-white/10 shrink-0">
              ESC
            </span>
          </div>

          <!-- Command Items List -->
          <div class="max-h-[360px] overflow-y-auto p-2 space-y-1">
            <div
              v-for="(item, index) in filteredCommands"
              :key="item.id"
              @click="item.action(); isOpen = false"
              @mouseenter="selectedIndex = index"
              class="px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
              :class="selectedIndex === index ? 'bg-white/10 text-white border border-white/15' : 'text-zinc-300 hover:bg-white/[0.04] border border-transparent'"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div 
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                  :class="selectedIndex === index ? 'bg-white/15 border-white/20 text-white' : 'bg-white/[0.03] border-white/[0.06] text-zinc-400'"
                >
                  <Icon :name="item.icon" size="16" />
                </div>

                <div class="min-w-0">
                  <p class="text-xs sm:text-sm font-medium truncate">{{ item.title }}</p>
                  <p v-if="item.subtitle" class="text-[11px] text-zinc-400 truncate">{{ item.subtitle }}</p>
                </div>
              </div>

              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5 shrink-0">
                {{ item.category }}
              </span>
            </div>

            <!-- Empty State -->
            <div v-if="filteredCommands.length === 0" class="py-10 text-center text-zinc-500">
              <Icon name="carbon:search-locate" size="28" class="mx-auto mb-2 text-zinc-600" />
              <p class="text-xs">No matching commands found for "{{ searchQuery }}"</p>
            </div>
          </div>

          <!-- Dialog Footer Help Bar -->
          <div class="px-4 py-2.5 bg-[#0f0f12] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <div class="flex items-center gap-3">
              <span><kbd class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">↑</kbd> <kbd class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">↓</kbd> Navigate</span>
              <span><kbd class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">↵</kbd> Select</span>
            </div>
            <span>Developer Navigation</span>
          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>
