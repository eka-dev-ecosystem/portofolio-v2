<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

definePageMeta({
  layout: false,
})

useHead({
  title: 'Sign In | Eka Console',
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
    {
      name: 'googlebot',
      content: 'noindex, nofollow',
    },
    {
      name: 'description',
      content: 'Authenticate to access developer console, daily tech radar, and portfolio management.',
    },
  ],
  script: [
    {
      src: 'https://accounts.google.com/gsi/client',
      async: true,
      defer: true,
    },
    {
      src: 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
      async: true,
      defer: true,
    },
  ],
})

// State
const isLoading = ref(false)
const localError = ref<string | null>(null)
const isResumingSession = ref(false)
const router = useRouter()

const { initGoogleSignIn, signInError } = useGoogleSignIn()
const { signInWithApple, isAppleLoading, appleSignInError } = useAppleSignIn()

// Watch reactive errors
watch(signInError, (newError) => {
  if (newError) localError.value = newError
})

watch(appleSignInError, (newError) => {
  if (newError) localError.value = newError
})

// Auto-check existing session on load
onMounted(async () => {
  const tokenCookie = useCookie('token')
  if (tokenCookie.value) {
    isResumingSession.value = true
    try {
      await router.push('/dashboard')
    } catch {
      isResumingSession.value = false
    }
  }
})

// Handle Google OAuth
const handleGoogleLogin = async () => {
  isLoading.value = true
  localError.value = null

  try {
    initGoogleSignIn()
  } catch (err: any) {
    localError.value = err?.message || 'Google sign-in initiation failed'
  } finally {
    setTimeout(() => {
      isLoading.value = false
    }, 1500)
  }
}

// Handle Apple OAuth
const handleAppleLogin = async () => {
  localError.value = null
  await signInWithApple()
}
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-[#f4f4f5] relative overflow-hidden flex flex-col justify-between selection:bg-white selection:text-black font-sans">
    
    <!-- Ambient Background Canvas & Grid -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <!-- Subtle Grid -->
      <div class="absolute inset-0 subtle-grid opacity-35"></div>
      
      <!-- Glowing Ambient Spheres -->
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>

    <!-- Top Navigation Bar -->
    <header class="relative z-10 p-6 sm:p-8 flex items-center justify-between max-w-5xl mx-auto w-full">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-xs font-mono transition-all cursor-pointer group"
      >
        <Icon name="carbon:arrow-left" size="13" class="group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Portfolio</span>
      </NuxtLink>

      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-xs font-mono text-zinc-400">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Console v2.0 • Secure Gateway</span>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="relative z-10 w-full max-w-md mx-auto px-6 py-4 flex-1 flex flex-col justify-center">
      
      <!-- Resuming Session Banner (if token already present) -->
      <div
        v-if="isResumingSession"
        class="p-6 rounded-3xl bg-[#141417]/90 border border-emerald-500/30 shadow-2xl backdrop-blur-2xl text-center space-y-4"
      >
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <Icon name="carbon:renew" size="24" class="animate-spin" />
        </div>
        <div class="space-y-1">
          <h3 class="text-base font-semibold text-white">Active Session Detected</h3>
          <p class="text-xs text-zinc-400 font-mono">Redirecting to Dashboard Console...</p>
        </div>
      </div>

      <!-- Login Card -->
      <div
        v-else
        class="bg-[#141417]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6 relative overflow-hidden"
      >
        <!-- Subtle Top Border Highlight -->
        <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        <!-- Header / Monogram -->
        <div class="text-center space-y-2">
          <!-- Monogram Pill -->
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="font-bold text-xs tracking-tight text-white font-heading">Eka<span class="text-zinc-500">.</span></span>
            <span class="text-[10px] font-mono text-zinc-400">Admin Console</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sign In to Dashboard
          </h1>
          <p class="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
            Akses kurasi Tech Radar harian, manajemen portfolio, dan telemetri sistem.
          </p>
        </div>

        <!-- Error Notification -->
        <div
          v-if="localError"
          class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"
        >
          <Icon name="carbon:warning-filled" size="16" class="shrink-0" />
          <span>{{ localError }}</span>
        </div>

        <!-- Primary OAuth Login Buttons -->
        <div class="space-y-3.5 pt-2">
          <!-- Google Login Button -->
          <button
            @click="handleGoogleLogin"
            :disabled="isLoading || isAppleLoading"
            class="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-[#09090b] font-semibold text-xs sm:text-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-white/5 hover:shadow-white/10 cursor-pointer"
          >
            <Icon
              v-if="isLoading"
              name="carbon:renew"
              size="18"
              class="animate-spin text-[#09090b]"
            />
            <Icon
              v-else
              name="logos:google-icon"
              size="18"
            />
            <span>{{ isLoading ? 'Connecting to Google...' : 'Continue with Google' }}</span>
          </button>

          <!-- Apple Login Button -->
          <button
            @click="handleAppleLogin"
            :disabled="isLoading || isAppleLoading"
            class="w-full py-3.5 px-4 rounded-2xl bg-[#1c1c21] hover:bg-[#232329] text-white border border-white/15 hover:border-white/25 font-semibold text-xs sm:text-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-sm cursor-pointer"
          >
            <Icon
              v-if="isAppleLoading"
              name="carbon:renew"
              size="18"
              class="animate-spin text-white"
            />
            <Icon
              v-else
              name="mdi:apple"
              size="20"
              class="text-white"
            />
            <span>{{ isAppleLoading ? 'Connecting to Apple...' : 'Sign in with Apple' }}</span>
          </button>
        </div>

        <!-- Security Pill Footnote -->
        <div class="pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-[11px] font-mono text-zinc-500">
          <span class="flex items-center gap-1">
            <Icon name="carbon:checkmark-filled" size="13" class="text-emerald-400" />
            <span>OAuth 2.0 PKCE</span>
          </span>
          <span class="flex items-center gap-1">
            <Icon name="carbon:checkmark-filled" size="13" class="text-emerald-400" />
            <span>TLS 1.3 / JWT</span>
          </span>
        </div>
      </div>
    </main>

    <!-- Footer Security / Legal Notes -->
    <footer class="relative z-10 p-6 text-center text-xs text-zinc-600 font-mono space-y-2 max-w-md mx-auto">
      <p>
        Portfolio Management Console • Moh. Eka Syafrino Nazhifan
      </p>
      <div class="flex items-center justify-center gap-4 text-zinc-500">
        <NuxtLink to="/terms" class="hover:text-zinc-300 transition-colors">Terms of Service</NuxtLink>
        <span>•</span>
        <NuxtLink to="/privacy" class="hover:text-zinc-300 transition-colors">Privacy Policy</NuxtLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.97) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

main > div {
  animation: fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
