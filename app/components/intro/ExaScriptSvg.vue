<template>
  <div class="relative w-full max-w-xl mx-auto flex items-center justify-center select-none px-4">
    <!-- Ambient Behind-Text Subtle Apple Radial Glow -->
    <div
      class="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.18)_0%,_rgba(168,85,247,0.08)_40%,_transparent_70%)] blur-3xl pointer-events-none transition-opacity duration-1000"
      :class="isCompleted ? 'opacity-90' : 'opacity-40'"
    />

    <svg
      viewBox="-120 -40 2560 820"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="w-full h-auto overflow-visible relative z-10"
      aria-label="Apple Cursive Intro"
    >
      <defs>
        <!-- Apple Specular Shimmer Gradient -->
        <linearGradient :id="`shimmer-grad-${uniqueId}`" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
          <stop offset="40%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="50%" stop-color="#ffffff" stop-opacity="1" />
          <stop offset="60%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.8" />
        </linearGradient>

        <!-- Drop Shadow Filter for Apple Neon Glow -->
        <filter :id="`glow-${uniqueId}`" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- PHASE 1: Official Apple "hello" Script (Macintosh / iOS) -->
      <g
        class="transition-opacity duration-700 ease-in-out"
        :class="phase === 'hello' ? 'opacity-100' : 'opacity-0 pointer-events-none'"
        transform="scale(1, -1) translate(0, -728)"
      >
        <!-- Soft Ambient Underglow -->
        <path
          :d="helloH"
          stroke="rgba(255, 255, 255, 0.2)"
          stroke-width="70"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          :d="helloEllo"
          stroke="rgba(255, 255, 255, 0.2)"
          stroke-width="70"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Primary Drawing Stroke -->
        <path
          ref="helloHRef"
          :d="helloH"
          stroke="#ffffff"
          stroke-width="58"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="helloHStrokeStyle"
        />
        <path
          ref="helloElloRef"
          :d="helloEllo"
          stroke="#ffffff"
          stroke-width="58"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="helloElloStrokeStyle"
        />
      </g>

      <!-- PHASE 2: Apple Signature Style "Exa" Cursive Script -->
      <g
        class="transition-opacity duration-700 ease-in-out"
        :class="phase === 'exa' ? 'opacity-100' : 'opacity-0 pointer-events-none'"
        transform="scale(1, -1) translate(0, -728)"
      >
        <!-- Soft Ambient Underglow -->
        <path
          :d="exaEx1"
          stroke="rgba(255, 255, 255, 0.25)"
          stroke-width="72"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          :d="exaXCross"
          stroke="rgba(255, 255, 255, 0.25)"
          stroke-width="72"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          :d="exaABowl"
          stroke="rgba(255, 255, 255, 0.25)"
          stroke-width="72"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          :d="exaAStem"
          stroke="rgba(255, 255, 255, 0.25)"
          stroke-width="72"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Primary Drawing Strokes -->
        <path
          ref="exaEx1Ref"
          :d="exaEx1"
          stroke="#ffffff"
          stroke-width="58"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="exaEx1StrokeStyle"
          :class="isCompleted ? 'shimmer-effect' : ''"
        />
        <path
          ref="exaXCrossRef"
          :d="exaXCross"
          stroke="#ffffff"
          stroke-width="58"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="exaXCrossStrokeStyle"
          :class="isCompleted ? 'shimmer-effect' : ''"
        />
        <path
          ref="exaABowlRef"
          :d="exaABowl"
          stroke="#ffffff"
          stroke-width="58"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="exaABowlStrokeStyle"
          :class="isCompleted ? 'shimmer-effect' : ''"
        />
        <path
          ref="exaAStemRef"
          :d="exaAStem"
          stroke="#ffffff"
          stroke-width="58"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="exaAStemStrokeStyle"
          :class="isCompleted ? 'shimmer-effect' : ''"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useId } from 'vue'

const props = defineProps<{
  phase: 'hello' | 'exa'
  isCompleted?: boolean
}>()

const uniqueId = useId()

// Official Apple "hello" SVG Paths (Extracted from Apple Official Figma / Macintosh asset)
const helloH = 'M-109.06069946289062,95.92639923095703 C1.9544999599456787,157.6403045654297 103.11389923095703,236.9969940185547 217.881103515625,372.07550048828125 C296,464.2846984863281 337.9999084472656,569.5725708007812 340,642.1939697265625 C341,696.1920166015625 314.6702880859375,737.156005859375 266,737.156005859375 C212,737.156005859375 178,696.1920166015625 157,602.1610107421875 C134,498.82000732421875 117,380.239990234375 74,0'
const helloEllo = 'M78.21453094482422,37.160953521728516 C100.22924041748047,230.68260192871094 184,372 291,372 C355,372 395.6745910644531,321 384.1253967285156,248 C377.6238098144531,205 370.0873107910156,161 361.3063049316406,110 C351.0714111328125,46 380.3254089355469,-4 468.96173095703125,-4 C598.2246704101562,-4 739.2435302734375,67.83381652832031 811.4124145507812,179.0941619873047 C836,217 846,251 847,284 C848,344 814,389 754,389 C678,389 620,303 620,193 C620,75 684,-8 819.9180908203125,-8 C1004.7244873046875,-8 1209.4246826171875,213.84754943847656 1303.4808349609375,461.42327880859375 C1330.037353515625,531.3258056640625 1340,596.2349243164062 1340,641.593994140625 C1340,695.3764038085938 1323,736.673583984375 1275,736.673583984375 C1228,736.673583984375 1197,700.1784057617188 1169,642.5543823242188 C1136.1939697265625,575.7216186523438 1111.927734375,479.32598876953125 1102,370.3599853515625 C1077,96.94000244140625 1133,-4 1266.152099609375,-4 C1427.6083984375,-4 1607.1151123046875,220.92921447753906 1698.771728515625,462.18878173828125 C1725.037353515625,531.3258056640625 1735,596.2349243164062 1735,641.593994140625 C1735,695.3764038085938 1718,736.673583984375 1670,736.673583984375 C1623,736.673583984375 1592,700.1784057617188 1564,642.5543823242188 C1531.1939697265625,575.7216186523438 1506.927734375,479.32598876953125 1497,370.3599853515625 C1472,96.94000244140625 1528,-4 1646.906005859375,-4 C1765.623779296875,-4 1830.114990234375,99.48485565185547 1868.77880859375,209.3712158203125 C1907,318 1954,385 2052,385 C2133,385 2197,325 2197,212 C2197,87 2115.90087890625,-7 2013.41845703125,-8 C1923.234130859375,-9 1864,64 1870,174 C1877,296 1951,385 2048,385 C2104,385 2151.03564453125,360.1071472167969 2188,333 C2288.21435546875,259.8928527832031 2365.4287109375,305.0714416503906 2395,377.3571472167969'

// Apple Signature Style "Exa" Paths
const exaEx1 = 'M380,710 C300,690 270,600 300,510 C330,430 410,400 490,400 C520,400 540,410 520,380 C480,320 350,330 320,210 C290,100 360,-5 500,-5 C620,-5 690,40 760,120 C810,180 860,290 890,360 C900,380 930,385 950,350 C980,300 1020,160 1040,80 C1050,30 1080,-5 1130,-5 C1200,-5 1250,40 1300,120'
const exaXCross = 'M1040,360 C990,270 930,130 870,-5'
const exaABowl = 'M1480,312 C1460,358 1418,388 1352,388 C1242,388 1160,278 1154,160 C1149,52 1199,-9 1270,-8 C1370,-7 1445,92 1478,301 C1482,327 1486,354 1490,380'
const exaAStem = 'M1490,380 C1486,354 1482,328 1478,301 C1460,187 1452,142 1453,112 C1455,43 1480,-4 1558,-4 C1670,-4 1750,120 1810,230 C1860,320 1910,360 1980,360 C2040,360 2090,320 2120,280'

const helloHRef = ref<SVGPathElement | null>(null)
const helloElloRef = ref<SVGPathElement | null>(null)
const exaEx1Ref = ref<SVGPathElement | null>(null)
const exaXCrossRef = ref<SVGPathElement | null>(null)
const exaABowlRef = ref<SVGPathElement | null>(null)
const exaAStemRef = ref<SVGPathElement | null>(null)

const lenHelloH = ref(1800)
const lenHelloEllo = ref(6800)
const lenExaEx1 = ref(2900)
const lenExaXCross = ref(500)
const lenExaABowl = ref(1200)
const lenExaAStem = ref(1400)

onMounted(() => {
  if (helloHRef.value) lenHelloH.value = Math.ceil(helloHRef.value.getTotalLength()) || 1800
  if (helloElloRef.value) lenHelloEllo.value = Math.ceil(helloElloRef.value.getTotalLength()) || 6800
  if (exaEx1Ref.value) lenExaEx1.value = Math.ceil(exaEx1Ref.value.getTotalLength()) || 2900
  if (exaXCrossRef.value) lenExaXCross.value = Math.ceil(exaXCrossRef.value.getTotalLength()) || 500
  if (exaABowlRef.value) lenExaABowl.value = Math.ceil(exaABowlRef.value.getTotalLength()) || 1200
  if (exaAStemRef.value) lenExaAStem.value = Math.ceil(exaAStemRef.value.getTotalLength()) || 1400
})

const helloHStrokeStyle = computed(() => {
  const len = lenHelloH.value
  return {
    strokeDasharray: `${len}`,
    strokeDashoffset: props.phase === 'hello' ? '0' : `${len}`,
    transition: 'stroke-dashoffset 0.85s cubic-bezier(0.4, 0, 0.2, 1)'
  }
})

const helloElloStrokeStyle = computed(() => {
  const len = lenHelloEllo.value
  return {
    strokeDasharray: `${len}`,
    strokeDashoffset: props.phase === 'hello' ? '0' : `${len}`,
    transition: 'stroke-dashoffset 1.35s cubic-bezier(0.4, 0, 0.2, 1) 0.15s'
  }
})

const exaEx1StrokeStyle = computed(() => {
  const len = lenExaEx1.value
  return {
    strokeDasharray: `${len}`,
    strokeDashoffset: props.phase === 'exa' ? '0' : `${len}`,
    transition: 'stroke-dashoffset 1.1s cubic-bezier(0.4, 0, 0.2, 1)'
  }
})

const exaXCrossStrokeStyle = computed(() => {
  const len = lenExaXCross.value
  return {
    strokeDasharray: `${len}`,
    strokeDashoffset: props.phase === 'exa' ? '0' : `${len}`,
    transition: 'stroke-dashoffset 0.45s cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
  }
})

const exaABowlStrokeStyle = computed(() => {
  const len = lenExaABowl.value
  return {
    strokeDasharray: `${len}`,
    strokeDashoffset: props.phase === 'exa' ? '0' : `${len}`,
    transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.5s'
  }
})

const exaAStemStrokeStyle = computed(() => {
  const len = lenExaAStem.value
  return {
    strokeDasharray: `${len}`,
    strokeDashoffset: props.phase === 'exa' ? '0' : `${len}`,
    transition: 'stroke-dashoffset 0.75s cubic-bezier(0.4, 0, 0.2, 1) 0.75s'
  }
})
</script>

<style scoped>
@keyframes specularSweep {
  0% {
    filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.7));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 32px rgba(129, 140, 248, 0.75));
  }
  100% {
    filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.7));
  }
}

.shimmer-effect {
  animation: specularSweep 2.2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  path {
    transition: none !important;
    stroke-dashoffset: 0 !important;
  }
  .shimmer-effect {
    animation: none !important;
  }
}
</style>
