<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { UserSettingsModel } from '~/types/settings'
import IPhoneWelcomeIntro from '~/components/intro/IPhoneWelcomeIntro.client.vue'
import { useWelcomeIntro } from '~/composables/useWelcomeIntro'

const { checkAndInit } = useWelcomeIntro()

const isMobileMenuOpen = ref(false)
const activeSection = ref('#about')
const isScrolled = ref(false)
const commandPaletteRef = ref<any>(null)
const aiAssistantRef = ref<any>(null)
const isMac = ref(true)
const route = useRoute()
const { isApkStoreEnabled } = useFeatureFlag()

const { data: dataUser } = await useFetch<BaseResponse<UserSettingsModel>>('/api/settings', {
  watch: false,
})
const user = computed(() => dataUser.value?.data)

const navItems = [
  { name: 'About', href: '#about' },
  { name: 'Music', href: '#music' },
  { name: 'Projects', href: '#projects' },
  { name: 'Stack', href: '#stack' },
  { name: 'Experience', href: '#experience' },
  { name: 'Contact', href: '#contact' }
]

const sectionOrder = [
  { id: 'about', href: '#about' },
  { id: 'music', href: '#music' },
  { id: 'projects', href: '#projects' },
  { id: 'stack', href: '#stack' },
  { id: 'experience', href: '#experience' },
  { id: 'contact', href: '#contact' }
]

let rafId: number | null = null

const getNavLink = (hash: string) => {
  return route.path === '/' ? hash : `/${hash}`
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const scrollToSection = (hash: string) => {
  activeSection.value = hash
  closeMobileMenu()
  if (route.path !== '/') {
    navigateTo(`/${hash}`)
    return
  }
  const id = hash.replace('#', '')
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const updateActiveSection = () => {
  if (route.path !== '/') {
    activeSection.value = ''
    return
  }
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    isScrolled.value = window.scrollY > 20

    if (window.scrollY < 200) {
      activeSection.value = '#about'
      rafId = null
      return
    }

    const scrollBottom = window.innerHeight + window.scrollY
    const docHeight = document.documentElement.scrollHeight
    if (docHeight - scrollBottom < 100) {
      activeSection.value = '#contact'
      rafId = null
      return
    }

    const focalY = window.innerHeight * 0.35
    for (const sec of sectionOrder) {
      const el = document.getElementById(sec.id)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (rect.top <= focalY && rect.bottom > focalY) {
        activeSection.value = sec.href
        break
      }
    }
    rafId = null
  })
}

onMounted(() => {
  if (typeof navigator !== 'undefined') {
    isMac.value = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform || '')
  }
  window.addEventListener('scroll', updateActiveSection, { passive: true })
  if (window.location.hash) {
    activeSection.value = window.location.hash
  }
  updateActiveSection()
  checkAndInit()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSection)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-[#f4f4f5] relative overflow-x-hidden selection:bg-white selection:text-black font-sans">
    
    <!-- Ambient Background Lighting -->
    <div class="fixed inset-0 pointer-events-none z-0 ambient-canvas">
      <div class="absolute inset-0 subtle-grid opacity-30"></div>
    </div>

    <!-- Floating Minimalist Navbar -->
    <header class="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 py-3 sm:py-4 pointer-events-none">
      <div class="max-w-5xl mx-auto flex items-center justify-between pointer-events-auto">
        
        <!-- Brand / Monogram -->
        <NuxtLink
          to="/"
          class="flex items-center gap-2 group px-3 py-1.5 rounded-full bg-[#141417]/80 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all cursor-pointer"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span class="font-bold text-sm tracking-tight text-white font-heading">Eka<span class="text-zinc-500">.</span></span>
        </NuxtLink>

        <!-- Center Nav Links (Desktop) -->
        <nav class="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#141417]/80 border border-white/10 backdrop-blur-xl shadow-lg">
          <button
            v-for="item in navItems"
            :key="item.href"
            @click="scrollToSection(item.href)"
            class="px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer"
            :class="activeSection === item.href
              ? 'bg-white text-black font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'"
          >
            {{ item.name }}
          </button>
        </nav>

        <!-- Right Quick Actions -->
        <div class="flex items-center gap-2">
          <!-- Command Palette Trigger -->
          <button
            @click="commandPaletteRef?.open()"
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141417]/80 border border-white/10 hover:border-white/20 backdrop-blur-xl text-xs font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Search Commands"
          >
            <Icon name="carbon:search" size="13" class="text-zinc-400" />
            <span class="text-[11px]">Search</span>
            <kbd class="text-[9px] bg-white/10 px-1 py-0.2 rounded border border-white/10 text-zinc-300">{{ isMac ? '⌘K' : 'Ctrl K' }}</kbd>
          </button>

          <!-- APK Store Link (if enabled) -->
          <NuxtLink
            v-if="isApkStoreEnabled"
            to="/apps"
            class="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer"
            :class="route.path === '/apps'
              ? 'bg-white text-black font-semibold shadow-sm border-white'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white'"
          >
            <Icon name="carbon:application-mobile" size="14" />
            <span>Apps</span>
          </NuxtLink>

          <!-- Console Link -->
          <NuxtLink
            to="/dashboard"
            class="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Open Console"
          >
            <Icon name="carbon:terminal" size="13" />
            <span>Console</span>
          </NuxtLink>

          <!-- Get in Touch CTA -->
          <button
            @click="scrollToSection('#contact')"
            class="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs tracking-wide shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span>Let's Talk</span>
            <Icon name="carbon:arrow-up-right" size="12" />
          </button>

          <!-- Mobile Menu Toggle Button -->
          <button
            @click="toggleMobileMenu"
            class="lg:hidden p-2 rounded-full bg-[#141417]/90 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Icon :name="isMobileMenuOpen ? 'carbon:close' : 'carbon:menu'" size="18" />
          </button>
        </div>

      </div>
    </header>

    <!-- Mobile Navigation Drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        class="fixed top-16 inset-x-4 sm:inset-x-6 sm:max-w-sm sm:ml-auto z-40 p-4 rounded-2xl bg-[#141417] border border-white/10 shadow-2xl backdrop-blur-2xl lg:hidden space-y-2"
      >
        <button
          v-for="item in navItems"
          :key="item.href"
          @click="scrollToSection(item.href)"
          class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          :class="activeSection === item.href ? 'bg-white text-black font-semibold' : 'text-zinc-300 hover:bg-white/5'"
        >
          {{ item.name }}
        </button>

        <NuxtLink
          to="/dashboard"
          @click="closeMobileMenu"
          class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-zinc-300 hover:text-white bg-white/5 border border-white/5"
        >
          <div class="flex items-center gap-2">
            <Icon name="carbon:terminal" size="16" />
            <span>Console</span>
          </div>
          <Icon name="carbon:arrow-up-right" size="14" class="opacity-60" />
        </NuxtLink>

        <NuxtLink
          v-if="isApkStoreEnabled"
          to="/apps"
          @click="closeMobileMenu"
          class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          :class="route.path === '/apps' ? 'bg-white text-black font-semibold' : 'text-zinc-300 hover:text-white bg-white/5 border border-white/5'"
        >
          <div class="flex items-center gap-2">
            <Icon name="carbon:application-mobile" size="16" />
            <span>Apps Store</span>
          </div>
          <Icon name="carbon:arrow-up-right" size="14" class="opacity-60" />
        </NuxtLink>

        <div class="pt-2 border-t border-white/10 flex flex-col gap-2">
          <button
            @click="commandPaletteRef?.open(); closeMobileMenu()"
            class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-zinc-300 bg-white/5 border border-white/5 cursor-pointer"
          >
            <span>Search</span>
            <kbd class="text-[10px] font-mono text-zinc-400">⌘K</kbd>
          </button>
          <button
            @click="scrollToSection('#contact')"
            class="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm text-center cursor-pointer"
          >
            Let's Talk
          </button>
        </div>
      </div>
    </Transition>

    <!-- Main Content Viewport -->
    <main class="relative z-10 pt-20 sm:pt-28 pb-16">
      <slot></slot>
    </main>

    <!-- Developer Command Palette (⌘K) -->
    <CommandPalette
      ref="commandPaletteRef"
      :userEmail="user?.email"
      :cvUrl="user?.cv_url"
      :githubUrl="user?.github_profile"
      :linkedinUrl="user?.linkedin_profile"
      @open-ai="aiAssistantRef?.open()"
    />

    <!-- AI Copilot Assistant -->
    <AIAssistant ref="aiAssistantRef" />

    <!-- iPhone First-Visit Welcome Intro Animation (Apple OOBE Style) -->
    <ClientOnly>
      <IPhoneWelcomeIntro />
    </ClientOnly>

  </div>
</template>