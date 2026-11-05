<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type {
  TechCategory,
  TechNewsItem,
  TechRadarStats,
  TechRadarResponseData,
  DailyBriefingResponse,
} from '~/types/tech-news'

definePageMeta({
  layout: 'dashboard',
  breadCrumb: [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Tech Radar' },
  ],
})

const { $axios } = useNuxtApp()

// Current Date formatted (e.g., "Tuesday, 27 October 2026")
const currentDateStr = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

// State
const activeCategory = ref<TechCategory>('all')
const selectedSource = ref<string>('all')
const searchQuery = ref('')
const isLoading = ref(true)
const isRefreshing = ref(false)
const isBriefingLoading = ref(false)
const isBriefingOpen = ref(true)

const items = ref<TechNewsItem[]>([])
const stats = ref<TechRadarStats>({
  total: 0,
  unread: 0,
  bookmarked: 0,
  last_synced: 'Just now',
})
const briefing = ref<DailyBriefingResponse | null>(null)
const toastMessage = ref<string | null>(null)

let toastTimeout: any = null
const showToast = (msg: string) => {
  toastMessage.value = msg
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    toastMessage.value = null
  }, 2500)
}

// Category Tabs Configuration
const categories: { key: TechCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All Highlights', icon: 'carbon:fire' },
  { key: 'ai', label: 'AI & Machine Learning', icon: 'carbon:bot' },
  { key: 'web', label: 'Web & Frontend', icon: 'carbon:application-web' },
  { key: 'backend', label: 'Backend & Cloud', icon: 'carbon:cloud-service-management' },
  { key: 'mobile', label: 'Mobile (Flutter/iOS)', icon: 'carbon:application-mobile' },
  { key: 'tools', label: 'Open Source & Tools', icon: 'carbon:tools' },
  { key: 'bookmarks', label: 'Bookmarks (DB)', icon: 'carbon:bookmark-filled' },
]

// Sources list
const sources = ['all', 'Hacker News', 'Dev.to', 'GitHub']

// Fetch data from backend
const fetchRadar = async (force = false) => {
  if (force) isRefreshing.value = true
  else isLoading.value = true

  try {
    const isBookmarksTab = activeCategory.value === 'bookmarks'
    const queryParams: Record<string, any> = {
      category: isBookmarksTab ? 'all' : activeCategory.value,
      bookmarks_only: isBookmarksTab ? 'true' : 'false',
    }
    if (force) queryParams.force_refresh = 'true'

    const res = await $axios.get<BaseResponse<TechRadarResponseData>>('/api/dashboard/tech-radar', {
      params: queryParams,
    })

    if (res?.data?.data) {
      items.value = res.data.data.items || []
      stats.value = res.data.data.stats || stats.value
    }
  } catch (error: any) {
    console.error('Failed to fetch Tech Radar feed:', error)
    showToast('Gagal memuat Tech Radar feed')
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// Fetch or generate AI Executive Briefing
const fetchBriefing = async (force = false) => {
  isBriefingLoading.value = true
  try {
    const res = await $axios.post<BaseResponse<DailyBriefingResponse>>('/api/dashboard/tech-radar/briefing', {
      force,
    })
    if (res?.data?.data) {
      briefing.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to fetch AI briefing:', error)
  } finally {
    isBriefingLoading.value = false
  }
}

// Click article -> mark read in DB + open link in new tab
const handleArticleClick = async (item: TechNewsItem) => {
  // Mark read optimistically
  if (!item.is_read) {
    item.is_read = true
    if (stats.value.unread > 0) stats.value.unread--

    try {
      await $axios.post('/api/dashboard/tech-radar/read', {
        article_id: item.id,
        title: item.title,
        url: item.url,
        source: item.source,
        category: item.category,
        author: item.author,
        published_at: item.published_at,
      })
    } catch (err) {
      console.error('Failed to mark article as read in DB:', err)
    }
  }

  // Open destination
  if (item.url) {
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }
}

// Toggle Bookmark with DB persistence
const handleToggleBookmark = async (item: TechNewsItem, event?: Event) => {
  if (event) event.stopPropagation()

  const previousState = item.is_bookmarked
  item.is_bookmarked = !previousState

  if (item.is_bookmarked) {
    stats.value.bookmarked++
    showToast('Tersimpan di Bookmarks database')
  } else {
    stats.value.bookmarked = Math.max(0, stats.value.bookmarked - 1)
    showToast('Dihapus dari Bookmarks')
  }

  try {
    const res = await $axios.post<BaseResponse<{ is_bookmarked: boolean }>>('/api/dashboard/tech-radar/bookmark', {
      article_id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      category: item.category,
      author: item.author,
      published_at: item.published_at,
    })

    if (res?.data?.data?.is_bookmarked !== undefined) {
      item.is_bookmarked = res.data.data.is_bookmarked
    }
  } catch (err) {
    // revert on error
    item.is_bookmarked = previousState
    showToast('Gagal mengubah status bookmark')
    console.error('Failed to toggle bookmark in DB:', err)
  }
}

// Computed: Filtered items by search & source
const filteredItems = computed(() => {
  let list = items.value

  // Source filter
  if (selectedSource.value !== 'all') {
    list = list.filter((i) => i.source === selectedSource.value)
  }

  // Search query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.summary?.toLowerCase().includes(q) ||
        i.author?.toLowerCase().includes(q) ||
        (i.tags && i.tags.some((t) => t.toLowerCase().includes(q)))
    )
  }

  return list
})

// Switch category tab
const setCategory = (cat: TechCategory) => {
  activeCategory.value = cat
  fetchRadar(false)
}

// Source styling helper
const getSourceBadgeClass = (source: string) => {
  switch (source) {
    case 'Hacker News':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    case 'Dev.to':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    case 'GitHub':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    default:
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  }
}

const getCategoryLabel = (cat: TechCategory) => {
  const found = categories.find((c) => c.key === cat)
  return found ? found.label.split(' ')[0] : cat
}

onMounted(() => {
  fetchRadar()
  fetchBriefing()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#18181b] via-[#141417] to-[#0f0f12] p-6 sm:p-8 border border-white/10 shadow-2xl">
      <div class="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-mono font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Tech Radar
            </span>
            <span class="text-xs font-mono text-zinc-400">
              {{ currentDateStr }}
            </span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Daily Tech Radar</span>
            <Icon name="carbon:radar" class="text-indigo-400" size="26" />
          </h1>
          <p class="text-sm text-zinc-400 max-w-xl font-normal leading-relaxed">
            Kurasi harian perkembangan teknologi, AI, web, mobile, dan open source dunia tanpa kebisingan media sosial.
            Riwayat baca dan bookmark tersimpan aman di database Anda.
          </p>
        </div>

        <!-- Action Stats & Refresh Button -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-center">
            <div class="text-xs text-zinc-500 font-mono">Belum Dibaca</div>
            <div class="text-lg font-bold text-white font-mono">{{ stats.unread }}</div>
          </div>
          <div class="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-center">
            <div class="text-xs text-zinc-500 font-mono">Tersimpan (DB)</div>
            <div class="text-lg font-bold text-amber-400 font-mono">{{ stats.bookmarked }}</div>
          </div>
          <button
            @click="fetchRadar(true)"
            :disabled="isRefreshing"
            class="flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-black font-semibold text-xs tracking-wide shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Feed Sekarang"
          >
            <Icon
              name="carbon:renew"
              size="15"
              :class="{ 'animate-spin': isRefreshing }"
            />
            <span>{{ isRefreshing ? 'Refreshing...' : 'Sync Feed' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- AI 1-Minute Executive Briefing Card (Gemini) -->
    <div class="rounded-2xl bg-[#141417]/90 border border-white/10 backdrop-blur-xl overflow-hidden transition-all shadow-lg">
      <div
        @click="isBriefingOpen = !isBriefingOpen"
        class="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/[0.02] border-b border-white/5 transition-colors"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
            <Icon name="carbon:bot" class="text-white" size="16" />
          </div>
          <div>
            <div class="text-sm font-semibold text-white flex items-center gap-2">
              <span>⚡ AI 1-Minute Daily Tech Briefing</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini 2.5
              </span>
            </div>
            <div class="text-xs text-zinc-400 font-normal">
              Ringkasan eksekutif 3 poin penting perkembangan teknologi hari ini
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click.stop="fetchBriefing(true)"
            :disabled="isBriefingLoading"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Regenerate Briefing"
          >
            <Icon name="carbon:renew" size="14" :class="{ 'animate-spin': isBriefingLoading }" />
          </button>
          <Icon
            :name="isBriefingOpen ? 'carbon:chevron-up' : 'carbon:chevron-down'"
            size="16"
            class="text-zinc-400"
          />
        </div>
      </div>

      <!-- Briefing Body -->
      <div v-show="isBriefingOpen" class="p-6 space-y-4">
        <div v-if="isBriefingLoading" class="flex items-center justify-center py-6 text-zinc-400 gap-2">
          <Icon name="carbon:progress-bar-round" size="20" class="animate-spin text-indigo-400" />
          <span class="text-xs font-mono">Menyiapkan rangkuman teknologi hari ini dari AI...</span>
        </div>

        <div v-else-if="briefing" class="space-y-4">
          <!-- Main Headline -->
          <div class="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div class="text-xs uppercase tracking-wider font-mono font-semibold text-indigo-400 mb-1">
              Top Pulse Hari Ini
            </div>
            <p class="text-sm font-medium text-white leading-relaxed">
              {{ briefing.headline }}
            </p>
          </div>

          <!-- 3 Key Takeaways Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              v-for="(point, idx) in briefing.takeaways"
              :key="idx"
              class="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono font-bold text-indigo-400">#0{{ idx + 1 }}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-zinc-300">
                  {{ point.tag }}
                </span>
              </div>
              <h4 class="text-xs font-semibold text-white line-clamp-2">
                {{ point.title }}
              </h4>
              <p class="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                {{ point.desc }}
              </p>
            </div>
          </div>

          <!-- Market Sentiment Note -->
          <div v-if="briefing.market_pulse" class="text-xs text-zinc-400 italic flex items-center gap-1.5 pt-1">
            <Icon name="carbon:analytics" size="13" class="text-zinc-500" />
            <span>Market note: {{ briefing.market_pulse }}</span>
          </div>
        </div>

        <div v-else class="text-center py-4 text-xs text-zinc-500">
          Klik tombol refresh untuk memuat AI Daily Briefing.
        </div>
      </div>
    </div>

    <!-- Category Tabs & Search Bar -->
    <div class="space-y-4">
      <!-- Tabs Carousel/Scroll -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          v-for="cat in categories"
          :key="cat.key"
          @click="setCategory(cat.key)"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border"
          :class="activeCategory === cat.key
            ? 'bg-white text-black font-semibold border-white shadow-sm'
            : 'bg-[#141417]/80 text-zinc-400 hover:text-white border-white/10 hover:bg-white/[0.04]'"
        >
          <Icon :name="cat.icon" size="14" />
          <span>{{ cat.label }}</span>
          <span
            v-if="cat.key === 'bookmarks' && stats.bookmarked > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] font-mono"
            :class="activeCategory === 'bookmarks' ? 'bg-black text-white' : 'bg-amber-400/20 text-amber-300'"
          >
            {{ stats.bookmarked }}
          </span>
        </button>
      </div>

      <!-- Search & Source Filter Bar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1">
          <Icon name="carbon:search" size="15" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari berita, keyword (e.g. vue, flutter, agent, llm)..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141417]/80 border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors font-mono"
          />
        </div>

        <!-- Source Pills -->
        <div class="flex items-center gap-1 p-1 rounded-xl bg-[#141417]/80 border border-white/10 self-start sm:self-auto">
          <button
            v-for="src in sources"
            :key="src"
            @click="selectedSource = src"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            :class="selectedSource === src
              ? 'bg-white text-black font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'"
          >
            {{ src === 'all' ? 'All Sources' : src }}
          </button>
        </div>
      </div>
    </div>

    <!-- Article Cards List -->
    <div v-if="isLoading" class="space-y-3">
      <div
        v-for="i in 8"
        :key="i"
        class="h-28 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"
      ></div>
    </div>

    <div v-else-if="filteredItems.length === 0" class="text-center py-16 space-y-3 rounded-2xl bg-[#141417]/40 border border-white/5">
      <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-zinc-500">
        <Icon name="carbon:information" size="24" />
      </div>
      <div class="text-sm font-semibold text-white">Tidak ada artikel ditemukan</div>
      <p class="text-xs text-zinc-500 max-w-sm mx-auto">
        {{ activeCategory === 'bookmarks'
          ? 'Anda belum menyimpan artikel apapun ke Bookmarks. Klik ikon bookmark pada artikel untuk menyimpannya ke database.'
          : 'Coba ubah kata kunci pencarian atau ganti kategori filter di atas.' }}
      </p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        @click="handleArticleClick(item)"
        class="group relative rounded-2xl bg-[#141417]/80 border p-5 transition-all duration-200 cursor-pointer hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5"
        :class="item.is_read
          ? 'border-white/5 bg-[#121215]/50 opacity-75'
          : 'border-white/10 hover:bg-[#18181d]'"
      >
        <div class="flex items-start justify-between gap-4">
          <!-- Left Main Content -->
          <div class="space-y-2 flex-1">
            <!-- Metadata Line -->
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <!-- Source Badge -->
              <span
                class="px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium"
                :class="getSourceBadgeClass(item.source)"
              >
                {{ item.source }}
              </span>

              <!-- Category Tag -->
              <span class="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-zinc-400 text-[11px] font-mono capitalize">
                {{ getCategoryLabel(item.category) }}
              </span>

              <!-- Read / Unread Status Indicator -->
              <span
                v-if="!item.is_read"
                class="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Unread</span>
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500"
              >
                <Icon name="carbon:checkmark" size="12" />
                <span>Read</span>
              </span>

              <span class="text-zinc-600">•</span>
              <span class="text-zinc-500 text-[11px] font-mono">{{ item.time_ago }}</span>

              <span v-if="item.author" class="hidden sm:inline text-zinc-600">•</span>
              <span v-if="item.author" class="hidden sm:inline text-zinc-500 text-[11px] font-mono">by {{ item.author }}</span>
            </div>

            <!-- Title -->
            <h3
              class="text-sm sm:text-base font-semibold tracking-tight transition-colors flex items-baseline gap-1.5"
              :class="item.is_read ? 'text-zinc-300' : 'text-white group-hover:text-indigo-300'"
            >
              <span>{{ item.title }}</span>
              <Icon
                name="carbon:arrow-up-right"
                size="13"
                class="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 shrink-0"
              />
            </h3>

            <!-- Summary / Excerpt -->
            <p v-if="item.summary" class="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-normal">
              {{ item.summary }}
            </p>

            <!-- Tags & Metrics Footer -->
            <div class="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-500 font-mono">
              <span v-if="item.score !== undefined && item.score > 0" class="flex items-center gap-1 text-zinc-400">
                <Icon name="carbon:thumbs-up" size="12" />
                <span>{{ item.score }}</span>
              </span>

              <span v-if="item.comments_count !== undefined && item.comments_count > 0" class="flex items-center gap-1 text-zinc-400">
                <Icon name="carbon:chat" size="12" />
                <span>{{ item.comments_count }}</span>
              </span>

              <div v-if="item.tags && item.tags.length > 0" class="flex items-center gap-1.5 overflow-hidden">
                <span
                  v-for="tag in item.tags.slice(0, 3)"
                  :key="tag"
                  class="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.03] text-zinc-400 border border-white/5"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right Action: Bookmark Toggle -->
          <button
            @click="handleToggleBookmark(item, $event)"
            class="p-2.5 rounded-xl border transition-all cursor-pointer shrink-0"
            :class="item.is_bookmarked
              ? 'bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400/20 shadow-sm'
              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'"
            :title="item.is_bookmarked ? 'Hapus dari Bookmarks' : 'Simpan ke Bookmarks DB'"
          >
            <Icon
              :name="item.is_bookmarked ? 'carbon:bookmark-filled' : 'carbon:bookmark'"
              size="17"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-3"
    >
      <div
        v-if="toastMessage"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 border border-white/20 text-white text-xs font-mono shadow-2xl backdrop-blur-xl"
      >
        <Icon name="carbon:checkmark-filled" class="text-emerald-400" size="16" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>
