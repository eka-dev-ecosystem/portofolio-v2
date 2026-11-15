<template>
  <div v-if="app" class="relative max-w-5xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
    <!-- Top Breadcrumb Navigation -->
    <nav aria-label="Breadcrumb" class="flex items-center justify-between pb-4 border-b border-white/10">
      <ol class="flex items-center gap-2 text-xs font-mono text-zinc-400">
        <li>
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
        </li>
        <li class="text-zinc-600">/</li>
        <li>
          <NuxtLink to="/apps" class="hover:text-white transition-colors">Apps</NuxtLink>
        </li>
        <li class="text-zinc-600">/</li>
        <li class="text-white font-medium truncate max-w-[180px] sm:max-w-none">
          {{ app.app_name }}
        </li>
      </ol>

      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-mono text-zinc-400">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Verified Binary</span>
      </div>
    </nav>

    <!-- App Hero Section -->
    <div class="relative overflow-hidden rounded-3xl bg-[#141417]/80 border border-white/10 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      <div class="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
        <!-- Icon & Meta Details -->
        <div class="flex items-start sm:items-center gap-5 sm:gap-6 min-w-0">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-900 border border-white/15 p-2 flex items-center justify-center shrink-0 shadow-xl relative overflow-hidden group">
            <img
              v-if="app.icon_url"
              :src="app.icon_url"
              :alt="`${app.app_name} logo`"
              class="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
            />
            <Icon v-else name="carbon:application-mobile" size="36" class="text-zinc-400" />
          </div>

          <div class="space-y-2 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {{ app.app_name }}
              </h1>
              <span
                :class="[
                  'text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5',
                  (app.status || 'development') === 'production'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    (app.status || 'development') === 'production' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  ]"
                />
                {{ (app.status || 'development') === 'production' ? 'Full Release' : 'Development' }}
              </span>
            </div>

            <p v-if="app.tagline" class="text-sm sm:text-base text-zinc-300 font-medium leading-snug">
              {{ app.tagline }}
            </p>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-zinc-400 pt-1">
              <div class="flex items-center gap-1.5">
                <Icon name="carbon:version" size="14" class="text-zinc-500" />
                <span>v{{ app.latest_version_name || '1.0.0' }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Icon name="carbon:download" size="14" class="text-zinc-500" />
                <span>{{ app.download_count || 0 }} downloads</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Icon name="carbon:user" size="14" class="text-zinc-500" />
                <span>By Eka Syafrino</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Primary CTA Buttons -->
        <div class="flex flex-col sm:flex-row md:flex-col items-stretch gap-2.5 w-full md:w-auto shrink-0">
          <!-- Primary Smart OS Download Button -->
          <a
            v-if="recommendedDownload"
            :href="recommendedDownload.url"
            class="px-6 py-3.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold text-sm shadow-xl transition-all flex items-center justify-center gap-2.5 text-center group cursor-pointer"
          >
            <PlatformIcon :platform="recommendedDownload.platform" class="w-5 h-5 shrink-0" />
            <span>Download for {{ recommendedDownload.platformLabel }}</span>
            <span class="text-xs font-mono font-normal opacity-70">({{ formatFileSize(recommendedDownload.fileSize) }})</span>
            <Icon name="carbon:download" size="16" class="transition-transform group-hover:translate-y-0.5" />
          </a>

          <!-- QR Code Trigger -->
          <button
            @click="showQrModal = true"
            class="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Icon name="carbon:qr-code" size="15" />
            <span>Install via Mobile QR</span>
          </button>
        </div>
      </div>

      <!-- Supported Platforms Bar -->
      <div class="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider">Supported OS:</span>
          <div class="flex items-center gap-1.5">
            <span
              v-for="plat in (app.supported_platforms || [])"
              :key="plat"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono text-zinc-200"
            >
              <PlatformIcon :platform="plat" class="w-3.5 h-3.5" />
              <span>{{ getPlatformLabel(plat) }}</span>
            </span>
          </div>
        </div>

        <!-- Official Store Badges if available -->
        <div class="flex flex-wrap items-center gap-2">
          <a
            v-if="app.play_store_url"
            :href="app.play_store_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <Icon name="carbon:logo-google" size="14" class="text-emerald-400" />
            <span>Google Play</span>
          </a>
          <a
            v-if="app.app_store_url"
            :href="app.app_store_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <Icon name="carbon:logo-apple" size="14" class="text-white" />
            <span>App Store</span>
          </a>
          <a
            v-if="app.testflight_url"
            :href="app.testflight_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <Icon name="carbon:badge" size="14" class="text-sky-400" />
            <span>Apple TestFlight</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
      <!-- Left Column: Rich Overview & Features (2 Cols) -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Overview & Markdown Description -->
        <section class="rounded-3xl bg-[#141417]/80 border border-white/10 p-6 sm:p-8 space-y-4">
          <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
            <Icon name="carbon:document" size="14" />
            <span>About {{ app.app_name }}</span>
          </div>

          <div
            v-if="app.description"
            class="prose prose-invert prose-zinc max-w-none text-sm sm:text-base leading-relaxed text-zinc-300 space-y-4"
            v-html="renderMarkdown(app.description)"
          ></div>
          <p v-else class="text-sm text-zinc-400">
            No extended description available for this application yet.
          </p>
        </section>

        <!-- Quick Installation & Setup Guide -->
        <section class="rounded-3xl bg-[#141417]/80 border border-white/10 p-6 sm:p-8 space-y-4">
          <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
            <Icon name="carbon:terminal" size="14" />
            <span>Installation & Verification</span>
          </div>

          <div class="space-y-4 text-xs sm:text-sm text-zinc-300">
            <!-- macOS Instructions -->
            <div v-if="(app.supported_platforms || []).includes('macos')" class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div class="flex items-center gap-2 font-semibold text-white font-mono">
                <PlatformIcon platform="macos" class="w-4 h-4" />
                <span>macOS Installation (DMG / ZIP)</span>
              </div>
              <p class="text-zinc-400">
                1. Download the <strong>.dmg</strong> or <strong>.zip</strong> package.<br />
                2. Open the DMG and drag <strong>{{ app.app_name }}</strong> into your <strong>Applications</strong> folder.<br />
                3. If macOS Gatekeeper alerts <em>"cannot be opened because it is from an unidentified developer"</em>, run this one-line command in Terminal:
              </p>
              <div class="p-2.5 rounded-xl bg-zinc-900 border border-white/10 font-mono text-[11px] text-emerald-400 flex items-center justify-between">
                <code>{{ macGatekeeperCommand }}</code>
                <button
                  @click="copyCommand(macGatekeeperCommand)"
                  class="p-1 hover:text-white transition-colors cursor-pointer"
                  title="Copy command"
                >
                  <Icon :name="copiedCommand ? 'carbon:checkmark' : 'carbon:copy'" size="14" />
                </button>
              </div>
            </div>

            <!-- Windows Instructions -->
            <div v-if="(app.supported_platforms || []).includes('windows')" class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div class="flex items-center gap-2 font-semibold text-white font-mono">
                <PlatformIcon platform="windows" class="w-4 h-4" />
                <span>Windows Installation (EXE / ZIP)</span>
              </div>
              <p class="text-zinc-400">
                1. Download the standalone <strong>.exe</strong> or portable <strong>.zip</strong>.<br />
                2. If Microsoft Defender SmartScreen prompts a notice, click <strong>"More info"</strong> and then <strong>"Run anyway"</strong>.<br />
                3. The app is completely portable and requires no administrative privileges.
              </p>
            </div>

            <!-- Android Instructions -->
            <div v-if="(app.supported_platforms || []).includes('android')" class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div class="flex items-center gap-2 font-semibold text-white font-mono">
                <PlatformIcon platform="android" class="w-4 h-4" />
                <span>Android Installation (APK)</span>
              </div>
              <p class="text-zinc-400">
                1. Download the official <strong>.apk</strong> directly on your mobile device.<br />
                2. Open the file from your notification panel or Downloads folder.<br />
                3. Allow <em>"Install unknown apps"</em> for your browser if prompted.
              </p>
            </div>
          </div>
        </section>

        <!-- Release History & Changelogs -->
        <section class="rounded-3xl bg-[#141417]/80 border border-white/10 p-6 sm:p-8 space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
              <Icon name="carbon:data-table" size="14" />
              <span>Release History & Binaries</span>
            </div>
            <span class="text-xs font-mono text-zinc-500">{{ releases.length }} build(s)</span>
          </div>

          <div class="space-y-4">
            <div
              v-for="rel in releases"
              :key="rel.id"
              class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3"
            >
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                <div class="flex items-center gap-2.5">
                  <PlatformIcon :platform="rel.platform" class="w-4 h-4 text-zinc-400" />
                  <span class="text-sm font-bold text-white font-mono">v{{ rel.version_name }}</span>
                  <span class="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300">
                    {{ rel.original_filename || rel.platform }}
                  </span>
                </div>

                <div class="flex items-center gap-3 text-xs font-mono text-zinc-400">
                  <span>{{ formatFileSize(rel.file_size_bytes) }}</span>
                  <span v-if="rel.published_at">• {{ formatDate(rel.published_at) }}</span>
                </div>
              </div>

              <!-- Changelog Markdown -->
              <div
                v-if="rel.changelog"
                class="prose prose-invert prose-xs text-xs text-zinc-300 line-clamp-4"
                v-html="renderMarkdown(rel.changelog)"
              ></div>

              <!-- Checksum & Action -->
              <div class="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] font-mono">
                <div v-if="rel.sha256_hash" class="text-zinc-500 truncate max-w-xs" :title="rel.sha256_hash">
                  SHA-256: <span class="text-zinc-400">{{ rel.sha256_hash.slice(0, 16) }}...</span>
                </div>
                <div v-else class="text-zinc-600">SHA-256 verified build</div>

                <a
                  :href="`/api/v1/apps/${app.package_name}/download?platform=${rel.platform}`"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white transition-colors cursor-pointer"
                >
                  <Icon name="carbon:download" size="13" />
                  <span>Download {{ rel.original_filename || getPlatformLabel(rel.platform) }}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column: Sidebar & All Downloads (1 Col) -->
      <div class="space-y-6">
        <!-- Direct Downloads Card -->
        <div class="rounded-3xl bg-[#141417]/80 border border-white/10 p-6 space-y-4">
          <h3 class="text-sm font-semibold text-white font-mono uppercase tracking-wider">
            All Platform Downloads
          </h3>

          <div class="space-y-2">
            <a
              v-for="plat in (app.supported_platforms || [])"
              :key="plat"
              :href="`/api/v1/apps/${app.package_name}/download?platform=${plat}`"
              class="w-full px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-zinc-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
            >
              <div class="flex items-center gap-2.5">
                <PlatformIcon :platform="plat" class="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span>{{ getPlatformLabel(plat) }}</span>
              </div>
              <Icon name="carbon:download" size="15" class="text-zinc-500 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
            </a>
          </div>
        </div>

        <!-- Application Metadata Card -->
        <div class="rounded-3xl bg-[#141417]/80 border border-white/10 p-6 space-y-3.5 text-xs font-mono">
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider pb-2 border-b border-white/10">
            Technical Specs
          </h3>

          <div class="flex items-center justify-between">
            <span class="text-zinc-500">Package Identifier</span>
            <span class="text-white truncate max-w-[170px]" :title="app.package_name">{{ app.package_name }}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-zinc-500">Latest Version</span>
            <span class="text-white font-bold">v{{ app.latest_version_name || '1.0.0' }}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-zinc-500">License</span>
            <span class="text-emerald-400 font-bold">MIT / Freeware</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-zinc-500">Developer</span>
            <span class="text-white">Moh. Eka Syafrino</span>
          </div>

          <div v-if="app.repo_slug" class="flex items-center justify-between pt-2 border-t border-white/10">
            <span class="text-zinc-500">Source Repository</span>
            <a
              :href="`https://github.com/${app.repo_slug}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Icon name="carbon:logo-github" size="13" />
              <span>GitHub</span>
            </a>
          </div>
        </div>

        <!-- Share & Link Card -->
        <div class="rounded-3xl bg-[#141417]/80 border border-white/10 p-6 space-y-3">
          <h3 class="text-sm font-semibold text-white font-mono uppercase tracking-wider">
            Share App
          </h3>
          <p class="text-xs text-zinc-400">
            Share direct install link with friends or colleagues:
          </p>
          <div class="flex items-center gap-2">
            <input
              type="text"
              readonly
              :value="canonicalUrl"
              class="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-zinc-300 truncate focus:outline-none"
            />
            <button
              @click="copyUrl"
              class="px-3 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            >
              {{ copiedShare ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div
      v-if="showQrModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      @click.self="showQrModal = false"
    >
      <div class="bg-[#141417] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-center space-y-4">
        <button
          @click="showQrModal = false"
          class="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Icon name="carbon:close" size="18" />
        </button>

        <h3 class="text-lg font-bold text-white">Scan to Download</h3>
        <p class="text-xs text-zinc-400">
          Point your mobile phone camera at this QR code to download {{ app.app_name }} immediately.
        </p>

        <div class="bg-white p-4 rounded-2xl inline-block shadow-inner">
          <img
            :src="qrCodeUrl"
            :alt="`QR Code for ${app.app_name}`"
            class="w-48 h-48 block"
          />
        </div>

        <div class="pt-2">
          <button
            @click="showQrModal = false"
            class="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const slugParam = computed(() => route.params.slug as string);

// Fetch app details with releases from SSR endpoint
const { data: response, error } = await useFetch<any>(`/api/v1/apps/${slugParam.value}`);

if (error.value || !response.value?.data) {
  throw createError({
    statusCode: 404,
    statusMessage: `Application "${slugParam.value}" was not found.`,
    fatal: true,
  });
}

const app = computed(() => response.value?.data);
const releases = computed(() => app.value?.releases || []);

const { renderMarkdown } = useMarkdown();

// OS Detection for Smart CTA
const clientOs = ref<"macos" | "windows" | "android" | "linux">("macos");

onMounted(() => {
  if (import.meta.client) {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) {
      clientOs.value = "android";
    } else if (ua.includes("win")) {
      clientOs.value = "windows";
    } else if (ua.includes("mac")) {
      clientOs.value = "macos";
    } else if (ua.includes("linux")) {
      clientOs.value = "linux";
    }
  }
});

const getPlatformLabel = (plat?: string) => {
  switch (plat?.toLowerCase()) {
    case "android":
      return "Android";
    case "ios":
      return "iOS";
    case "macos":
      return "macOS";
    case "windows":
      return "Windows";
    case "linux":
      return "Linux";
    default:
      return plat || "Platform";
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Recommended Download Logic based on user OS
const recommendedDownload = computed(() => {
  if (!app.value) return null;
  const platforms: string[] = app.value.supported_platforms || [];

  // 1. Try matching user client OS
  let targetPlatform = platforms.find((p) => p.toLowerCase() === clientOs.value);

  // 2. Fallback to first supported platform
  if (!targetPlatform && platforms.length > 0) {
    targetPlatform = platforms[0];
  }

  if (!targetPlatform) return null;

  // Find latest release for this platform
  const matchingRelease = releases.value.find((r: any) => r.platform === targetPlatform) || releases.value[0];

  return {
    platform: targetPlatform,
    platformLabel: getPlatformLabel(targetPlatform),
    url: `/api/v1/apps/${app.value.package_name}/download?platform=${targetPlatform}`,
    fileSize: matchingRelease?.file_size_bytes || 0,
    fileName: matchingRelease?.original_filename,
  };
});

const canonicalUrl = computed(() => `https://eka-dev.cloud/apps/${app.value?.slug || app.value?.package_name}`);
const downloadUrl = computed(() => `https://eka-dev.cloud/api/v1/apps/${app.value?.package_name}/download`);
const qrCodeUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(downloadUrl.value)}`);
const macGatekeeperCommand = computed(() => `xattr -cr /Applications/"${app.value?.app_name || 'App'}.app"`);

// Copy Share Link
const copiedShare = ref(false);
const copyUrl = () => {
  if (import.meta.client) {
    navigator.clipboard.writeText(canonicalUrl.value);
    copiedShare.value = true;
    setTimeout(() => {
      copiedShare.value = false;
    }, 2000);
  }
};

// Copy Terminal Command
const copiedCommand = ref(false);
const copyCommand = (cmd: string) => {
  if (import.meta.client) {
    navigator.clipboard.writeText(cmd);
    copiedCommand.value = true;
    setTimeout(() => {
      copiedCommand.value = false;
    }, 2000);
  }
};

const showQrModal = ref(false);

// SEO Structured Data (JSON-LD) and Meta Tags
const pageTitle = computed(() => {
  const name = app.value?.app_name || "Application";
  const tag = app.value?.tagline ? ` - ${app.value.tagline}` : "";
  return `${name}${tag} | Eka Syafrino`;
});

const pageDesc = computed(() => {
  if (app.value?.tagline) return app.value.tagline;
  if (app.value?.description) {
    return app.value.description.replace(/[#*`_\[\]()]/g, "").slice(0, 160) + "...";
  }
  return `Download ${app.value?.app_name || 'Application'} for ${((app.value?.supported_platforms || []).map(getPlatformLabel)).join(', ')}. Official verified releases and install guides by Eka Syafrino.`;
});

const ogImage = computed(() => {
  if (app.value?.icon_url?.startsWith("http")) return app.value.icon_url;
  if (app.value?.icon_url) return `https://eka-dev.cloud${app.value.icon_url}`;
  return "https://eka-dev.cloud/images/og-apps.png";
});

const getAppCategory = (pkg?: string) => {
  const p = (pkg || "").toLowerCase();
  if (p.includes("winmix") || p.includes("audio")) return "MultimediaApplication";
  if (p.includes("walpaper") || p.includes("wallpaper")) return "PersonalizationApplication";
  if (p.includes("tracker") || p.includes("finance")) return "FinanceApplication";
  if (p.includes("task")) return "ProductivityApplication";
  if (p.includes("chat")) return "CommunicationApplication";
  return "SoftwareApplication";
};

useHead(() => ({
  title: pageTitle.value,
  link: [
    {
      rel: "canonical",
      href: canonicalUrl.value,
    },
  ],
  meta: [
    {
      name: "description",
      content: pageDesc.value,
    },
    {
      name: "keywords",
      content: `${app.value?.app_name}, ${app.value?.app_name} download, ${app.value?.app_name} ${((app.value?.supported_platforms || []).join(' '))}, ${app.value?.tagline || ''}, Eka Syafrino Apps, open source binary`,
    },
    {
      name: "robots",
      content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    // Open Graph
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:site_name",
      content: "Eka Syafrino Apps Hub",
    },
    {
      property: "og:url",
      content: canonicalUrl.value,
    },
    {
      property: "og:title",
      content: pageTitle.value,
    },
    {
      property: "og:description",
      content: pageDesc.value,
    },
    {
      property: "og:image",
      content: ogImage.value,
    },
    {
      property: "og:image:alt",
      content: `${app.value?.app_name} preview`,
    },
    // Twitter Card
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:site",
      content: "@ESyafrino",
    },
    {
      name: "twitter:creator",
      content: "@ESyafrino",
    },
    {
      name: "twitter:title",
      content: pageTitle.value,
    },
    {
      name: "twitter:description",
      content: pageDesc.value,
    },
    {
      name: "twitter:image",
      content: ogImage.value,
    },
  ],
  script: [
    // Schema.org SoftwareApplication
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: app.value?.app_name,
        headline: app.value?.tagline,
        description: pageDesc.value,
        image: ogImage.value,
        applicationCategory: getAppCategory(app.value?.package_name),
        operatingSystem: (app.value?.supported_platforms || []).map(getPlatformLabel).join(", "),
        softwareVersion: app.value?.latest_version_name || "1.0.0",
        downloadUrl: downloadUrl.value,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "Moh. Eka Syafrino",
          url: "https://eka-dev.cloud",
        },
      }),
    },
    // Schema.org BreadcrumbList
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://eka-dev.cloud",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Apps",
            item: "https://eka-dev.cloud/apps",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: app.value?.app_name,
            item: canonicalUrl.value,
          },
        ],
      }),
    },
  ],
}));
</script>
