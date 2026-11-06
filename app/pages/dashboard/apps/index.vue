<template>
  <div class="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div>
        <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
          <span>Manage Applications (Multi-Platform)</span>
          <span class="text-xs font-mono px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {{ repositories.length }} Repos
          </span>
        </h1>
        <p class="text-white/60 text-sm sm:text-base">
          Manage GitHub repository webhooks, automated multi-platform releases (Windows, macOS, Android, Linux), production/development visibility, and official store distribution.
        </p>
      </div>

      <!-- Action Buttons Cluster -->
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/apps"
          target="_blank"
          class="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/15 text-white font-medium text-sm transition-all whitespace-nowrap shadow-sm hover:border-cyan-500/40"
        >
          <Icon name="carbon:launch" size="18" class="text-cyan-400" />
          <span>View /apps</span>
        </NuxtLink>

        <button
          @click="openRegisterModal"
          class="inline-flex items-center cursor-pointer gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm transition-all whitespace-nowrap shadow-sm"
        >
          <Icon name="carbon:add" size="18" />
          <span>Register Repository</span>
        </button>
      </div>
    </div>

    <!-- Webhook Instructions Helper Box -->
    <div class="bg-[#141417] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-start gap-3.5">
        <div class="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
          <Icon name="carbon:information" size="20" />
        </div>
        <div>
          <span class="font-bold text-white text-sm">GitHub Webhook Setup:</span>
          <p class="text-xs text-white/60 mt-0.5">
            Configure webhook in GitHub: <code class="bg-white/10 px-2 py-0.5 rounded font-mono text-cyan-300 text-xs border border-white/10">{{ webhookUrl }}</code>
            with event <strong class="text-white">"Releases"</strong> and <strong class="text-white">"application/json"</strong>.
          </p>
        </div>
      </div>
      <button
        @click="copyText(webhookUrl)"
        class="flex-shrink-0 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 font-mono text-xs flex items-center gap-2 transition-all cursor-pointer hover:border-cyan-500/40"
      >
        <Icon name="carbon:copy" size="15" />
        <span>Copy URL</span>
      </button>
    </div>

    <!-- Applications & Release Status Section -->
    <div class="bg-[#141417] border border-white/10 rounded-2xl overflow-hidden">
      <div class="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2.5">
            <Icon name="carbon:application-mobile" size="20" class="text-cyan-400" />
            <span>Ingested Applications</span>
            <span class="text-xs font-mono text-white/50">({{ apps.length }})</span>
          </h2>
          <p class="text-xs text-white/50 mt-1">
            Toggle release status between <strong>Full Release (Production)</strong> and <strong>In Development (Testing)</strong>.
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-16 flex flex-col items-center justify-center text-white/60 text-xs">
        <Icon name="carbon:renew" size="24" class="animate-spin mb-3 text-cyan-400" />
        <span>Loading applications...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="apps.length === 0" class="p-10 text-center">
        <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/40">
          <Icon name="carbon:application-mobile" size="24" />
        </div>
        <p class="text-sm font-bold text-white">No applications ingested yet</p>
        <p class="text-xs text-white/50 mt-1">
          Sync one of your repositories below to automatically extract app metadata and release binaries.
        </p>
      </div>

      <!-- Apps List -->
      <div v-else class="divide-y divide-white/5">
        <div
          v-for="app in apps"
          :key="app.id"
          class="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-white/[0.02] transition-colors"
        >
          <!-- Left: App Icon & Details -->
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                v-if="app.icon_url"
                :src="app.icon_url"
                :alt="app.app_name"
                class="w-full h-full object-cover rounded-xl"
              />
              <Icon v-else name="carbon:application-mobile" size="24" class="text-cyan-400" />
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-2.5">
                <span class="text-base font-bold text-white">{{ app.app_name }}</span>
                <span
                  :class="[
                    'text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5',
                    app.status === 'production'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full',
                      app.status === 'production' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    ]"
                  />
                  {{ app.status === 'production' ? 'Full Release' : 'Development' }}
                </span>
              </div>

              <p class="text-xs text-white/50 font-mono">{{ app.package_name }}</p>

              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60 pt-0.5">
                <span>Repo: <strong class="text-white font-mono">{{ app.repo_slug }}</strong></span>
                <span>Latest: <strong class="text-cyan-300 font-mono">v{{ app.latest_version_name }}</strong> ({{ app.latest_version_code }})</span>
                <span>Releases: <strong class="text-white">{{ app.release_count || 1 }}</strong></span>
                <span>Downloads: <strong class="text-emerald-400">{{ app.download_count || 0 }}x</strong></span>
              </div>

              <!-- Supported Platform Badges -->
              <div v-if="app.supported_platforms && app.supported_platforms.length > 0" class="flex flex-wrap items-center gap-1.5 pt-1">
                <span
                  v-for="plat in app.supported_platforms"
                  :key="plat"
                  class="text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1.5 bg-white/5 text-slate-300 border border-white/10 uppercase"
                >
                  <PlatformIcon :platform="plat" class="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>{{ plat }}</span>
                </span>
              </div>

              <!-- Store Integration Badges -->
              <div class="flex flex-wrap items-center gap-2 pt-0.5">
                <span
                  :class="[
                    'text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 border',
                    app.play_store_url ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-white/5 text-white/40 border-white/10'
                  ]"
                >
                  <Icon name="carbon:logo-google" size="12" />
                  <span>{{ app.play_store_url ? 'Google Play Linked' : 'No Play Store Link' }}</span>
                </span>
                <span
                  :class="[
                    'text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 border',
                    app.app_store_url ? 'bg-sky-500/10 text-sky-400 border-sky-500/25' : 'bg-white/5 text-white/40 border-white/10'
                  ]"
                >
                  <Icon name="carbon:apple" size="12" />
                  <span>{{ app.app_store_url ? 'App Store Linked' : 'No App Store Link' }}</span>
                </span>
                <span
                  :class="[
                    'text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 border',
                    app.testflight_url ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' : 'bg-white/5 text-white/40 border-white/10'
                  ]"
                >
                  <Icon name="carbon:apple" size="12" />
                  <span>{{ app.testflight_url ? 'TestFlight Linked' : 'No TestFlight Link' }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Right: Actions & Status Switcher -->
          <div class="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <!-- Toggle Status Button -->
            <button
              @click="toggleAppStatus(app)"
              :disabled="updatingStatusId === app.id"
              :class="[
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50',
                app.status === 'production'
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              ]"
              :title="app.status === 'production' ? 'Switch to Development build' : 'Switch to Full Release'"
            >
              <Icon
                :name="updatingStatusId === app.id ? 'carbon:renew' : (app.status === 'production' ? 'carbon:chemistry' : 'carbon:checkmark-filled')"
                size="15"
                :class="updatingStatusId === app.id ? 'animate-spin' : ''"
              />
              <span>{{ updatingStatusId === app.id ? 'Updating...' : (app.status === 'production' ? 'Set to Development' : 'Set to Full Release') }}</span>
            </button>

            <!-- Configure Store Links -->
            <button
              @click="openStoreLinksModal(app)"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors cursor-pointer"
              title="Configure Official Google Play & Apple TestFlight testing links"
            >
              <Icon name="carbon:store" size="15" />
              <span>Store Links</span>
            </button>

            <!-- Manage Beta Testers -->
            <button
              @click="openTestersModal(app)"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors cursor-pointer"
              title="Manage Official Store Beta Testers"
            >
              <Icon name="carbon:user-multiple" size="15" />
              <span>Testers</span>
            </button>

            <!-- Test Download -->
            <a
              :href="`/api/v1/apps/${app.package_name}/download`"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-colors"
              title="Download APK binary to test"
            >
              <Icon name="carbon:download" size="15" class="text-cyan-400" />
              <span>Test Download</span>
            </a>

            <!-- View in Showcase -->
            <NuxtLink
              to="/apps"
              target="_blank"
              class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs transition-colors"
              title="View on Public Showcase"
            >
              <Icon name="carbon:launch" size="16" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Registered Repositories Section -->
    <div class="bg-[#141417] border border-white/10 rounded-2xl overflow-hidden">
      <div class="p-6 border-b border-white/10 flex items-center justify-between">
        <h2 class="text-base font-bold text-white flex items-center gap-2.5">
          <Icon name="carbon:logo-github" size="20" class="text-slate-400" />
          <span>Connected Repositories</span>
          <span class="text-xs font-mono text-white/50">({{ repositories.length }})</span>
        </h2>
        <button
          @click="fetchData"
          class="text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <Icon name="carbon:renew" size="15" :class="loading ? 'animate-spin' : ''" />
          <span>Refresh</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-16 flex flex-col items-center justify-center text-white/60 text-sm">
        <Icon name="carbon:renew" size="28" class="animate-spin mb-3 text-primary" />
        <span>Loading repositories...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="repositories.length === 0" class="p-16 text-center">
        <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
          <Icon name="carbon:folder" size="28" />
        </div>
        <p class="text-base font-bold text-white">No repositories connected yet</p>
        <p class="text-xs text-white/50 mt-1 max-w-sm mx-auto">
          Click the "Register Repository" button above to integrate your first Android application project.
        </p>
      </div>

      <!-- Table / Cards of Repositories -->
      <div v-else class="divide-y divide-white/5">
        <div
          v-for="repo in repositories"
          :key="repo.id"
          class="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-white/[0.02] transition-colors"
        >
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <span class="text-base font-bold text-white font-mono tracking-tight">{{ repo.repo_slug }}</span>
              <span
                :class="[
                  'text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold border',
                  repo.is_private
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                ]"
              >
                {{ repo.is_private ? 'Private' : 'Public' }}
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/60">
              <span class="flex items-center gap-1.5">
                <Icon name="carbon:filter" size="14" class="text-white/40" />
                <span>Filter: <code class="text-cyan-300 font-mono">{{ repo.asset_filter_regex }}</code></span>
              </span>
              <span class="flex items-center gap-1.5">
                <Icon name="carbon:application" size="14" class="text-white/40" />
                <span>Apps: <strong class="text-white">{{ repo.app_count || 0 }}</strong></span>
              </span>
              <span class="flex items-center gap-1.5">
                <Icon name="carbon:tag" size="14" class="text-white/40" />
                <span>Total Releases: <strong class="text-white">{{ repo.release_count || 0 }}</strong></span>
              </span>
            </div>

            <!-- Webhook Secret Snippet -->
            <div class="flex items-center gap-2 pt-1 text-xs text-white/50 font-mono">
              <span>Webhook Secret:</span>
              <span class="bg-black/40 px-2.5 py-0.5 rounded border border-white/10 text-white/80">
                {{ showSecret[repo.id] ? repo.webhook_secret : '••••••••••••••••••••' }}
              </span>
              <button
                @click="showSecret[repo.id] = !showSecret[repo.id]"
                class="text-white/50 hover:text-white cursor-pointer transition-colors p-1"
                title="Toggle Visibility"
              >
                <Icon :name="showSecret[repo.id] ? 'carbon:view-off' : 'carbon:view'" size="15" />
              </button>
              <button
                @click="copyText(repo.webhook_secret)"
                class="text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors p-1"
                title="Copy Secret"
              >
                <Icon name="carbon:copy" size="15" />
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2.5 self-start lg:self-center">
            <button
              @click="triggerSync(repo)"
              :disabled="syncingId === repo.id"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Icon
                :name="syncingId === repo.id ? 'carbon:renew' : 'carbon:cloud-download'"
                size="16"
                :class="syncingId === repo.id ? 'animate-spin' : ''"
              />
              <span>{{ syncingId === repo.id ? 'Syncing...' : 'Sync Now' }}</span>
            </button>

            <button
              @click="confirmDelete(repo)"
              class="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition-colors cursor-pointer"
              title="Delete Repository"
            >
              <Icon name="carbon:trash-can" size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Sync Activity Section -->
    <div class="bg-[#141417] border border-white/10 rounded-2xl overflow-hidden">
      <div class="p-6 border-b border-white/10 flex items-center justify-between">
        <h2 class="text-base font-bold text-white flex items-center gap-2.5">
          <Icon name="carbon:activity" size="20" class="text-slate-400" />
          <span>Recent Sync Activity & Logs</span>
        </h2>
      </div>

      <div v-if="syncJobs.length === 0" class="p-10 text-center text-xs text-white/50">
        No sync activity recorded yet.
      </div>

      <div v-else class="divide-y divide-white/5 text-xs font-mono">
        <div
          v-for="job in syncJobs"
          :key="job.id"
          class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.01]"
        >
          <div class="space-y-1.5">
            <div class="flex items-center gap-2.5">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                  job.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : '',
                  job.status === 'processing' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse' : '',
                  job.status === 'pending' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : '',
                  job.status === 'failed' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : ''
                ]"
              >
                {{ job.status }}
              </span>
              <span class="text-white font-bold">{{ job.repo_slug }}</span>
              <span class="text-white/40">({{ job.event_type }})</span>
            </div>
            <p v-if="job.error_message" class="text-red-400 text-xs font-sans">
              Error: {{ job.error_message }}
            </p>
          </div>
          <div class="text-white/40 text-xs">
            {{ formatDate(job.created_at) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Register Repository Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="showModal = false"
    >
      <div class="bg-[#141417] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          @click="showModal = false"
          class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <Icon name="carbon:close" size="20" />
        </button>

        <h3 class="text-lg font-bold text-white mb-1">Register GitHub Repository</h3>
        <p class="text-xs text-white/60 mb-5">
          Connect your Android project. A webhook secret will be automatically generated.
        </p>

        <form @submit.prevent="submitRegister" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5">
              Repository Slug (owner/repo) *
            </label>
            <input
              v-model="form.repo_slug"
              type="text"
              placeholder="e.g. exa-dev-portfolio/my-android-app"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-primary font-mono placeholder:text-white/30"
            />
          </div>

          <div class="flex items-center gap-2.5 pt-1">
            <input
              v-model="form.is_private"
              type="checkbox"
              id="is_private"
              class="rounded bg-white/10 border-white/20 text-primary focus:ring-0 cursor-pointer"
            />
            <label for="is_private" class="text-xs text-white/80 select-none cursor-pointer">
              This repository is Private
            </label>
          </div>

          <div v-if="form.is_private">
            <label class="block text-xs font-semibold text-white/80 mb-1.5">
              GitHub Personal Access Token (PAT) *
            </label>
            <input
              v-model="form.access_token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-primary font-mono placeholder:text-white/30"
            />
            <p class="text-[10px] text-white/50 mt-1">Requires <code>repo</code> scope to download release assets from private repositories.</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-white/80 mb-1.5">
              Asset Regex Filter
            </label>
            <input
              v-model="form.asset_filter_regex"
              type="text"
              placeholder=".*\\.(apk|exe|msi|dmg|pkg|AppImage|deb|zip)$"
              class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-primary font-mono placeholder:text-white/30"
            />
            <p class="text-[10px] text-white/50 mt-1">Regex pattern to match binary files from GitHub release assets (e.g. .apk, .exe, .dmg, .AppImage, .zip).</p>
          </div>

          <div class="pt-4 flex items-center justify-end gap-2.5 border-t border-white/10">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-xs text-zinc-950 font-semibold shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {{ submitting ? 'Saving...' : 'Save & Register' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Custom Delete Confirmation Modal -->
    <div
      v-if="repoToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="repoToDelete = null"
    >
      <div class="bg-[#141417] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
        <div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3 text-red-400">
          <Icon name="carbon:warning-alt" size="24" />
        </div>

        <h3 class="text-base font-bold text-white text-center mb-1">Delete Repository Integration?</h3>
        <p class="text-xs text-white/60 text-center mb-5 leading-relaxed">
          Are you sure you want to delete repository <span class="font-mono text-cyan-400 font-semibold">{{ repoToDelete.repo_slug }}</span>? All associated application metadata and APK release history will be permanently removed.
        </p>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="repoToDelete = null"
            :disabled="deleting"
            class="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="executeDelete"
            :disabled="deleting"
            class="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-lg shadow-red-600/20 cursor-pointer"
          >
            <Icon v-if="deleting" name="carbon:renew" size="14" class="animate-spin" />
            <span>{{ deleting ? 'Deleting...' : 'Yes, Delete' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Beta Testers Management Modal -->
    <div
      v-if="testersModalApp"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      @click.self="testersModalApp = null"
    >
      <div class="bg-[#141417] border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          @click="testersModalApp = null"
          class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer z-10"
        >
          <Icon name="carbon:close" size="20" />
        </button>

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Icon name="carbon:user-multiple" size="20" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Beta Testers & Store Passes</h3>
              <p class="text-xs text-white/50">{{ testersModalApp.app_name }} • {{ testersList.length }} testers registered</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="copyActiveEmails()"
              class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy active tester emails for Google Play / App Store Console"
            >
              <Icon name="carbon:copy" size="14" />
              <span>Copy Emails</span>
            </button>
            <button
              @click="showAddTesterForm = !showAddTesterForm"
              class="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Icon :name="showAddTesterForm ? 'carbon:close' : 'carbon:add'" size="14" />
              <span>{{ showAddTesterForm ? 'Cancel' : 'Add Tester' }}</span>
            </button>
          </div>
        </div>

        <!-- Inline Add Tester Form -->
        <div v-if="showAddTesterForm" class="p-3.5 bg-white/[0.03] border border-cyan-500/30 rounded-xl space-y-3 my-3 shrink-0">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white flex items-center gap-1.5">
              <Icon name="carbon:user-follow" size="15" class="text-cyan-400" />
              <span>Grant Direct Beta Tester Pass</span>
            </span>
            <span class="text-[10px] text-white/50 font-mono">Bypasses public OTP</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div class="sm:col-span-2">
              <input
                v-model="newTesterForm.email"
                type="email"
                placeholder="user@example.com"
                class="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            <div>
              <select
                v-model="newTesterForm.platform"
                class="w-full px-2 py-2 rounded-lg bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="android">Android (Play)</option>
                <option value="ios">iOS (TestFlight)</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <div class="text-[11px] text-white/50">
              Validity: <strong class="text-cyan-400">14 Days</strong>
            </div>
            <button
              @click="submitAddTester"
              :disabled="submittingNewTester || !newTesterForm.email"
              class="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Icon v-if="submittingNewTester" name="carbon:renew" size="13" class="animate-spin" />
              <span>{{ submittingNewTester ? 'Granting...' : 'Grant Pass' }}</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="py-4 overflow-y-auto space-y-3">
          <div v-if="loadingTesters" class="p-10 flex flex-col items-center justify-center text-xs text-white/50">
            <Icon name="carbon:renew" size="20" class="animate-spin mb-2 text-cyan-400" />
            <span>Loading testers...</span>
          </div>

          <div v-else-if="testersList.length === 0" class="p-8 text-center text-xs text-white/50">
            No beta testers registered for this app yet. Click "Add Tester" above or let users verify via /apps.
          </div>

          <div v-else class="divide-y divide-white/5 font-mono text-xs">
            <div
              v-for="t in testersList"
              :key="t.id"
              class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-white font-sans font-medium">{{ t.email }}</span>
                  <span
                    :class="[
                      'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase',
                      t.platform === 'ios'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    ]"
                  >
                    {{ t.platform === 'ios' ? 'iOS TestFlight' : 'Google Play' }}
                  </span>
                  <span
                    :class="[
                      'text-[10px] px-2 py-0.5 rounded font-bold uppercase',
                      t.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : (t.status === 'revoked' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300')
                    ]"
                  >
                    {{ t.status }}
                  </span>
                </div>
                <div class="text-[11px] text-white/40 font-sans">
                  <span>Expires: {{ t.expires_at ? formatDate(t.expires_at) : '-' }}</span>
                  <span class="mx-2">•</span>
                  <span>Joined: {{ formatDate(t.created_at) }}</span>
                </div>
              </div>

              <div v-if="t.status === 'active'">
                <button
                  @click="revokeTester(t)"
                  class="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] transition-colors cursor-pointer"
                >
                  Revoke Access
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/10 text-right shrink-0">
          <button
            @click="testersModalApp = null"
            class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Configure Store Links Modal -->
    <div
      v-if="storeLinksModalApp"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="storeLinksModalApp = null"
    >
      <div class="bg-[#141417] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          @click="storeLinksModalApp = null"
          class="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <Icon name="carbon:close" size="20" />
        </button>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Icon name="carbon:store" size="22" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Official Store & Testing Links</h3>
            <p class="text-xs text-white/50">{{ storeLinksModalApp.app_name }} • {{ storeLinksModalApp.package_name }}</p>
          </div>
        </div>

        <p class="text-xs text-white/60 mb-5 leading-relaxed">
          Configure direct official store links for public users (visitors will be redirected directly to Google Play / App Store when clicking buttons on <code class="text-purple-300">/apps</code>), as well as optional beta testing tracks if conducting closed tests.
        </p>

        <!-- Tab Switcher: Release vs Testing -->
        <div class="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 mb-4">
          <button
            type="button"
            @click="activeStoreTab = 'release'"
            :class="[
              'py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer',
              activeStoreTab === 'release'
                ? 'bg-gradient-to-r from-emerald-500/20 to-sky-500/20 text-white border border-emerald-500/30 shadow-md'
                : 'text-white/50 hover:text-white'
            ]"
          >
            <Icon name="carbon:launch" size="14" class="text-emerald-400" />
            <span>Official Store (Release)</span>
            <span
              v-if="storeLinksForm.play_store_url || storeLinksForm.app_store_url"
              class="w-1.5 h-1.5 rounded-full bg-emerald-400"
              title="Release URLs configured"
            />
          </button>

          <button
            type="button"
            @click="activeStoreTab = 'testing'"
            :class="[
              'py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer',
              activeStoreTab === 'testing'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30 shadow-md'
                : 'text-white/50 hover:text-white'
            ]"
          >
            <Icon name="carbon:badge" size="14" class="text-purple-400" />
            <span>Beta Testing Track</span>
            <span
              v-if="storeLinksForm.apple_beta_group_id || storeLinksForm.google_tester_group_email || storeLinksForm.testflight_url"
              class="w-1.5 h-1.5 rounded-full bg-purple-400"
              title="Testing configured"
            />
          </button>
        </div>

        <!-- Mode Indicator Banner -->
        <div
          v-if="storeLinksForm.play_store_url || storeLinksForm.app_store_url"
          class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] mb-4 flex items-center gap-2"
        >
          <Icon name="carbon:checkmark-filled" size="15" class="text-emerald-400 shrink-0" />
          <span><strong>Status: Release Active.</strong> Direct store buttons will be displayed on <code class="text-white">/apps</code>. Testing buttons are automatically hidden.</span>
        </div>
        <div
          v-else-if="storeLinksForm.apple_beta_group_id || storeLinksForm.google_tester_group_email || storeLinksForm.testflight_url"
          class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] mb-4 flex items-center gap-2"
        >
          <Icon name="carbon:warning-alt" size="15" class="text-amber-400 shrink-0" />
          <span><strong>Status: Testing Active.</strong> No public store release URLs configured yet, so beta testing buttons will be displayed on <code class="text-white">/apps</code>.</span>
        </div>

        <form @submit.prevent="saveStoreLinks" class="space-y-4">
          <!-- Section 1: Public Store Links (Release) -->
          <div v-show="activeStoreTab === 'release'" class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
            <div class="flex items-center justify-between pb-1 border-b border-white/5">
              <div class="flex items-center gap-2">
                <Icon name="carbon:launch" size="14" class="text-emerald-400" />
                <span class="text-xs font-semibold text-white">Public Store Links (Direct Redirect)</span>
              </div>
              <span class="text-[10px] text-emerald-400 font-mono">1 Link per OS</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-white/80 mb-1 flex items-center gap-1.5">
                <Icon name="carbon:logo-google" size="14" class="text-emerald-400" />
                <span>Google Play Store URL (Direct Link)</span>
              </label>
              <input
                v-model="storeLinksForm.play_store_url"
                type="url"
                placeholder="https://play.google.com/store/apps/details?id=com.yourcompany.app"
                class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-purple-500"
              />
              <p class="text-[10px] text-white/40 mt-1">Visitors on the apps page will be redirected directly to your app on Google Play Store.</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-white/80 mb-1 flex items-center gap-1.5">
                <Icon name="carbon:apple" size="14" class="text-sky-400" />
                <span>Apple App Store URL (Direct Link)</span>
              </label>
              <input
                v-model="storeLinksForm.app_store_url"
                type="url"
                placeholder="https://apps.apple.com/app/your-app/id1234567890"
                class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-purple-500"
              />
              <p class="text-[10px] text-white/40 mt-1">Visitors on the apps page will be redirected directly to your app on Apple App Store.</p>
            </div>
          </div>

          <!-- Section 2: Beta Testing & TestFlight (Testing) -->
          <div v-show="activeStoreTab === 'testing'" class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
            <div class="flex items-center justify-between pb-1 border-b border-white/5">
              <div class="flex items-center gap-2">
                <Icon name="carbon:badge" size="14" class="text-purple-400" />
                <span class="text-xs font-semibold text-white/80">Beta Testing Track</span>
              </div>
              <span class="text-[10px] text-purple-400 font-mono">Shown when not yet Released</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-white/70 mb-1 flex items-center gap-1.5">
                <Icon name="carbon:apple" size="14" class="text-blue-400" />
                <span>Apple TestFlight Public Invite URL</span>
              </label>
              <input
                v-model="storeLinksForm.testflight_url"
                type="url"
                placeholder="https://testflight.apple.com/join/AbCd123"
                class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-purple-500"
              />
              <p class="text-[10px] text-white/40 mt-1">Public TestFlight invite link from App Store Connect (visitors can click directly to join via TestFlight).</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-white/70 mb-1 flex items-center gap-1.5">
                <Icon name="carbon:identification" size="14" class="text-blue-400" />
                <span>Apple TestFlight Beta Group ID</span>
              </label>
              <input
                v-model="storeLinksForm.apple_beta_group_id"
                type="text"
                placeholder="e.g. 1a2b3c4d-5678-90ef-..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-purple-500"
              />
              <p class="text-[10px] text-white/40 mt-1">External group UUID in App Store Connect for automated 14-day beta invitations.</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-white/70 mb-1 flex items-center gap-1.5">
                <Icon name="carbon:email" size="14" class="text-emerald-400" />
                <span>Google Play Tester Group Email (Optional)</span>
              </label>
              <input
                v-model="storeLinksForm.google_tester_group_email"
                type="email"
                placeholder="testers@googlegroups.com"
                class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-purple-500"
              />
              <p class="text-[10px] text-white/40 mt-1">Google Group for automated Google Play closed testing track.</p>
            </div>
          </div>

          <div class="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              @click="storeLinksModalApp = null"
              class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="savingStoreLinks"
              class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              <Icon v-if="savingStoreLinks" name="carbon:renew" size="14" class="animate-spin" />
              <span>{{ savingStoreLinks ? 'Saving...' : 'Save Store Links' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToastCustom } from "~/composables/useToastCustom";

definePageMeta({
  layout: "dashboard",
  breadCrumb: [
    { title: "Apps (APK)" },
  ],
});

useHead({
  title: "Apps & APK Distribution Hub | Dashboard",
});

const { isApkStoreEnabled } = useFeatureFlag();
if (!isApkStoreEnabled.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page Not Found",
    fatal: true,
  });
}

const { $axios } = useNuxtApp() as any;
const toast = useToastCustom();

const loading = ref(true);
const repositories = ref<any[]>([]);
const syncJobs = ref<any[]>([]);
const apps = ref<any[]>([]);
const updatingStatusId = ref<string | null>(null);
const showModal = ref(false);
const submitting = ref(false);
const syncingId = ref<string | null>(null);
const showSecret = ref<Record<string, boolean>>({});
const webhookUrl = ref("");

// Delete confirmation modal state
const repoToDelete = ref<any>(null);
const deleting = ref(false);

// Beta testers modal state
const testersModalApp = ref<any>(null);
const testersList = ref<any[]>([]);
const loadingTesters = ref(false);
const showAddTesterForm = ref(false);
const newTesterForm = ref({
  email: "",
  platform: "android" as "ios" | "android",
  days: 14,
});
const submittingNewTester = ref(false);

// Store links modal state
const storeLinksModalApp = ref<any>(null);
const activeStoreTab = ref<"release" | "testing">("release");
const storeLinksForm = ref({
  play_store_url: "",
  app_store_url: "",
  testflight_url: "",
  apple_beta_group_id: "",
  google_tester_group_email: "",
});
const savingStoreLinks = ref(false);

const form = ref({
  repo_slug: "",
  is_private: false,
  access_token: "",
  asset_filter_regex: ".*\\.(apk|exe|msi|dmg|pkg|AppImage|deb|zip)$",
});

onMounted(() => {
  if (import.meta.client) {
    webhookUrl.value = `${window.location.origin}/api/v1/webhooks/github`;
  }
  fetchData();
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [reposRes, jobsRes, appsRes] = await Promise.all([
      $axios.get("/api/v1/admin/apk/repositories"),
      $axios.get("/api/v1/admin/apk/jobs?limit=15"),
      $axios.get("/api/v1/admin/apk/apps"),
    ]);

    repositories.value = reposRes.data?.data || [];
    syncJobs.value = jobsRes.data?.data || [];
    apps.value = appsRes.data?.data || [];
  } catch (err: any) {
    console.error("Failed to load APK dashboard data:", err);
    toast.showErrorToast("Failed to Load Data", "An error occurred while loading repository data");
  } finally {
    loading.value = false;
  }
};

const toggleAppStatus = async (app: any) => {
  const newStatus = app.status === "production" ? "development" : "production";
  updatingStatusId.value = app.id;
  try {
    await $axios.patch(`/api/v1/admin/apk/apps/${app.id}/status`, {
      status: newStatus,
    });
    app.status = newStatus;
    toast.showSuccessToast(
      "Status Updated",
      `${app.app_name} is now marked as ${newStatus === "production" ? "Full Release" : "Development"}`
    );
  } catch (err: any) {
    toast.showErrorToast("Update Failed", err.response?.data?.message || "Failed to update status");
  } finally {
    updatingStatusId.value = null;
  }
};

const openTestersModal = async (app: any) => {
  testersModalApp.value = app;
  loadingTesters.value = true;
  testersList.value = [];
  try {
    const res = await $axios.get(`/api/v1/admin/apk/apps/${app.id}/testers`);
    testersList.value = res.data?.data || [];
  } catch (err: any) {
    toast.showErrorToast("Failed to Load Testers", err.response?.data?.message || "Error fetching testers");
  } finally {
    loadingTesters.value = false;
  }
};

const revokeTester = async (tester: any) => {
  try {
    await $axios.patch(`/api/v1/admin/apk/testers/${tester.id}/revoke`, {
      reason: "Revoked manually by administrator",
    });
    tester.status = "revoked";
    toast.showSuccessToast("Access Revoked", `Revoked access for ${tester.email}`);
  } catch (err: any) {
    toast.showErrorToast("Revoke Failed", err.response?.data?.message || "Error revoking tester access");
  }
};

const openStoreLinksModal = (app: any) => {
  storeLinksModalApp.value = app;
  storeLinksForm.value = {
    play_store_url: app.play_store_url || "",
    app_store_url: app.app_store_url || "",
    testflight_url: app.testflight_url || "",
    apple_beta_group_id: app.apple_beta_group_id || "",
    google_tester_group_email: app.google_tester_group_email || "",
  };

  if (app.play_store_url || app.app_store_url) {
    activeStoreTab.value = "release";
  } else if (app.apple_beta_group_id || app.google_tester_group_email || app.testflight_url) {
    activeStoreTab.value = "testing";
  } else {
    activeStoreTab.value = "release";
  }
};

const saveStoreLinks = async () => {
  if (!storeLinksModalApp.value) return;
  savingStoreLinks.value = true;
  try {
    await $axios.patch(`/api/v1/admin/apk/apps/${storeLinksModalApp.value.id}/store-links`, {
      play_store_url: storeLinksForm.value.play_store_url?.trim() || null,
      app_store_url: storeLinksForm.value.app_store_url?.trim() || null,
      testflight_url: storeLinksForm.value.testflight_url?.trim() || null,
      apple_beta_group_id: storeLinksForm.value.apple_beta_group_id?.trim() || null,
      google_tester_group_email: storeLinksForm.value.google_tester_group_email?.trim() || null,
    });
    storeLinksModalApp.value.play_store_url = storeLinksForm.value.play_store_url?.trim() || null;
    storeLinksModalApp.value.app_store_url = storeLinksForm.value.app_store_url?.trim() || null;
    storeLinksModalApp.value.testflight_url = storeLinksForm.value.testflight_url?.trim() || null;
    storeLinksModalApp.value.apple_beta_group_id = storeLinksForm.value.apple_beta_group_id?.trim() || null;
    storeLinksModalApp.value.google_tester_group_email = storeLinksForm.value.google_tester_group_email?.trim() || null;
    toast.showSuccessToast("Store Config Saved", "Official store links updated successfully");
    storeLinksModalApp.value = null;
  } catch (err: any) {
    toast.showErrorToast("Save Failed", err.response?.data?.message || "Failed to update store links");
  } finally {
    savingStoreLinks.value = false;
  }
};

const submitAddTester = async () => {
  if (!testersModalApp.value || !newTesterForm.value.email) return;
  submittingNewTester.value = true;
  try {
    await $axios.post(`/api/v1/admin/apk/apps/${testersModalApp.value.id}/testers`, {
      email: newTesterForm.value.email.trim(),
      platform: newTesterForm.value.platform,
      days: Number(newTesterForm.value.days) || 14,
    });
    toast.showSuccessToast("Tester Added", `Granted 14-day pass to ${newTesterForm.value.email}`);
    newTesterForm.value.email = "";
    showAddTesterForm.value = false;
    const refreshed = await $axios.get(`/api/v1/admin/apk/apps/${testersModalApp.value.id}/testers`);
    testersList.value = refreshed.data?.data || [];
  } catch (err: any) {
    toast.showErrorToast("Add Failed", err.response?.data?.message || "Failed to add tester");
  } finally {
    submittingNewTester.value = false;
  }
};

const copyActiveEmails = () => {
  const active = testersList.value
    .filter((t) => t.status === "active")
    .map((t) => t.email);
  if (active.length === 0) {
    toast.showErrorToast("No Emails", "No active tester emails to copy");
    return;
  }
  const text = active.join(", ");
  navigator.clipboard.writeText(text);
  toast.showSuccessToast("Copied to Clipboard", `Copied ${active.length} active tester email(s) for Play Console / TestFlight`);
};

const openRegisterModal = () => {
  form.value = {
    repo_slug: "",
    is_private: false,
    access_token: "",
    asset_filter_regex: ".*\\.(apk|exe|msi|dmg|pkg|AppImage|deb|zip)$",
  };
  showModal.value = true;
};

const submitRegister = async () => {
  submitting.value = true;
  try {
    await $axios.post("/api/v1/admin/apk/repositories", {
      ...form.value,
      access_token: form.value.is_private ? form.value.access_token : null,
    });
    showModal.value = false;
    toast.showSuccessToast("Repository Registered", `Repository ${form.value.repo_slug} has been successfully registered`);
    await fetchData();
  } catch (err: any) {
    toast.showErrorToast("Registration Failed", err.response?.data?.message || "Failed to register repository");
  } finally {
    submitting.value = false;
  }
};

const triggerSync = async (repo: any) => {
  syncingId.value = repo.id;
  try {
    await $axios.post(`/api/v1/admin/apk/repositories/${repo.id}/sync`);
    toast.showInfoToast("Sync Initiated", `Worker is processing the latest release for ${repo.repo_slug}`);
    await fetchData();
  } catch (err: any) {
    toast.showErrorToast("Sync Failed", err.response?.data?.message || "Failed to initiate release synchronization");
  } finally {
    syncingId.value = null;
  }
};

const confirmDelete = (repo: any) => {
  repoToDelete.value = repo;
};

const executeDelete = async () => {
  if (!repoToDelete.value) return;
  deleting.value = true;
  try {
    await $axios.delete(`/api/v1/admin/apk/repositories/${repoToDelete.value.id}`);
    toast.showSuccessToast("Repository Deleted", `Repository ${repoToDelete.value.repo_slug} has been deleted`);
    repoToDelete.value = null;
    await fetchData();
  } catch (err: any) {
    toast.showErrorToast("Deletion Failed", err.response?.data?.message || "Failed to delete repository");
  } finally {
    deleting.value = false;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPlatformIcon = (plat?: string) => {
  switch (plat?.toLowerCase()) {
    case "windows":
    case "win":
      return "simple-icons:windows";
    case "macos":
    case "mac":
    case "ios":
      return "simple-icons:apple";
    case "linux":
      return "simple-icons:linux";
    case "android":
      return "simple-icons:android";
    default:
      return "carbon:application";
  }
};

const copyText = (text: string) => {
  if (!text) return;
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.showSuccessToast("Copied", "Copied to clipboard!");
      })
      .catch(() => {
        fallbackCopy(text);
      });
  } else {
    fallbackCopy(text);
  }
};

const fallbackCopy = (text: string) => {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    toast.showSuccessToast("Copied", "Copied to clipboard!");
  } catch (err) {
    toast.showErrorToast("Failed", "Could not copy to clipboard");
  }
};
</script>
