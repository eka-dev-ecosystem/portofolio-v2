<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useDashboardStats } from '~/composables/useDashboardStats'
import { useProject } from '~/composables/useProject'
import { jwtDecode } from 'jwt-decode'

definePageMeta({
  layout: 'dashboard',
  breadCrumb: []
})

const userName = ref('Admin')
const { $axios } = useNuxtApp()
const { fetchStats } = useDashboardStats()
const { fetchProjects } = useProject()

// Extract user name from token if available
onMounted(() => {
  try {
    const tokenCookie = useCookie('token')
    if (tokenCookie.value) {
      const decoded: any = jwtDecode(tokenCookie.value)
      if (decoded?.name) {
        userName.value = decoded.name
      }
    }
  } catch (e) {
    console.error('Failed to parse user name from token:', e)
  }
})

// Fetch data on server-side using useFetch
const { data: projectsData } = await useAsyncData(
  'dashboard-projects',
  async () => await fetchProjects(false, '')
)

const { data: statsData } = await useAsyncData(
  'dashboard-stats',
  async () => await fetchStats()
)

const { data: techRadarData } = await useAsyncData(
  'dashboard-tech-radar',
  async () => {
    try {
      const res = await $axios.get<BaseResponse<any>>('/api/dashboard/tech-radar', {
        params: { limit: 3 },
      })
      return res.data
    } catch (e) {
      console.error('Failed to fetch tech radar on dashboard:', e)
      return null
    }
  }
)

// Extract data from responses
const projects = computed(() => {
  return projectsData.value?.data ?? []
})

const topTechNews = computed(() => {
  return techRadarData.value?.data?.items || []
})

const dashboardStats = computed(() => {
  return statsData.value ?? null
})

const getStatusLabel = (status: any) => {
  if (status === 'published' || status === true) return 'Published'
  if (status === 'archived') return 'Archived'
  return 'Draft'
}

const stats = computed(() => [
  {
    label: 'Total Projects',
    value: dashboardStats.value?.projects.total.toString() ?? '0',
    icon: 'carbon:folder-open',
    href: '/dashboard/projects',
  },
  {
    label: 'Published',
    value: dashboardStats.value?.projects.published.toString() ?? '0',
    icon: 'carbon:checkmark-filled',
    statusDot: 'bg-emerald-400',
    href: '/dashboard/projects',
  },
  {
    label: 'In Draft',
    value: dashboardStats.value?.projects.draft.toString() ?? '0',
    icon: 'carbon:document-blank',
    statusDot: 'bg-zinc-400',
    href: '/dashboard/projects',
  },
  {
    label: 'Archived',
    value: (dashboardStats.value?.projects.archived ?? 0).toString(),
    icon: 'carbon:archive',
    statusDot: 'bg-amber-400',
    href: '/dashboard/projects',
  },
  {
    label: 'Total Skills',
    value: dashboardStats.value?.skills.total.toString() ?? '0',
    icon: 'carbon:skill-level',
    href: '/dashboard/skills',
  }
])

const recentProjects = computed(() => {
  return projects.value
    .slice(0, 5)
    .map((p: any) => ({
      id: p.id,
      title: p.name,
      status: getStatusLabel(p.status),
      updatedAt: formatDate(p.updated_at)
    }))
})

// Quick shortcuts definition
const quickShortcuts = [
  {
    title: 'Tech Radar',
    description: 'Daily curated tech news & AI pulse',
    icon: 'carbon:radar',
    href: '/dashboard/tech-radar',
  },
  {
    title: 'Projects',
    description: 'Manage showcases & case studies',
    icon: 'carbon:folder-open',
    href: '/dashboard/projects',
  },
  {
    title: 'Work Experience',
    description: 'Career journey & milestones',
    icon: 'mdi:briefcase',
    href: '/dashboard/journeys',
  },
  {
    title: 'Skills & Tech Stack',
    description: 'PostgreSQL-backed categories',
    icon: 'carbon:skill-level',
    href: '/dashboard/skills',
  },
  {
    title: 'Analytics & Traffic',
    description: 'Live visitor telemetry & telemetry',
    icon: 'carbon:chart-bar',
    href: '/dashboard/analytics',
  },
]

useHead({
  title: "Dashboard Overview | Eka Dev",
})
</script>

<template>
  <div class="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/10 text-zinc-300 border border-white/15 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Console</span>
          </span>
        </div>
        <p class="text-sm text-zinc-400 mt-1.5">
          Welcome back, <span class="text-white font-medium">{{ userName }}</span>. Here is the operational summary of your portfolio.
        </p>
      </div>

      <!-- Header Action Buttons -->
      <div class="flex items-center gap-2.5 flex-wrap">
        <NuxtLink
          to="/dashboard/analytics"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
        >
          <Icon name="carbon:chart-bar" size="16" />
          <span>Analytics</span>
        </NuxtLink>
        <NuxtLink
          to="/dashboard/projects/new"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-all text-xs shadow-sm cursor-pointer"
        >
          <Icon name="carbon:add" size="16" />
          <span>New Project</span>
        </NuxtLink>
      </div>
    </div>

    <!-- 5 Stats Cards Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
      <NuxtLink
        v-for="stat in stats"
        :key="stat.label"
        :to="stat.href"
        class="rounded-2xl bg-[#141417] border border-white/10 p-5 hover:border-white/25 transition-all group flex flex-col justify-between cursor-pointer"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:border-white/20 transition-all">
            <Icon :name="stat.icon" size="20" />
          </div>
          <span v-if="stat.statusDot" class="w-2 h-2 rounded-full" :class="stat.statusDot"></span>
          <Icon v-else name="carbon:arrow-up-right" size="16" class="text-zinc-500 group-hover:text-white transition-colors" />
        </div>

        <div>
          <p class="text-2xl sm:text-3xl font-bold text-white tracking-tight">{{ stat.value }}</p>
          <p class="text-xs text-zinc-400 mt-1 font-medium">{{ stat.label }}</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Quick Navigation Shortcuts -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <NuxtLink
        v-for="shortcut in quickShortcuts"
        :key="shortcut.title"
        :to="shortcut.href"
        class="rounded-2xl bg-[#141417] border border-white/10 p-4 hover:border-white/20 hover:bg-[#18181c] transition-all flex items-center gap-3.5 group cursor-pointer"
      >
        <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white shrink-0 transition-colors">
          <Icon :name="shortcut.icon" size="20" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-white tracking-tight group-hover:text-white transition-colors truncate">{{ shortcut.title }}</p>
          <p class="text-xs text-zinc-500 truncate">{{ shortcut.description }}</p>
        </div>
        <Icon name="carbon:chevron-right" size="16" class="text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
      </NuxtLink>
    </div>

    <!-- Today's Tech Pulse Section -->
    <div class="rounded-2xl bg-[#141417] border border-white/10 p-5 sm:p-6 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-white/5">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Icon name="carbon:radar" size="18" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-white tracking-tight">Today's Tech Pulse</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Feed</span>
              </span>
            </div>
            <p class="text-xs text-zinc-400 mt-0.5">Kurasi berita & update teknologi teratas hari ini.</p>
          </div>
        </div>
        <NuxtLink
          to="/dashboard/tech-radar"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wide shadow-sm hover:opacity-90 transition-opacity"
        >
          <span>Open Tech Radar</span>
          <Icon name="carbon:arrow-up-right" size="13" />
        </NuxtLink>
      </div>

      <!-- 3 Highlights Grid -->
      <div v-if="topTechNews.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a
          v-for="item in topTechNews"
          :key="item.id"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all flex flex-col justify-between space-y-3"
        >
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-zinc-300 border border-white/5">
                {{ item.source }}
              </span>
              <span class="text-[11px] font-mono text-zinc-500">{{ item.time_ago }}</span>
            </div>
            <h4 class="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
              {{ item.title }}
            </h4>
          </div>
          <div class="flex items-center justify-between pt-1 text-[11px] font-mono text-zinc-500">
            <span v-if="item.score !== undefined && item.score > 0">▲ {{ item.score }} pts</span>
            <span v-else class="capitalize">{{ item.category }}</span>
            <span class="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              <span>Read</span>
              <Icon name="carbon:arrow-up-right" size="11" />
            </span>
          </div>
        </a>
      </div>

      <div v-else class="text-center py-6 text-xs text-zinc-500">
        Memuat headline teknologi terbaru...
      </div>
    </div>

    <!-- Recent Projects Section -->
    <div class="rounded-2xl bg-[#141417] border border-white/10 overflow-hidden">
      <!-- Header -->
      <div class="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">Recent Projects</h2>
          <p class="text-xs text-zinc-400 mt-0.5">Latest projects updated in your portfolio repository.</p>
        </div>
        <NuxtLink
          to="/dashboard/projects"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <span>View All</span>
          <Icon name="carbon:arrow-right" size="14" />
        </NuxtLink>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-white/10 bg-white/[0.01]">
              <th class="px-6 py-3.5 text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">Project Name</th>
              <th class="px-6 py-3.5 text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3.5 text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">Last Modified</th>
              <th class="px-6 py-3.5 text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="project in recentProjects"
              :key="project.id"
              class="hover:bg-white/[0.02] transition-colors"
            >
              <td class="px-6 py-4">
                <NuxtLink
                  :to="`/dashboard/projects/${project.id}`"
                  class="font-medium text-sm text-white hover:underline tracking-tight"
                >
                  {{ project.title }}
                </NuxtLink>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border inline-flex items-center gap-1.5"
                  :class="[
                    project.status === 'Published'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : project.status === 'Archived'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                  ]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="[
                      project.status === 'Published'
                        ? 'bg-emerald-400'
                        : project.status === 'Archived'
                          ? 'bg-amber-400'
                          : 'bg-zinc-400'
                    ]"
                  ></span>
                  <span>{{ project.status }}</span>
                </span>
              </td>
              <td class="px-6 py-4 text-xs font-mono text-zinc-400">
                {{ project.updatedAt }}
              </td>
              <td class="px-6 py-4 text-right">
                <NuxtLink
                  :to="`/dashboard/projects/${project.id}`"
                  class="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                >
                  Edit &rarr;
                </NuxtLink>
              </td>
            </tr>

            <tr v-if="recentProjects.length === 0">
              <td colspan="4" class="px-6 py-10 text-center text-sm text-zinc-500">
                No projects found. Create your first project to get started.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

