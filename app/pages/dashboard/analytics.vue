<script setup lang="ts">
import { ref, computed } from 'vue';

definePageMeta({
  layout: 'dashboard',
  breadCrumb: [{ title: 'Analytics' }],
});

const timeRange = ref<'7days' | '30days' | '90days' | 'all'>('30days');
const chartMode = ref<'area' | 'bar'>('area');
const isHoveringChart = ref(false);
const activeHoverIndex = ref<number | null>(null);
const selectedIndex = ref<number | null>(null);

const { $axios } = useNuxtApp();

const { data: analyticsRes, pending, refresh } = await useAsyncData(
  'dashboard-analytics',
  async () => {
    const res = await $axios.get<BaseResponse<any>>('/api/dashboard/analytics', {
      params: { range: timeRange.value },
    });
    return res.data;
  },
  {
    watch: [timeRange],
  }
);

const analytics = computed(() => analyticsRes.value?.data || null);

const summary = computed(() => analytics.value?.summary || {
  totalVisitors: 0,
  visitorsChange: '0%',
  pageViews: 0,
  pageViewsChange: '0%',
  bounceRate: '0%',
  bounceRateChange: '0%',
  avgDuration: '0s',
  topDevice: 'Desktop (100%)',
});

const trafficData = computed(() => analytics.value?.trafficData || []);
const topPages = computed(() => analytics.value?.topPages || []);
const topReferrers = computed(() => analytics.value?.topReferrers || []);
const deviceBreakdown = computed(() => analytics.value?.deviceBreakdown || []);
const osBreakdown = computed(() => analytics.value?.osBreakdown || []);

// KPI Stat Cards Definition
const statsCards = computed(() => [
  {
    label: 'Unique Visitors',
    value: summary.value.totalVisitors.toLocaleString(),
    change: summary.value.visitorsChange,
    isPositive: !summary.value.visitorsChange.startsWith('-'),
    icon: 'carbon:user',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    label: 'Total Page Views',
    value: summary.value.pageViews.toLocaleString(),
    change: summary.value.pageViewsChange,
    isPositive: !summary.value.pageViewsChange.startsWith('-'),
    icon: 'carbon:view',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    label: 'Bounce Rate',
    value: summary.value.bounceRate,
    change: summary.value.bounceRateChange,
    isPositive: summary.value.bounceRateChange.startsWith('-'), // lower bounce is positive
    icon: 'carbon:exit',
    color: 'from-purple-500 to-violet-600',
  },
  {
    label: 'Top Device',
    value: summary.value.topDevice,
    change: summary.value.avgDuration,
    isPositive: true,
    subLabel: 'Avg Session Duration',
    icon: 'carbon:devices',
    color: 'from-amber-500 to-orange-600',
  },
]);

// SVG Chart Calculations
const maxTrafficValue = computed(() => {
  if (!trafficData.value.length) return 10;
  const max = Math.max(...trafficData.value.map((d: any) => Math.max(d.views, d.visitors)));
  return max === 0 ? 10 : Math.ceil(max * 1.15);
});

const chartWidth = 800;
const chartHeight = 240;
const paddingX = 30;
const paddingY = 20;

const points = computed(() => {
  const data = trafficData.value;
  if (!data.length) return { views: [], visitors: [] };

  const usableW = chartWidth - paddingX * 2;
  const usableH = chartHeight - paddingY * 2;
  const step = usableW / (data.length - 1 || 1);

  const viewsPoints = data.map((d: any, idx: number) => {
    const x = paddingX + idx * step;
    const y = chartHeight - paddingY - (d.views / maxTrafficValue.value) * usableH;
    return { x, y, data: d };
  });

  const visitorsPoints = data.map((d: any, idx: number) => {
    const x = paddingX + idx * step;
    const y = chartHeight - paddingY - (d.visitors / maxTrafficValue.value) * usableH;
    return { x, y, data: d };
  });

  return { views: viewsPoints, visitors: visitorsPoints };
});

const svgAreaPath = computed(() => {
  const pts = points.value.views;
  if (!pts.length) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  const baseY = chartHeight - paddingY;

  let d = `M ${first.x} ${baseY} L ${first.x} ${first.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const current = pts[i];
    const next = pts[i + 1];
    const cpX = (current.x + next.x) / 2;
    d += ` C ${cpX} ${current.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }
  d += ` L ${last.x} ${baseY} Z`;
  return d;
});

const svgLinePath = computed(() => {
  const pts = points.value.views;
  if (!pts.length) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const current = pts[i];
    const next = pts[i + 1];
    const cpX = (current.x + next.x) / 2;
    d += ` C ${cpX} ${current.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
});

const svgVisitorsLinePath = computed(() => {
  const pts = points.value.visitors;
  if (!pts.length) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const current = pts[i];
    const next = pts[i + 1];
    const cpX = (current.x + next.x) / 2;
    d += ` C ${cpX} ${current.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
});

const stepWidth = computed(() => {
  const total = trafficData.value.length;
  if (total <= 1) return chartWidth - paddingX * 2;
  return (chartWidth - paddingX * 2) / (total - 1);
});

const activeIndex = computed(() => {
  if (activeHoverIndex.value !== null) return activeHoverIndex.value;
  if (selectedIndex.value !== null) return selectedIndex.value;
  if (trafficData.value.length > 0) return trafficData.value.length - 1;
  return null;
});

const activeDisplayPoint = computed(() => {
  const idx = activeIndex.value;
  if (idx === null || !points.value.views[idx]) return null;

  const viewPt = points.value.views[idx];
  const visitorPt = points.value.visitors[idx];
  const item = trafficData.value[idx];

  // Percentage within the SVG coordinate space (0-100%)
  const xPercent = (viewPt.x / chartWidth) * 100;
  const yPercent = (Math.min(viewPt.y, visitorPt.y) / chartHeight) * 100;

  return {
    index: idx,
    viewPt,
    visitorPt,
    item,
    xPercent,
    yPercent,
  };
});

const hoveredPoint = computed(() => {
  if (activeHoverIndex.value === null || !points.value.views[activeHoverIndex.value]) return null;
  return {
    viewPt: points.value.views[activeHoverIndex.value],
    visitorPt: points.value.visitors[activeHoverIndex.value],
    item: trafficData.value[activeHoverIndex.value],
  };
});

const updateActiveIndexFromClientX = (clientX: number, target: HTMLElement) => {
  const rect = target.getBoundingClientRect();
  if (!rect.width) return;
  const relX = clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, relX / rect.width));
  const total = trafficData.value.length;
  if (total <= 0) return;
  const index = Math.round(ratio * (total - 1));
  if (index >= 0 && index < total) {
    activeHoverIndex.value = index;
    selectedIndex.value = index;
    isHoveringChart.value = true;
  }
};

const handleChartMouseMove = (e: MouseEvent) => {
  updateActiveIndexFromClientX(e.clientX, e.currentTarget as HTMLElement);
};

const handleChartMouseLeave = () => {
  isHoveringChart.value = false;
  activeHoverIndex.value = null;
};

const handleChartTouchStart = (e: TouchEvent) => {
  if (e.touches && e.touches[0]) {
    updateActiveIndexFromClientX(e.touches[0].clientX, e.currentTarget as HTMLElement);
  }
};

const handleChartTouchMove = (e: TouchEvent) => {
  if (e.touches && e.touches[0]) {
    updateActiveIndexFromClientX(e.touches[0].clientX, e.currentTarget as HTMLElement);
  }
};

const handleChartTouchEnd = () => {
  // Retain selectedIndex active so user can inspect metrics on mobile without keeping finger pressed
  isHoveringChart.value = false;
  activeHoverIndex.value = null;
};

const selectPoint = (idx: number) => {
  selectedIndex.value = idx;
  activeHoverIndex.value = idx;
};

// Test beacon trigger for testing
const sendingTestHit = ref(false);
const triggerTestBeacon = async () => {
  sendingTestHit.value = true;
  try {
    await $fetch('/api/analytics/track', {
      method: 'POST',
      body: {
        path: '/',
        title: 'Home • Eka Portfolio',
        referrer: 'https://github.com/exa-dev-portfolio',
        event_type: 'page_view',
      },
    });
    await refresh();
  } catch (err) {
    console.error('Failed to send test beacon:', err);
  } finally {
    sendingTestHit.value = false;
  }
};

useHead({
  title: 'Portfolio Analytics | Dashboard Admin',
});
</script>

<template>
  <div class="p-6 sm:p-8 space-y-8">
    <!-- Header with Live Controls -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">Analytics</h1>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Telemetry</span>
          </span>
        </div>
        <p class="text-sm text-zinc-400 mt-1">Real-time visitor traffic, device breakdowns, and page engagement.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Refresh Button -->
        <button
          @click="() => refresh()"
          :disabled="pending"
          class="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh Analytics Data"
        >
          <Icon name="carbon:renew" size="16" :class="{ 'animate-spin': pending }" />
        </button>

        <!-- Time Range Selector -->
        <div class="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            v-for="rangeOpt in [
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: '90days', label: '90 Days' },
              { id: 'all', label: 'All' },
            ]"
            :key="rangeOpt.id"
            @click="timeRange = rangeOpt.id as any"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            :class="timeRange === rangeOpt.id ? 'bg-white text-black font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'"
          >
            {{ rangeOpt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 4 Key Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div
        v-for="stat in statsCards"
        :key="stat.label"
        class="rounded-2xl bg-[#141417] border border-white/10 p-5 sm:p-6 transition-all relative overflow-hidden group hover:border-white/20"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
            <Icon :name="stat.icon" size="20" />
          </div>

          <span
            v-if="stat.change"
            :class="[
              'px-2 py-0.5 rounded-full text-xs font-mono font-semibold border flex items-center gap-1',
              stat.isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            ]"
          >
            <Icon :name="stat.isPositive ? 'carbon:arrow-up' : 'carbon:arrow-down'" size="10" />
            <span>{{ stat.change }}</span>
          </span>
        </div>

        <p class="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">{{ stat.value }}</p>
        <p class="text-xs text-zinc-400 mt-1 font-medium">{{ stat.label }}</p>
        <p v-if="stat.subLabel" class="text-[10px] text-zinc-500 font-mono mt-0.5">{{ stat.subLabel }}</p>
      </div>
    </div>

    <!-- Main Chart Section: Traffic Overview & Top Referrers -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      <!-- Interactive SVG Chart (Left 8 Cols) -->
      <div class="lg:col-span-8 rounded-2xl bg-[#141417] border border-white/10 p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">Traffic Volume Over Time</h2>
            <p class="text-xs text-zinc-400">Continuous daily timeline of page views and unique visitors.</p>
          </div>

          <!-- Chart Controls: Mode & Legend -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-3 text-xs font-mono">
              <span class="flex items-center gap-1.5 text-zinc-300">
                <span class="w-2.5 h-2.5 rounded-full bg-white shadow-sm"></span>
                <span>Views</span>
              </span>
              <span class="flex items-center gap-1.5 text-zinc-400">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Visitors</span>
              </span>
            </div>

            <div class="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10">
              <button
                @click="chartMode = 'area'"
                class="px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                :class="chartMode === 'area' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'"
                title="Area Smooth Curve"
              >
                Area
              </button>
              <button
                @click="chartMode = 'bar'"
                class="px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                :class="chartMode === 'bar' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'"
                title="Bar Chart"
              >
                Bar
              </button>
            </div>
          </div>
        </div>

        <!-- SVG Curve Display -->
        <div class="relative w-full overflow-hidden select-none" style="min-height: 240px;">
          <!-- Empty notice if no data -->
          <div
            v-if="summary.pageViews === 0"
            class="h-60 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl"
          >
            <Icon name="carbon:chart-line-smooth" size="32" class="text-zinc-500 mb-2" />
            <p class="text-sm font-semibold text-white">No Traffic Recorded Yet</p>
            <p class="text-xs text-zinc-400 max-w-sm mt-1">
              Visits to your public portfolio pages will automatically appear here in realtime.
            </p>
            <button
              @click="triggerTestBeacon"
              :disabled="sendingTestHit"
              class="mt-4 px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Icon v-if="sendingTestHit" name="carbon:renew" size="13" class="animate-spin" />
              <span>Send Sample Visitor Beacon</span>
            </button>
          </div>

          <!-- SVG Visualizer -->
          <div v-else class="space-y-3">
            <!-- Active Date & Metric Inspector Bar (Always accessible on mobile tap/scrub & desktop hover) -->
            <div
              v-if="activeDisplayPoint"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/10 transition-colors"
            >
              <div class="flex items-center gap-2 text-xs font-mono">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-white font-semibold">
                  {{ activeDisplayPoint.item.displayDate }} ({{ activeDisplayPoint.item.day }})
                </span>
                <span
                  v-if="activeDisplayPoint.index === trafficData.length - 1"
                  class="text-[10px] text-zinc-400 font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded"
                >
                  Latest
                </span>
                <span v-else class="text-[10px] text-zinc-500 font-mono">
                  Selected
                </span>
              </div>

              <div class="flex items-center gap-4 text-xs font-mono">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></span>
                  <span class="text-zinc-400">Views:</span>
                  <span class="text-white font-bold text-sm">{{ activeDisplayPoint.item.views.toLocaleString() }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs"></span>
                  <span class="text-zinc-400">Visitors:</span>
                  <span class="text-emerald-400 font-bold text-sm">{{ activeDisplayPoint.item.visitors.toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <div class="relative">
              <!-- Floating Tooltip Popup (Desktop / Hover) -->
              <div
                v-if="isHoveringChart && activeDisplayPoint"
                class="absolute z-20 pointer-events-none p-2.5 rounded-xl bg-zinc-950/95 border border-white/20 shadow-2xl text-xs font-mono transition-all duration-75 backdrop-blur-md hidden sm:block"
                :class="[
                  activeDisplayPoint.xPercent < 20
                    ? 'translate-x-0'
                    : activeDisplayPoint.xPercent > 80
                      ? '-translate-x-full'
                      : '-translate-x-1/2',
                  activeDisplayPoint.yPercent < 25 ? 'translate-y-2' : '-translate-y-full'
                ]"
                :style="{
                  left: `${activeDisplayPoint.xPercent}%`,
                  top: activeDisplayPoint.yPercent < 25 ? `${activeDisplayPoint.yPercent}%` : `${activeDisplayPoint.yPercent - 3}%`
                }"
              >
                <p class="font-bold text-white border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between gap-3">
                  <span>{{ activeDisplayPoint.item.displayDate }}</span>
                  <span class="text-zinc-500 text-[10px] font-normal uppercase">({{ activeDisplayPoint.item.day }})</span>
                </p>
                <p class="text-white flex items-center justify-between gap-4">
                  <span class="text-zinc-400 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-white"></span>
                    <span>Views:</span>
                  </span>
                  <span class="font-bold">{{ activeDisplayPoint.item.views.toLocaleString() }}</span>
                </p>
                <p class="text-emerald-400 flex items-center justify-between gap-4 mt-0.5">
                  <span class="text-zinc-400 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Visitors:</span>
                  </span>
                  <span class="font-bold">{{ activeDisplayPoint.item.visitors.toLocaleString() }}</span>
                </p>
              </div>

              <!-- SVG Container with Touch & Mouse support -->
              <svg
                :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
                class="w-full h-60 overflow-visible touch-pan-y cursor-crosshair"
                preserveAspectRatio="none"
                @mousemove="handleChartMouseMove"
                @mouseleave="handleChartMouseLeave"
                @touchstart.passive="handleChartTouchStart"
                @touchmove.passive="handleChartTouchMove"
                @touchend="handleChartTouchEnd"
              >
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
                  </linearGradient>
                </defs>

                <!-- Horizontal Grid Lines -->
                <line
                  v-for="yRatio in [0.25, 0.5, 0.75, 1.0]"
                  :key="yRatio"
                  :x1="paddingX"
                  :y1="chartHeight - paddingY - (chartHeight - paddingY * 2) * yRatio"
                  :x2="chartWidth - paddingX"
                  :y2="chartHeight - paddingY - (chartHeight - paddingY * 2) * yRatio"
                  stroke="rgba(255, 255, 255, 0.06)"
                  stroke-dasharray="3 3"
                />

                <!-- Area Mode -->
                <template v-if="chartMode === 'area'">
                  <!-- Area Fill -->
                  <path :d="svgAreaPath" fill="url(#trafficGradient)" />

                  <!-- Visitors Line (Green) -->
                  <path
                    :d="svgVisitorsLinePath"
                    fill="none"
                    stroke="#34d399"
                    stroke-width="1.75"
                    stroke-linecap="round"
                  />

                  <!-- Views Line (White) -->
                  <path
                    :d="svgLinePath"
                    fill="none"
                    stroke="#ffffff"
                    stroke-width="2.5"
                    stroke-linecap="round"
                  />

                  <!-- Data Dots -->
                  <circle
                    v-for="(pt, idx) in points.views"
                    :key="'view-' + idx"
                    :cx="pt.x"
                    :cy="pt.y"
                    r="3.5"
                    fill="#ffffff"
                    class="transition-all"
                    :class="{ 'r-5 stroke-2 stroke-black': activeIndex === idx }"
                  />

                  <!-- Active vertical guideline -->
                  <line
                    v-if="activeDisplayPoint"
                    :x1="activeDisplayPoint.viewPt.x"
                    :y1="paddingY"
                    :x2="activeDisplayPoint.viewPt.x"
                    :y2="chartHeight - paddingY"
                    stroke="rgba(255, 255, 255, 0.45)"
                    stroke-dasharray="4 4"
                  />
                </template>

                <!-- Bar Mode -->
                <template v-else>
                  <g v-for="(pt, idx) in points.views" :key="'bar-' + idx">
                    <!-- Views Bar -->
                    <rect
                      :x="pt.x - 5"
                      :y="pt.y"
                      width="10"
                      :height="chartHeight - paddingY - pt.y"
                      fill="#ffffff"
                      rx="2"
                      :opacity="activeIndex === idx ? 1 : 0.75"
                    />
                    <!-- Visitors Bar -->
                    <rect
                      :x="pt.x + 6"
                      :y="points.visitors[idx]?.y || (chartHeight - paddingY)"
                      width="6"
                      :height="chartHeight - paddingY - (points.visitors[idx]?.y || (chartHeight - paddingY))"
                      fill="#34d399"
                      rx="1.5"
                      :opacity="activeIndex === idx ? 1 : 0.7"
                    />
                  </g>
                </template>

                <!-- Invisible full-height touch targets per data point for effortless tap on mobile -->
                <g class="interactive-touch-targets">
                  <rect
                    v-for="(pt, idx) in points.views"
                    :key="'touch-' + idx"
                    :x="pt.x - stepWidth / 2"
                    y="0"
                    :width="stepWidth"
                    :height="chartHeight"
                    fill="transparent"
                    class="cursor-pointer"
                    @click="selectPoint(idx)"
                  />
                </g>
              </svg>

              <!-- X-Axis Labels -->
              <div class="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 px-2 border-t border-white/5">
                <span>{{ trafficData[0]?.displayDate || '-' }}</span>
                <span class="hidden sm:inline">{{ trafficData[Math.floor(trafficData.length / 2)]?.displayDate || '' }}</span>
                <span>{{ trafficData[trafficData.length - 1]?.displayDate || '-' }}</span>
              </div>

              <!-- Mobile Interaction Hint -->
              <div class="sm:hidden pt-2 flex items-center justify-center gap-1.5 text-[10px] font-mono text-zinc-500">
                <Icon name="carbon:touch-1" size="12" class="text-zinc-400" />
                <span>Tap or scrub across chart to inspect daily views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Traffic Sources / Top Referrers (Right 4 Cols) -->
      <div class="lg:col-span-4 rounded-2xl bg-[#141417] border border-white/10 p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">Traffic Referrers</h2>
          <p class="text-xs text-zinc-400">Inbound source platforms and sites.</p>
        </div>

        <div v-if="!topReferrers.length" class="text-center py-8 text-xs text-zinc-500">
          No external referral records yet.
        </div>

        <div v-else class="space-y-3.5 flex-1 flex flex-col justify-center">
          <div v-for="refItem in topReferrers" :key="refItem.source" class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-white flex items-center gap-1.5">
                <Icon
                  :name="refItem.source.includes('Google') ? 'carbon:logo-google' : refItem.source.includes('GitHub') ? 'line-md:github' : refItem.source.includes('LinkedIn') ? 'carbon:logo-linkedin' : refItem.source.includes('Twitter') ? 'carbon:logo-twitter' : 'carbon:link'"
                  size="14"
                  class="text-zinc-400"
                />
                <span>{{ refItem.source }}</span>
              </span>
              <span class="font-mono text-zinc-400">{{ refItem.visits }} visits ({{ refItem.percentage }}%)</span>
            </div>
            <div class="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                class="h-full bg-white rounded-full transition-all duration-500"
                :style="{ width: `${refItem.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
          <span>Self-referrals filtered</span>
          <span>100% Privacy-Preserved</span>
        </div>
      </div>

    </div>

    <!-- Bottom Section: Top Pages & Device/OS Distribution -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      <!-- Top Pages Table (Left 7 Cols) -->
      <div class="lg:col-span-7 rounded-2xl bg-[#141417] border border-white/10 p-5 sm:p-6 space-y-4">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">Most Visited Pages</h2>
          <p class="text-xs text-zinc-400">Top content viewed by audience in selected period.</p>
        </div>

        <div v-if="!topPages.length" class="text-center py-8 text-xs text-zinc-500">
          No page view data recorded yet.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs font-sans">
            <thead>
              <tr class="border-b border-white/10 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <th class="pb-2 font-normal">Page</th>
                <th class="pb-2 font-normal text-right">Views</th>
                <th class="pb-2 font-normal text-right">Visitors</th>
                <th class="pb-2 font-normal text-right">Share</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="page in topPages" :key="page.path" class="group hover:bg-white/[0.02] transition-colors">
                <td class="py-2.5 pr-2">
                  <p class="font-semibold text-white group-hover:text-zinc-200 transition-colors truncate max-w-xs">{{ page.title }}</p>
                  <p class="text-[11px] font-mono text-zinc-500 truncate">{{ page.path }}</p>
                </td>
                <td class="py-2.5 text-right font-mono text-white font-medium">{{ page.views.toLocaleString() }}</td>
                <td class="py-2.5 text-right font-mono text-zinc-400">{{ page.visitors.toLocaleString() }}</td>
                <td class="py-2.5 text-right font-mono text-zinc-300">
                  <div class="flex items-center justify-end gap-2">
                    <span>{{ page.percentage }}%</span>
                    <div class="w-12 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div class="h-full bg-white rounded-full" :style="{ width: `${page.percentage}%` }"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Device & OS Distribution (Right 5 Cols) -->
      <div class="lg:col-span-5 rounded-2xl bg-[#141417] border border-white/10 p-5 sm:p-6 space-y-6 flex flex-col justify-between">
        
        <!-- Device Category Breakdown -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono">Device Types</h3>
            <Icon name="carbon:devices" size="14" class="text-zinc-400" />
          </div>

          <div v-if="!deviceBreakdown.length" class="text-xs text-zinc-500 py-2">
            No device telemetry yet.
          </div>

          <div v-else class="space-y-2.5">
            <div v-for="dev in deviceBreakdown" :key="dev.device" class="space-y-1">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-zinc-300 capitalize flex items-center gap-1.5">
                  <Icon
                    :name="dev.device === 'mobile' ? 'carbon:mobile' : dev.device === 'tablet' ? 'carbon:tablet' : 'carbon:laptop'"
                    size="13"
                    class="text-zinc-400"
                  />
                  <span>{{ dev.device }}</span>
                </span>
                <span class="text-white font-semibold">{{ dev.count }} ({{ dev.percentage }}%)</span>
              </div>
              <div class="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div class="h-full bg-white rounded-full" :style="{ width: `${dev.percentage}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Operating System Breakdown -->
        <div class="space-y-3 pt-4 border-t border-white/10">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono">Operating Systems</h3>
            <Icon name="carbon:application" size="14" class="text-zinc-400" />
          </div>

          <div v-if="!osBreakdown.length" class="text-xs text-zinc-500 py-2">
            No OS telemetry yet.
          </div>

          <div v-else class="grid grid-cols-2 gap-2">
            <div
              v-for="os in osBreakdown"
              :key="os.os"
              class="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <Icon
                  :name="os.os === 'macOS' || os.os === 'iOS' ? 'carbon:apple' : os.os === 'Android' ? 'carbon:logo-android' : os.os === 'Windows' ? 'carbon:logo-windows' : 'carbon:terminal'"
                  size="15"
                  class="text-zinc-400"
                />
                <span class="text-xs font-semibold text-white">{{ os.os }}</span>
              </div>
              <span class="text-xs font-mono text-zinc-400">{{ os.percentage }}%</span>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
