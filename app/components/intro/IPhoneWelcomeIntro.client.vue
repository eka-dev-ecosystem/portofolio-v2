<template>
  <Transition
    name="ios-unlock"
    @after-leave="onTransitionEnd"
  >
    <div
      v-if="isIntroActive"
      class="fixed inset-0 z-[99999] flex flex-col justify-between items-center bg-black/30 backdrop-blur-xl backdrop-saturate-150 text-white select-none overflow-hidden cursor-pointer font-sans"
      :class="{ 'ios-slide-up': isDismissing }"
      @click="handleUserDismiss"
      tabindex="0"
      aria-label="Welcome Introduction"
    >
      <!-- Top Minimal Apple Bar -->
      <header class="w-full flex items-center justify-end px-6 pt-6 sm:px-8 sm:pt-8 z-30">
        <!-- Sleek Apple Translucent Glass Skip Button -->
        <button
          type="button"
          @click.stop="handleSkip"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:bg-white/25 text-[12px] font-sans font-normal text-white/75 hover:text-white border border-white/15 transition-all cursor-pointer backdrop-blur-xl shadow-lg"
          title="Skip intro (Press Esc)"
        >
          <span>Skip</span>
          <kbd class="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 border border-white/15 font-mono">esc</kbd>
        </button>
      </header>

      <!-- Centerpiece: Authentic Apple Cursive Script Floating Over Blurred Portfolio Page -->
      <main class="w-full max-w-xl px-6 flex flex-col items-center justify-center my-auto z-20">
        <!-- SVG Vector Animation Component -->
        <ExaScriptSvg :phase="phase" :is-completed="isCompleted" />

        <!-- Apple Subtext Fade-in -->
        <div
          class="mt-6 text-center transition-all duration-700 ease-out"
          :class="isCompleted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'"
        >
          <h2 class="text-base sm:text-lg font-medium tracking-tight text-white/95 drop-shadow-md">
            Moh. Eka Syafrino
          </h2>
          <p class="text-xs sm:text-[13px] text-white/60 mt-1 font-normal tracking-normal drop-shadow-sm">
            Full Stack Engineer & Cloud Architect
          </p>
        </div>
      </main>

      <!-- Bottom: iOS Home Indicator Bar & Interaction Prompt -->
      <footer class="w-full pb-8 flex flex-col items-center gap-2.5 z-30 pointer-events-none">
        <p
          class="text-xs font-sans text-white/50 transition-all duration-500 tracking-normal flex items-center gap-1.5 drop-shadow-sm"
          :class="isCompleted ? 'opacity-90' : 'opacity-0 translate-y-1'"
        >
          <Icon name="carbon:chevron-up" size="14" class="animate-bounce text-white/80" />
          <span>Click anywhere to explore</span>
        </p>

        <!-- Iconic iPhone Home Indicator Bar -->
        <div class="w-36 h-1 rounded-full bg-white/50 animate-pulse shadow-glow" />
      </footer>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useWelcomeIntro } from '~/composables/useWelcomeIntro'
import ExaScriptSvg from '~/components/intro/ExaScriptSvg.vue'

const { isIntroActive, isDismissing, dismissIntro } = useWelcomeIntro()

const phase = ref<'hello' | 'exa'>('hello')
const isCompleted = ref(false)

let phaseTimer: any = null
let completeTimer: any = null
let autoDismissTimer: any = null

const startSequence = () => {
  phase.value = 'hello'
  isCompleted.value = false

  // Phase 1 -> 2: Switch to "Exa" cursive after "hello" completes its stroke
  phaseTimer = setTimeout(() => {
    phase.value = 'exa'
  }, 1400)

  // Phase 2 -> 3: Finish drawing Exa, fade in subtitle and specular glow
  completeTimer = setTimeout(() => {
    isCompleted.value = true
  }, 2700)

  // Phase 3 -> Unlock: Auto dismiss fallback after full experience has been admired
  autoDismissTimer = setTimeout(() => {
    dismissIntro()
  }, 6500)
}

const handleUserDismiss = () => {
  clearTimers()
  dismissIntro()
}

const handleSkip = () => {
  clearTimers()
  dismissIntro(true) // Instant dismissal
}

const clearTimers = () => {
  if (phaseTimer) clearTimeout(phaseTimer)
  if (completeTimer) clearTimeout(completeTimer)
  if (autoDismissTimer) clearTimeout(autoDismissTimer)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!isIntroActive.value) return
  if (e.key === 'Escape') {
    handleSkip()
  } else if (e.key === ' ' || e.key === 'Enter') {
    handleUserDismiss()
  }
}

onMounted(() => {
  startSequence()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  clearTimers()
  window.removeEventListener('keydown', handleKeydown)
})

const onTransitionEnd = () => {
  // Clean up if needed
}
</script>

<style scoped>
/* iOS Unlock Slide Up Animation Curve */
.ios-slide-up {
  transform: translateY(-100%);
  opacity: 0;
  transition:
    transform 0.65s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.shadow-glow {
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.5);
}

@media (prefers-reduced-motion: reduce) {
  .ios-slide-up {
    transform: none !important;
    opacity: 0 !important;
    transition: opacity 0.3s ease !important;
  }
}
</style>
