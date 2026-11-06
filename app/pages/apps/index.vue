<template>
  <div class="relative max-w-5xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
    <!-- Top Sub-Navigation Bar / Breadcrumb -->
    <div class="flex items-center justify-between pb-4 border-b border-white/10">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
      >
        <Icon name="carbon:arrow-left" size="13" />
        <span>Back to Portfolio</span>
      </NuxtLink>

      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-mono text-zinc-400">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>GitHub Release Sync</span>
      </div>
    </div>

    <!-- Hero Section -->
    <div class="space-y-4 max-w-3xl">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-300">
        <Icon name="carbon:application-mobile" size="14" class="text-zinc-400" />
        <span>Cross-Platform Binary Distribution</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
        Personal Software & Applications
      </h1>
      <p class="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl font-normal">
        Curated collection of cross-platform applications built and maintained by me. Download official release binaries directly or install seamlessly via Google Play Store, Apple App Store, and TestFlight.
      </p>
    </div>

    <!-- Search & Filters Bar -->
    <div class="space-y-4 pb-2 border-b border-white/10">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <!-- Search Input -->
        <div class="relative w-full sm:w-80">
          <Icon name="carbon:search" size="14" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search apps, package name..."
            class="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141417]/80 border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors font-mono"
          />
        </div>

        <!-- Status Filter Pills -->
        <div class="flex items-center gap-1 p-1 rounded-full bg-[#141417]/80 border border-white/10 self-start sm:self-auto">
          <button
            @click="selectedStatusFilter = 'all'"
            :class="[
              'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
              selectedStatusFilter === 'all'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            ]"
          >
            All ({{ counts.all }})
          </button>
          <button
            @click="selectedStatusFilter = 'production'"
            :class="[
              'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer',
              selectedStatusFilter === 'production'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            ]"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Full Release ({{ counts.production }})</span>
          </button>
          <button
            @click="selectedStatusFilter = 'development'"
            :class="[
              'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer',
              selectedStatusFilter === 'development'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            ]"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Development ({{ counts.development }})</span>
          </button>
        </div>
      </div>

      <!-- Platform Filter Tabs & Counter -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div class="flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#141417]/80 border border-white/10">
          <button
            v-for="p in platformFilters"
            :key="p.id"
            @click="selectedPlatformFilter = p.id as any"
            :class="[
              'px-3.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer',
              selectedPlatformFilter === p.id
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            ]"
          >
            <PlatformIcon v-if="p.id !== 'all'" :platform="p.id" class="w-3.5 h-3.5 shrink-0" />
            <span>{{ p.label }}</span>
          </button>
        </div>

        <div class="text-xs font-mono text-zinc-400 flex items-center gap-2">
          <span>Showing {{ filteredApps.length }} of {{ apps.length }} apps</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="i in 4" :key="i" class="h-64 rounded-2xl bg-[#141417]/50 border border-white/5 animate-pulse"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredApps.length === 0" class="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-[#141417]/40">
      <div class="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-4 text-zinc-400">
        <Icon name="carbon:application-mobile" size="32" />
      </div>
      <h3 class="text-lg font-bold text-white mb-1">No Applications Found</h3>
      <p class="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
        {{ searchQuery ? 'No applications match your search query.' : 'Applications released on GitHub will automatically appear here once synchronized.' }}
      </p>
      <NuxtLink to="/dashboard/apps" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 text-xs font-mono transition-colors">
        <Icon name="carbon:settings" size="14" />
        <span>Manage Repositories in Dashboard</span>
      </NuxtLink>
    </div>

    <!-- Apps Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
      <div
        v-for="app in filteredApps"
        :key="app.id"
        class="rounded-2xl bg-[#141417]/80 border border-white/10 hover:border-white/25 p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-0.5"
      >
        <!-- Card Top: Icon & Basic Info -->
        <div class="space-y-4">
          <div class="flex items-start gap-4">
            <!-- App Icon -->
            <div class="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/15 p-1 shrink-0 flex items-center justify-center shadow-md overflow-hidden group-hover:scale-105 transition-transform">
              <img
                v-if="app.icon_url"
                :src="app.icon_url"
                :alt="app.app_name"
                class="w-full h-full object-cover rounded-xl"
                @error="(e: any) => e.target.style.display = 'none'"
              />
              <Icon v-else name="carbon:application-mobile" size="24" class="text-zinc-400" />
            </div>

            <!-- Titles & Badges -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-base sm:text-lg font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                  {{ app.app_name }}
                </h3>
                <!-- Status Badge -->
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border shrink-0',
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

              <p class="text-xs text-zinc-500 font-mono truncate mt-0.5">
                {{ app.package_name }}
              </p>

              <div class="flex flex-wrap items-center gap-1.5 pt-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/10 text-[11px] font-mono">
                  v{{ app.latest_version_name || '1.0.0' }}
                </span>

                <span v-if="app.latest_release?.file_size_bytes" class="text-[11px] text-zinc-500 font-mono">
                  {{ formatFileSize(app.latest_release.file_size_bytes) }}
                </span>
              </div>

              <!-- Platform Badges -->
              <div v-if="app.supported_platforms && app.supported_platforms.length > 0" class="flex flex-wrap items-center gap-1 pt-2">
                <span
                  v-for="plat in app.supported_platforms"
                  :key="plat"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] font-mono text-zinc-400 uppercase"
                >
                  <PlatformIcon :platform="plat" class="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>{{ plat }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <p v-if="app.description" class="text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
            {{ app.description }}
          </p>
          <p v-else class="text-xs text-zinc-500 italic">
            Synced from repository: {{ app.repo_slug }}
          </p>

          <!-- Metadata Bar -->
          <div class="grid grid-cols-2 gap-2 text-xs bg-black/40 rounded-xl p-2.5 border border-white/5 font-mono">
            <div class="text-zinc-400">
              <span class="text-zinc-500">Released: </span>
              <span class="text-zinc-200">{{ formatDate(app.latest_release?.published_at) }}</span>
            </div>
            <div class="text-zinc-400 text-right">
              <span class="text-zinc-500">Downloads: </span>
              <span class="text-white font-semibold">{{ app.download_count }}x</span>
            </div>
          </div>
        </div>

        <!-- Card Bottom: Actions -->
        <div class="space-y-2.5 pt-4 mt-4 border-t border-white/10">
          <!-- Direct Download Buttons -->
          <div v-if="(app.supported_platforms && app.supported_platforms.length > 1)" class="space-y-1.5">
            <div class="text-[10px] uppercase font-mono text-zinc-500 font-semibold tracking-wider flex items-center justify-between">
              <span>Download Build</span>
              <span class="text-zinc-400">{{ app.supported_platforms.length }} OS</span>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <a
                v-for="plat in app.supported_platforms"
                :key="plat"
                :href="`/api/v1/apps/${app.package_name}/download?platform=${plat}`"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white font-medium text-xs border border-white/10 transition-colors cursor-pointer truncate"
              >
                <PlatformIcon :platform="plat" class="w-3.5 h-3.5 shrink-0" />
                <span class="capitalize truncate">{{ plat }}</span>
              </a>
            </div>
          </div>
          <a
            v-else-if="app.supported_platforms && app.supported_platforms.length === 1"
            :href="`/api/v1/apps/${app.package_name}/download?platform=${app.supported_platforms[0]}`"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs sm:text-sm shadow-md hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <PlatformIcon :platform="app.supported_platforms[0]" class="w-4 h-4 shrink-0" />
            <span>{{ getDownloadButtonLabel(app.supported_platforms[0]) }}</span>
          </a>
          <div
            v-else-if="!getAppStoreActions(app).length"
            class="w-full py-2.5 text-center text-xs text-zinc-500 font-mono border border-dashed border-white/10 rounded-xl"
          >
            No build available yet
          </div>

          <!-- Official Store or Testing Actions -->
          <div
            v-if="getAppStoreActions(app).length > 0"
            class="grid gap-1.5"
            :class="getAppStoreActions(app).length > 1 ? 'grid-cols-2' : 'grid-cols-1'"
          >
            <template v-for="action in getAppStoreActions(app)" :key="action.label">
              <!-- Release Direct Link -->
              <a
                v-if="action.type === 'link'"
                :href="action.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer truncate shadow-sm group/store"
                :title="`Open in ${action.label}`"
              >
                <Icon :name="action.icon" size="14" class="shrink-0" />
                <span class="truncate">{{ action.label }}</span>
                <Icon name="carbon:launch" size="12" class="opacity-60 group-hover/store:opacity-100 shrink-0 ml-0.5" />
              </a>

              <!-- Beta Testing Button -->
              <button
                v-else
                @click="openBetaModal(app, action.platform)"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer truncate shadow-sm"
              >
                <Icon :name="action.icon" size="14" class="shrink-0" />
                <span class="truncate">{{ action.label }}</span>
              </button>
            </template>
          </div>

          <!-- Secondary Actions: QR Code (mobile) / Copy Link (desktop) & Changelog Details -->
          <div class="grid grid-cols-2 gap-2">
            <button
              v-if="isMobileApp(app)"
              @click="openQrModal(app)"
              class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-mono border border-white/10 transition-colors cursor-pointer"
            >
              <Icon name="carbon:qr-code" size="14" class="text-zinc-400" />
              <span>Scan QR</span>
            </button>
            <button
              v-else
              @click="copyUrl(getFullDownloadUrl(app))"
              class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-mono border border-white/10 transition-colors cursor-pointer"
            >
              <Icon :name="copied ? 'carbon:checkmark' : 'carbon:copy'" size="14" class="text-zinc-400" />
              <span>{{ copied ? 'Copied' : 'Copy Link' }}</span>
            </button>
            <button
              @click="openDetailModal(app)"
              class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-mono border border-white/10 transition-colors cursor-pointer"
            >
              <Icon name="carbon:document-view" size="14" class="text-zinc-400" />
              <span>Changelog</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Code Scanner Modal -->
    <div
      v-if="activeQrApp"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      @click.self="activeQrApp = null"
    >
      <div class="bg-[#141417] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative text-white">
        <button
          @click="activeQrApp = null"
          class="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Icon name="carbon:close" size="18" />
        </button>

        <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-300">
          <Icon name="carbon:qr-code" size="22" />
        </div>

        <h3 class="text-lg font-bold text-white mb-1">Scan to Download on Mobile</h3>
        <p class="text-xs text-zinc-400 mb-5 leading-relaxed">
          Point your device camera at this QR code to download <strong class="text-white">{{ activeQrApp.app_name }}</strong> directly.
        </p>

        <!-- QR Code Display -->
        <div class="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
          <img
            :src="getQrCodeUrl(activeQrApp)"
            alt="QR Code Download APK"
            class="w-48 h-48 mx-auto"
          />
        </div>

        <p class="text-[11px] font-mono text-zinc-400 break-all bg-black/60 px-3 py-2 rounded-lg border border-white/10 mb-4">
          {{ getFullDownloadUrl(activeQrApp) }}
        </p>

        <button
          @click="copyUrl(getFullDownloadUrl(activeQrApp))"
          class="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 hover:text-white font-mono border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Icon :name="copied ? 'carbon:checkmark' : 'carbon:copy'" size="14" class="text-zinc-300" />
          <span>{{ copied ? 'Link Copied!' : 'Copy Download Link' }}</span>
        </button>
      </div>
    </div>

    <!-- App Detail / Changelog Modal -->
    <div
      v-if="selectedAppDetail"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      @click.self="selectedAppDetail = null"
    >
      <div class="bg-[#141417] border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[88vh] flex flex-col text-white">
        <button
          @click="selectedAppDetail = null"
          class="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-10 cursor-pointer"
        >
          <Icon name="carbon:close" size="18" />
        </button>

        <!-- Header -->
        <div class="flex items-center gap-4 pb-4 border-b border-white/10 shrink-0">
          <div class="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 p-1 flex items-center justify-center shrink-0">
            <img
              v-if="selectedAppDetail.icon_url"
              :src="selectedAppDetail.icon_url"
              class="w-full h-full object-cover rounded-xl"
            />
            <Icon v-else name="carbon:application-mobile" size="24" class="text-zinc-400" />
          </div>
          <div class="min-w-0 pr-8">
            <div class="flex items-center gap-2 mb-1">
              <h2 class="text-xl font-bold text-white truncate">{{ selectedAppDetail.app_name }}</h2>
              <span
                :class="[
                  'text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border flex items-center gap-1 shrink-0',
                  (selectedAppDetail.status || 'development') === 'production'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    (selectedAppDetail.status || 'development') === 'production' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  ]"
                />
                {{ (selectedAppDetail.status || 'development') === 'production' ? 'Full Release' : 'Development' }}
              </span>
            </div>
            <p class="text-xs text-zinc-500 font-mono truncate">{{ selectedAppDetail.package_name }}</p>
          </div>
        </div>

        <!-- Scrollable Content Body -->
        <div class="space-y-4 pt-4 overflow-y-auto pr-1">
          <!-- Development Mode Banner -->
          <div
            v-if="(selectedAppDetail.status || 'development') === 'development'"
            class="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs"
          >
            <Icon name="carbon:warning-alt" size="16" class="shrink-0 text-amber-400" />
            <span>This build is currently in <strong>Development / Testing</strong> status. You can download and test this {{ (selectedAppDetail.supported_platforms?.length === 1 && selectedAppDetail.supported_platforms[0] === 'android') ? 'APK' : 'application' }} directly on your device.</span>
          </div>

          <!-- Multi-version Switcher -->
          <div v-if="selectedAppDetail.releases && selectedAppDetail.releases.length > 1">
            <h4 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Available Versions & Platforms</h4>
            <div class="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                v-for="(rel, idx) in selectedAppDetail.releases"
                :key="rel.id || idx"
                @click="selectedReleaseIndex = idx"
                :class="[
                  'px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
                  selectedReleaseIndex === idx
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
                ]"
              >
                <PlatformIcon v-if="rel.platform" :platform="rel.platform" class="w-3 h-3 shrink-0" />
                <span>v{{ rel.version_name || rel.tag_name }}</span>
                <span v-if="rel.platform" class="text-[10px] opacity-75 uppercase">({{ rel.platform }})</span>
                <span v-if="idx === 0" class="ml-1 text-[10px] opacity-75 font-sans">(latest)</span>
              </button>
            </div>
          </div>

          <!-- Active Release Details -->
          <div>
            <h4 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Release Information</h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-black/60 p-3.5 rounded-xl border border-white/10 font-mono">
              <div>
                <span class="text-zinc-500 block text-[10px] uppercase font-sans">Version</span>
                <span class="text-white font-bold">v{{ currentRelease?.version_name || selectedAppDetail.latest_version_name }}</span>
              </div>
              <div>
                <span class="text-zinc-500 block text-[10px] uppercase font-sans">Build Code</span>
                <span class="text-zinc-300">{{ currentRelease?.version_code || selectedAppDetail.latest_version_code }}</span>
              </div>
              <div>
                <span class="text-zinc-500 block text-[10px] uppercase font-sans">File Size</span>
                <span class="text-zinc-300">{{ formatFileSize(currentRelease?.file_size_bytes) }}</span>
              </div>
              <div>
                <span class="text-zinc-500 block text-[10px] uppercase font-sans">Min / Target SDK</span>
                <span class="text-zinc-300">{{ currentRelease?.target_sdk ? `API ${currentRelease.target_sdk}` : (currentRelease?.min_sdk ? `SDK ${currentRelease.min_sdk}+` : '-') }}</span>
              </div>
            </div>
          </div>

          <!-- Checksum -->
          <div v-if="currentRelease?.sha256_hash">
            <h4 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 font-mono">SHA-256 Checksum</h4>
            <div class="text-[11px] font-mono text-zinc-400 bg-black/60 p-2.5 rounded-xl border border-white/10 break-all flex items-center justify-between gap-2">
              <span class="truncate">{{ currentRelease.sha256_hash }}</span>
              <button
                @click="copyUrl(currentRelease.sha256_hash)"
                class="text-zinc-300 hover:text-white shrink-0 cursor-pointer"
                title="Copy SHA-256 Hash"
              >
                <Icon :name="copied ? 'carbon:checkmark' : 'carbon:copy'" size="14" />
              </button>
            </div>
          </div>

          <!-- Release Notes & Changelog (Rendered Markdown) -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">Release Notes & Changelog</h4>
              <span v-if="currentRelease?.published_at" class="text-[11px] text-zinc-500 font-mono">
                Released on {{ formatDate(currentRelease.published_at) }}
              </span>
            </div>

            <!-- Markdown Output -->
            <div
              v-if="currentRelease?.changelog"
              class="bg-black/60 p-4 rounded-xl border border-white/10 changelog-prose max-h-72 overflow-y-auto"
              v-html="renderMarkdown(currentRelease.changelog)"
            />
            <div
              v-else
              class="bg-black/40 p-6 rounded-xl border border-white/5 text-xs text-zinc-500 italic text-center"
            >
              No release notes provided for this version.
            </div>
          </div>
        </div>

        <!-- Footer / Download Action -->
        <div class="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div class="text-xs text-zinc-400 font-mono">
            Total downloads: <span class="text-white font-bold">{{ selectedAppDetail.download_count }}x</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <!-- Google Play Store Direct Link -->
            <a
              v-if="selectedAppDetail.play_store_url"
              :href="selectedAppDetail.play_store_url"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open in Google Play Store"
            >
              <Icon name="carbon:logo-google" size="14" />
              <span>Google Play</span>
              <Icon name="carbon:launch" size="12" class="opacity-60" />
            </a>

            <!-- Apple App Store Direct Link -->
            <a
              v-if="selectedAppDetail.app_store_url"
              :href="selectedAppDetail.app_store_url"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open in Apple App Store"
            >
              <Icon name="carbon:apple" size="14" />
              <span>App Store</span>
              <Icon name="carbon:launch" size="12" class="opacity-60" />
            </a>

            <!-- Apple TestFlight Direct Link -->
            <a
              v-if="selectedAppDetail.testflight_url"
              :href="selectedAppDetail.testflight_url"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Join via Apple TestFlight"
            >
              <Icon name="carbon:apple" size="14" />
              <span>TestFlight</span>
              <Icon name="carbon:launch" size="12" class="opacity-60" />
            </a>

            <!-- Store Beta Pass -->
            <button
              v-if="hasStoreBeta(selectedAppDetail)"
              @click="openBetaModal(selectedAppDetail)"
              class="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="carbon:badge" size="14" />
              <span>Beta Pass (14d)</span>
            </button>
            <a
              v-for="plat in (selectedAppDetail.supported_platforms || [])"
              :key="plat"
              :href="`/api/v1/apps/${selectedAppDetail.package_name}/download?platform=${plat}`"
              class="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs shadow-md hover:bg-zinc-200 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <PlatformIcon :platform="plat" class="w-4 h-4 shrink-0" />
              <span>Download for {{ getPlatformLabel(plat) }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Official Store Invite Modal -->
    <div
      v-if="betaModalApp"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      @click.self="closeBetaModal"
    >
      <div class="bg-[#141417] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
        <button
          @click="closeBetaModal"
          class="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Icon name="carbon:close" size="18" />
        </button>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
            <Icon :name="betaPlatform === 'ios' ? 'carbon:apple' : 'carbon:logo-google'" size="20" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">
              {{ betaPlatform === 'ios' ? 'Apple TestFlight Invite' : 'Google Play Beta Invite' }}
            </h3>
            <p class="text-xs text-zinc-400 font-mono">
              {{ betaModalApp.app_name }} • 14-Day {{ betaPlatform === 'ios' ? 'iOS' : 'Android' }} Testing Pass
            </p>
          </div>
        </div>

        <!-- Step 1: Input Email -->
        <div v-if="betaStep === 1" class="space-y-4">
          <p class="text-xs text-zinc-300 leading-relaxed">
            {{
              betaPlatform === 'ios'
                ? 'Get an official TestFlight invite sent directly by Apple to your inbox to install securely on your iPhone or iPad.'
                : 'Get official closed testing access to install securely from Google Play Store on your Android device.'
            }}
          </p>

          <div class="flex items-center gap-2 p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-300 font-mono">
            <Icon :name="betaPlatform === 'ios' ? 'carbon:apple' : 'carbon:logo-google'" size="16" class="text-zinc-400 shrink-0" />
            <span class="font-medium">
              Platform: {{ betaPlatform === 'ios' ? 'Apple TestFlight (iOS)' : 'Google Play Testing (Android)' }}
            </span>
            <span class="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 border border-white/10 font-mono font-semibold">14 Days</span>
          </div>

          <!-- Email Input -->
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1.5">
              {{ betaPlatform === 'ios' ? 'Email (Apple ID recommended) *' : 'Email (Google Play account) *' }}
            </label>
            <input
              v-model="betaEmail"
              type="email"
              required
              :placeholder="betaPlatform === 'ios' ? 'e.g. appleid@example.com' : 'e.g. account@gmail.com'"
              class="w-full px-3.5 py-2.5 rounded-xl bg-black/80 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors font-mono"
            />
            <p class="text-[11px] text-zinc-500 mt-1">
              A 6-digit confirmation code will be sent to verify your email.
            </p>
          </div>

          <div v-if="betaError" class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
            {{ betaError }}
          </div>

          <button
            @click="submitRequestOtp"
            :disabled="betaLoading || !betaEmail"
            class="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs transition-colors hover:bg-zinc-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Icon v-if="betaLoading" name="carbon:renew" size="14" class="animate-spin" />
            <span>{{ betaLoading ? 'Sending Confirmation Code...' : 'Send Verification Code' }}</span>
          </button>

          <!-- Direct Link to enter OTP -->
          <div class="text-center pt-1">
            <button
              type="button"
              @click="goToStep2"
              class="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Already requested a code? <span class="underline underline-offset-2">Enter verification code</span>
            </button>
          </div>
        </div>

        <!-- Step 2: OTP Verification -->
        <div v-else-if="betaStep === 2" class="space-y-4">
          <div class="flex items-center justify-between text-xs text-zinc-300 bg-black/60 p-2.5 rounded-xl border border-white/10 font-mono">
            <span class="truncate">Code sent to: <strong class="text-white">{{ betaEmail }}</strong></span>
            <button
              type="button"
              @click="betaStep = 1; betaError = null;"
              class="text-zinc-300 hover:text-white text-[11px] underline shrink-0 cursor-pointer ml-2"
            >
              Change
            </button>
          </div>

          <p class="text-xs text-zinc-400 leading-relaxed">
            Enter the 6-digit confirmation code below to activate your 14-day official pass:
          </p>

          <div>
            <input
              v-model="betaOtp"
              type="text"
              maxlength="6"
              placeholder="123456"
              class="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-center font-mono font-bold text-xl tracking-[0.4em] text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div v-if="betaError" class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
            {{ betaError }}
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="submitVerifyOtp"
              :disabled="betaLoading || betaOtp.length !== 6"
              class="flex-1 py-2.5 rounded-xl bg-white text-black font-semibold text-xs transition-colors hover:bg-zinc-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Icon v-if="betaLoading" name="carbon:renew" size="14" class="animate-spin" />
              <span>{{ betaLoading ? 'Verifying...' : 'Verify & Activate Pass' }}</span>
            </button>
            <button
              @click="betaStep = 1"
              class="px-3.5 py-2.5 rounded-xl bg-white/[0.04] text-zinc-300 text-xs hover:bg-white/[0.08] transition-colors border border-white/10 cursor-pointer"
            >
              Back
            </button>
          </div>

          <div class="text-center pt-1">
            <button
              type="button"
              @click="submitRequestOtp"
              :disabled="betaLoading"
              class="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer font-mono"
            >
              Didn't receive the code? <span class="underline">Resend code</span>
            </button>
          </div>
        </div>

        <!-- Step 3: Success Confirmation -->
        <div v-else-if="betaStep === 3" class="text-center space-y-4 py-2">
          <div class="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Icon name="carbon:checkmark-filled" size="28" />
          </div>

          <div>
            <h4 class="text-base font-bold text-white mb-1">
              {{ betaPlatform === 'ios' ? 'TestFlight Pass Activated!' : 'Google Play Pass Activated!' }}
            </h4>
            <p class="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto">
              {{ betaSuccessMessage }}
            </p>
          </div>

          <div class="p-3 bg-black/60 rounded-xl border border-white/10 text-left text-xs space-y-1 font-mono">
            <div>
              Platform: <strong class="text-white">{{ betaPlatform === 'ios' ? 'Apple TestFlight (iOS)' : 'Google Play (Android)' }}</strong>
            </div>
            <div>Valid Until: <strong class="text-emerald-400">{{ formatDate(betaExpiresAt) }}</strong> (14 Days)</div>
            <div>Recipient: <strong class="text-zinc-300">{{ betaEmail }}</strong></div>
          </div>

          <p class="text-[11px] text-zinc-500 italic">
            {{
              betaPlatform === 'ios'
                ? 'Check your inbox now for the official email from Apple (no_reply@email.apple.com) to install via TestFlight on your iPhone.'
                : 'Check your Google Play Store testing invitation or visit the link provided in your email to begin testing.'
            }}
          </p>

          <div v-if="betaStoreUrl" class="pt-1">
            <a
              :href="betaStoreUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors hover:bg-zinc-200 shadow-md cursor-pointer"
            >
              <Icon :name="betaPlatform === 'ios' ? 'carbon:apple' : 'carbon:logo-google'" size="16" />
              <span>{{ betaPlatform === 'ios' ? 'Open TestFlight Invitation' : 'Open Google Play Track' }}</span>
              <Icon name="carbon:launch" size="14" class="opacity-80" />
            </a>
          </div>

          <button
            @click="closeBetaModal"
            class="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const { isApkStoreEnabled } = useFeatureFlag();
if (!isApkStoreEnabled.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page Not Found",
    fatal: true,
  });
}

const appsPageTitle = "Personal Software & Applications | Eka Syafrino";
const appsPageDesc =
  "Curated collection of cross-platform applications and direct binaries built by Eka Syafrino. Download official Android APKs or join iOS TestFlight & Google Play beta programs.";
const appsPageUrl = "https://eka-dev.cloud/apps";
const appsOgImage = "https://eka-dev.cloud/images/og-apps.png";

useHead(() => ({
  title: appsPageTitle,
  link: [
    {
      rel: "canonical",
      href: appsPageUrl,
    },
  ],
  meta: [
    {
      name: "keywords",
      content:
        "Eka Syafrino Apps, Android APK Download, Flutter Apps, iOS TestFlight, Cross Platform Binaries, Open Source Mobile Apps, GitHub Release Binaries",
    },
    {
      name: "robots",
      content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:site_name",
      content: "Eka Syafrino Portfolio",
    },
    {
      property: "og:url",
      content: appsPageUrl,
    },
    {
      property: "og:title",
      content: appsPageTitle,
    },
    {
      property: "og:description",
      content: appsPageDesc,
    },
    {
      property: "og:image",
      content: appsOgImage,
    },
    {
      property: "og:image:secure_url",
      content: appsOgImage,
    },
    {
      property: "og:image:type",
      content: "image/png",
    },
    {
      property: "og:image:width",
      content: "1200",
    },
    {
      property: "og:image:height",
      content: "630",
    },
    {
      property: "og:image:alt",
      content: "Personal Software & Applications - Eka Syafrino",
    },
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
      content: appsPageTitle,
    },
    {
      name: "twitter:description",
      content: appsPageDesc,
    },
    {
      name: "twitter:image",
      content: appsOgImage,
    },
    {
      name: "twitter:image:alt",
      content: "Personal Software & Applications - Eka Syafrino",
    },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: appsPageTitle,
        url: appsPageUrl,
        description: appsPageDesc,
        creator: {
          "@type": "Person",
          name: "Moh. Eka Syafrino",
          url: "https://eka-dev.cloud",
        },
      }),
    },
  ],
}));

const { data: response, pending } = await useFetch<any>("/api/v1/apps");

const apps = computed(() => response.value?.data || []);
const searchQuery = ref("");
const activeQrApp = ref<any>(null);
const selectedAppDetail = ref<any>(null);
const selectedReleaseIndex = ref(0);
const loadingDetail = ref(false);
const copied = ref(false);

// Beta Tester Modal State
const betaModalApp = ref<any>(null);
const betaStep = ref(1);
const betaPlatform = ref<"ios" | "android">("ios");
const betaEmail = ref("");
const betaOtp = ref("");
const betaLoading = ref(false);
const betaError = ref<string | null>(null);
const betaSuccessMessage = ref("");
const betaExpiresAt = ref<string | null>(null);
const betaStoreUrl = ref<string | null>(null);
const lastPendingAppPackage = ref<string | null>(null);

const iosSlots = ref<{ remaining: number; max: number; is_available?: boolean }>({ remaining: 0, max: 0, is_available: false });

const isIosAvailable = computed(() => {
  if (!betaModalApp.value) return false;
  if (!betaModalApp.value.apple_beta_group_id || !betaModalApp.value.apple_beta_group_id.trim()) {
    return false;
  }
  return iosSlots.value.is_available !== false;
});

const selectedStatusFilter = ref<"all" | "production" | "development">("all");
const selectedPlatformFilter = ref<"all" | "android" | "windows" | "macos" | "linux">("all");

const platformFilters = [
  { id: "all", label: "All Platforms" },
  { id: "windows", label: "Windows" },
  { id: "macos", label: "macOS" },
  { id: "android", label: "Android" },
  { id: "linux", label: "Linux" },
];

const getPlatformLabel = (plat?: string) => {
  switch (plat?.toLowerCase()) {
    case "windows":
      return "Windows (.exe)";
    case "macos":
      return "macOS (.dmg)";
    case "linux":
      return "Linux";
    case "android":
      return "Android APK";
    default:
      return plat || "Download";
  }
};

const getDownloadButtonLabel = (plat?: string) => {
  switch (plat?.toLowerCase()) {
    case "windows":
      return "Download for Windows (.exe)";
    case "macos":
      return "Download for macOS (.dmg)";
    case "linux":
      return "Download for Linux";
    case "android":
      return "Download APK";
    default:
      return `Download for ${plat || "Device"}`;
  }
};

const counts = computed(() => {
  const all = apps.value.length;
  const production = apps.value.filter((a: any) => a.status === "production").length;
  const development = apps.value.filter((a: any) => (a.status || "development") === "development").length;
  return { all, production, development };
});

const filteredApps = computed(() => {
  let list = apps.value;
  if (selectedStatusFilter.value !== "all") {
    list = list.filter((app: any) => (app.status || "development") === selectedStatusFilter.value);
  }
  if (selectedPlatformFilter.value !== "all") {
    list = list.filter((app: any) => {
      const plats = app.supported_platforms || [];
      return plats.includes(selectedPlatformFilter.value);
    });
  }
  if (!searchQuery.value.trim()) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(
    (app: any) =>
      app.app_name?.toLowerCase().includes(q) ||
      app.package_name?.toLowerCase().includes(q) ||
      app.repo_slug?.toLowerCase().includes(q)
  );
});

const currentRelease = computed(() => {
  if (!selectedAppDetail.value) return null;
  if (selectedAppDetail.value.releases && selectedAppDetail.value.releases.length > 0) {
    return selectedAppDetail.value.releases[selectedReleaseIndex.value] || selectedAppDetail.value.releases[0];
  }
  return selectedAppDetail.value.latest_release;
});

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getFullDownloadUrl = (app: any) => {
  if (import.meta.client) {
    return `${window.location.origin}/api/v1/apps/${app.package_name}/download`;
  }
  return `/api/v1/apps/${app.package_name}/download`;
};

const getQrCodeUrl = (app: any) => {
  const url = getFullDownloadUrl(app);
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=020617&qzone=1`;
};

const openQrModal = (app: any) => {
  activeQrApp.value = app;
  copied.value = false;
};

const openDetailModal = async (app: any) => {
  selectedAppDetail.value = { ...app };
  selectedReleaseIndex.value = 0;
  copied.value = false;
  loadingDetail.value = true;
  try {
    const res = await $fetch<{ success: boolean; data: any }>(`/api/v1/apps/${app.package_name}`);
    if (res?.success && res.data) {
      selectedAppDetail.value = res.data;
    }
  } catch (err) {
    console.error("Failed to load full app releases:", err);
  } finally {
    loadingDetail.value = false;
  }
};

const copyUrl = (text: string) => {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};

const goToStep2 = () => {
  if (!betaEmail.value || !betaEmail.value.includes("@")) {
    betaError.value = "Please enter your email above before entering the verification code.";
    return;
  }
  betaError.value = null;
  betaStep.value = 2;
  lastPendingAppPackage.value = betaModalApp.value?.package_name || null;
};

interface AppStoreAction {
  type: "link" | "beta";
  label: string;
  url?: string;
  platform: "android" | "ios";
  isRelease: boolean;
  icon: string;
  class: string;
}

const isMobileApp = (app: any): boolean => {
  if (!app) return false;
  const plats = app.supported_platforms || [];
  return (
    plats.includes("android") ||
    plats.includes("ios") ||
    Boolean(
      app.play_store_url ||
      app.app_store_url ||
      app.testflight_url ||
      app.apple_beta_group_id ||
      app.google_tester_group_email
    )
  );
};

const getAppStoreActions = (app: any): AppStoreAction[] => {
  if (!app) return [];
  const actions: AppStoreAction[] = [];
  const platforms = app.supported_platforms || [];
  const supportsAndroid = platforms.includes("android");
  const supportsIos = platforms.includes("ios") || Boolean(app.app_store_url || app.testflight_url || app.apple_beta_group_id);

  // Android: Prioritize Release (Google Play) > Closed Beta
  if (supportsAndroid) {
    if (app.play_store_url) {
      actions.push({
        type: "link",
        label: "Google Play",
        url: app.play_store_url,
        platform: "android",
        isRelease: true,
        icon: "carbon:logo-google",
        class: "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 hover:border-white/25",
      });
    } else if (app.google_tester_group_email) {
      actions.push({
        type: "beta",
        label: "Google Play Beta",
        platform: "android",
        isRelease: false,
        icon: "carbon:logo-google",
        class: "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 hover:border-white/25",
      });
    }
  }

  // iOS: Prioritize Release (App Store) > TestFlight Public Link > TestFlight Beta Pass
  if (supportsIos) {
    if (app.app_store_url) {
      actions.push({
        type: "link",
        label: "App Store",
        url: app.app_store_url,
        platform: "ios",
        isRelease: true,
        icon: "carbon:apple",
        class: "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 hover:border-white/25",
      });
    } else if (app.testflight_url) {
      actions.push({
        type: "link",
        label: "Apple TestFlight",
        url: app.testflight_url,
        platform: "ios",
        isRelease: false,
        icon: "carbon:apple",
        class: "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 hover:border-white/25",
      });
    } else if (app.apple_beta_group_id) {
      actions.push({
        type: "beta",
        label: "Apple TestFlight",
        platform: "ios",
        isRelease: false,
        icon: "carbon:apple",
        class: "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 hover:border-white/25",
      });
    }
  }

  return actions;
};

const hasStoreBeta = (app: any) => {
  if (!app) return false;
  const platforms = app.supported_platforms || [];
  const hasAndroid = platforms.includes("android");
  const hasIos = platforms.includes("ios") || Boolean(app.app_store_url || app.testflight_url || app.apple_beta_group_id);

  // If Android is released on Play Store, it is NOT in beta
  const hasAndroidBeta = !app.play_store_url && hasAndroid && Boolean(app.google_tester_group_email && app.google_tester_group_email.trim());
  // If iOS is released on App Store or only has a direct public link, it does not need OTP beta pass
  const hasIosBeta = !app.app_store_url && hasIos && Boolean(app.apple_beta_group_id && app.apple_beta_group_id.trim());

  return hasAndroidBeta || hasIosBeta;
};

const openBetaModal = async (app: any, preferredPlatform?: "ios" | "android") => {
  const isSamePending = lastPendingAppPackage.value === app.package_name && betaStep.value === 2 && betaEmail.value;
  betaModalApp.value = app;

  const hasIosGroup = !app.app_store_url && Boolean(app.apple_beta_group_id && app.apple_beta_group_id.trim());
  const hasAndroidGroup = !app.play_store_url && Boolean(app.google_tester_group_email && (app.supported_platforms || []).includes("android"));

  if (preferredPlatform) {
    betaPlatform.value = preferredPlatform;
  } else if (hasIosGroup) {
    betaPlatform.value = "ios";
  } else if (hasAndroidGroup) {
    betaPlatform.value = "android";
  } else {
    betaPlatform.value = "ios";
  }

  if (isSamePending) {
    betaError.value = null;
  } else {
    betaStep.value = 1;
    betaOtp.value = "";
    betaError.value = null;

    iosSlots.value = {
      remaining: 0,
      max: hasIosGroup ? 50 : 0,
      is_available: betaPlatform.value === "ios" ? hasIosGroup : true,
    };
  }

  await fetchBetaSlots(app);
};

const closeBetaModal = () => {
  if (betaStep.value === 2) {
    lastPendingAppPackage.value = betaModalApp.value?.package_name || null;
    betaModalApp.value = null;
    return;
  }
  betaModalApp.value = null;
  betaStep.value = 1;
  betaEmail.value = "";
  betaOtp.value = "";
  betaError.value = null;
  betaStoreUrl.value = null;
  lastPendingAppPackage.value = null;
};

const fetchBetaSlots = async (app: any) => {
  try {
    const res = await $fetch<any>(`/api/v1/apps/${app.package_name}/beta/slots?platform=${betaPlatform.value}`);
    if (res?.data) {
      iosSlots.value = {
        remaining: res.data.remaining_slots,
        max: res.data.max_slots,
        is_available: res.data.is_available,
      };
    }
  } catch (err) {
    console.error("Failed to fetch beta slot info:", err);
  }
};

const submitRequestOtp = async () => {
  if (!betaEmail.value || !betaModalApp.value) return;
  if (betaPlatform.value === "ios" && !isIosAvailable.value) {
    betaError.value = "Apple TestFlight is currently unavailable (Group ID not configured).";
    return;
  }
  betaLoading.value = true;
  betaError.value = null;
  try {
    const res = await $fetch<any>(`/api/v1/apps/${betaModalApp.value.package_name}/beta/request-otp`, {
      method: "POST",
      body: {
        email: betaEmail.value,
        platform: betaPlatform.value,
      },
    });

    if (res?.data?.already_active) {
      betaSuccessMessage.value = res.data.message;
      betaExpiresAt.value = res.data.expires_at;
      betaStoreUrl.value = res?.data?.store_url || null;
      betaStep.value = 3;
    } else {
      betaStep.value = 2;
      lastPendingAppPackage.value = betaModalApp.value?.package_name || null;
    }
  } catch (err: any) {
    betaError.value = err?.data?.message || err?.message || "Failed to send verification code";
  } finally {
    betaLoading.value = false;
  }
};

const submitVerifyOtp = async () => {
  if (!betaOtp.value || betaOtp.value.length !== 6 || !betaModalApp.value) return;
  betaLoading.value = true;
  betaError.value = null;
  try {
    const res = await $fetch<any>(`/api/v1/apps/${betaModalApp.value.package_name}/beta/verify-otp`, {
      method: "POST",
      body: {
        email: betaEmail.value,
        platform: betaPlatform.value,
        otp: betaOtp.value,
      },
    });

    betaSuccessMessage.value = res?.data?.message || "Beta pass activated successfully!";
    betaExpiresAt.value = res?.data?.expires_at || null;
    betaStoreUrl.value = res?.data?.store_url || null;
    betaStep.value = 3;
    if (betaModalApp.value) {
      fetchBetaSlots(betaModalApp.value);
    }
  } catch (err: any) {
    betaError.value = err?.data?.message || err?.message || "Invalid or expired verification code";
  } finally {
    betaLoading.value = false;
  }
};
</script>
