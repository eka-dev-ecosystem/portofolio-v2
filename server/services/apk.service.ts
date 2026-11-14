import crypto from "node:crypto";
import { withTransaction } from "~~/server/db/postgres";
import { HttpError } from "~~/server/errors/HttpError";
import type {
  CreateApkRepositoryInput,
  UpdateApkRepositoryInput,
} from "~~/server/model/apk.model";
import * as apkRepo from "~~/server/repositories/apk.repository";
import { logger } from "~~/server/utils/logger";
import { sendBetaTesterOtp, sendBetaAccessApproved } from "~~/server/lib/email";
import { get as redisGet, set as redisSet } from "~~/server/db/redis";
import {
  addTesterToAppleTestFlight,
  removeTesterFromAppleTestFlight,
  addTesterToGooglePlay,
  removeTesterFromGooglePlay,
} from "./storeIntegration.service";
import { scheduleBetaTesterExpiration } from "~~/server/lib/asynq";

const getWorkerConfig = () => {
  const config = useRuntimeConfig();
  return {
    url: config.jobWorkerUrl || "http://localhost:9090",
    secret: config.jobWorkerSecret || "",
  };
};

/**
 * Verify GitHub webhook HMAC-SHA256 signature
 */
export function verifyGitHubSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") return false;

  const expectedSignature = parts[1];
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const actualSignature = hmac.digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(actualSignature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Register a new repository for APK distribution
 */
export async function registerRepository(input: CreateApkRepositoryInput) {
  return withTransaction(async (client) => {
    const existing = await apkRepo.getRepositoryBySlug(client, input.repo_slug);
    if (existing) {
      throw new HttpError(409, `Repository "${input.repo_slug}" is already registered`);
    }

    const webhook_secret =
      input.webhook_secret || crypto.randomBytes(24).toString("hex");

    return await apkRepo.createRepository(client, {
      ...input,
      webhook_secret,
    });
  });
}

/**
 * Update repository configuration
 */
export async function updateRepository(
  id: string,
  input: UpdateApkRepositoryInput
) {
  return withTransaction(async (client) => {
    const existing = await apkRepo.getRepositoryById(client, id);
    if (!existing) {
      throw new HttpError(404, "Repository not found");
    }

    if (input.repo_slug && input.repo_slug.toLowerCase() !== existing.repo_slug.toLowerCase()) {
      const duplicate = await apkRepo.getRepositoryBySlug(client, input.repo_slug);
      if (duplicate && duplicate.id !== id) {
        throw new HttpError(409, `Repository "${input.repo_slug}" is already registered`);
      }
    }

    return await apkRepo.updateRepository(client, id, input);
  });
}

/**
 * Delete repository and cascade delete associated apps & releases
 */
export async function deleteRepository(id: string) {
  return withTransaction(async (client) => {
    const existing = await apkRepo.getRepositoryById(client, id);
    if (!existing) {
      throw new HttpError(404, "Repository not found");
    }
    return await apkRepo.deleteRepository(client, id);
  });
}

/**
 * List all registered repositories
 */
export async function listRepositories() {
  return withTransaction(async (client) => {
    return await apkRepo.listRepositories(client);
  });
}

/**
 * Get repository by ID
 */
export async function getRepositoryById(id: string) {
  return withTransaction(async (client) => {
    const repo = await apkRepo.getRepositoryById(client, id);
    if (!repo) throw new HttpError(404, "Repository not found");
    return repo;
  });
}

/**
 * List published apps with latest release
 */
export async function listPublishedApps() {
  return withTransaction(async (client) => {
    return await apkRepo.listPublishedApps(client);
  });
}

/**
 * List all apps for admin dashboard
 */
export async function listAllApps() {
  return withTransaction(async (client) => {
    return await apkRepo.listAllApps(client);
  });
}

/**
 * Update app release status ('development' | 'production')
 */
export async function updateAppStatus(id: string, status: "development" | "production") {
  return withTransaction(async (client) => {
    const updated = await apkRepo.updateAppStatus(client, id, status);
    if (!updated) {
      throw new HttpError(404, "App not found");
    }
    return updated;
  });
}

/**
 * Update individual release status ('development' | 'production')
 */
export async function updateReleaseStatus(id: string, status: "development" | "production") {
  return withTransaction(async (client) => {
    const updated = await apkRepo.updateReleaseStatus(client, id, status);
    if (!updated) {
      throw new HttpError(404, "Release not found");
    }
    return updated;
  });
}

/**
 * Get app detail with release history
 */
export async function getAppDetail(packageName: string) {
  return withTransaction(async (client) => {
    const app = await apkRepo.getAppByPackageName(client, packageName);
    if (!app) {
      throw new HttpError(404, `App with package name "${packageName}" not found`);
    }

    const releases = await apkRepo.listReleasesByAppId(client, app.id);
    return {
      ...app,
      releases,
    };
  });
}

/**
 * Check if a newer version is available for an installed app
 */
export async function checkAppUpdate(
  packageName: string,
  currentVersionCode: number
) {
  return withTransaction(async (client) => {
    const app = await apkRepo.getAppByPackageName(client, packageName);
    if (!app) {
      throw new HttpError(404, `App "${packageName}" not found`);
    }

    const latest = await apkRepo.getLatestRelease(client, app.id);
    if (!latest) {
      return {
        has_update: false,
        message: "No releases found for this app",
      };
    }

    const hasUpdate = latest.version_code > currentVersionCode;
    return {
      has_update: hasUpdate,
      package_name: app.package_name,
      app_name: app.app_name,
      current_version_code: currentVersionCode,
      latest_version_code: latest.version_code,
      latest_version_name: latest.version_name,
      download_url: `/api/v1/apps/${app.package_name}/download/${latest.version_code}`,
      changelog: latest.changelog,
      file_size_bytes: latest.file_size_bytes,
      sha256_hash: latest.sha256_hash,
      published_at: latest.published_at,
    };
  });
}

/**
 * Trigger background worker to process APK sync
 */
async function notifyWorker(payload: Record<string, unknown>): Promise<boolean> {
  const { url, secret } = getWorkerConfig();
  try {
    const res = await fetch(`${url}/apk/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret": secret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, "[apk.service] worker /apk/sync returned non-200");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "[apk.service] failed to trigger worker /apk/sync");
    return false;
  }
}

/**
 * Handle incoming GitHub Webhook
 */
export async function handleGitHubWebhook(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  eventHeader: string | undefined,
  payload: any
) {
  if (eventHeader !== "release") {
    return { ok: true, ignored: true, reason: `Ignored event: ${eventHeader}` };
  }

  const action = payload.action;
  const isPublishedOrReleased = action === "published" || action === "released";
  const isEditedWithAssets = action === "edited" && (payload.release?.assets?.length || 0) > 0;

  if (!isPublishedOrReleased && !isEditedWithAssets) {
    return { ok: true, ignored: true, reason: `Ignored release action: ${action}` };
  }

  const repoSlug = payload.repository?.full_name;
  if (!repoSlug) {
    throw new HttpError(400, "Missing repository full_name in webhook payload");
  }

  const { repo, job } = await withTransaction(async (client) => {
    let foundRepo = await apkRepo.getRepositoryBySlug(client, repoSlug);

    // Smart Fallback: If exact repoSlug not found, check if repository was moved/renamed
    if (!foundRepo && payload.repository?.name) {
      const repoName = payload.repository.name;
      const candidates = await apkRepo.getRepositoriesByName(client, repoName);

      for (const candidate of candidates) {
        if (verifyGitHubSignature(rawBody, signatureHeader, candidate.webhook_secret)) {
          logger.info(
            `[apk.service] Webhook detected repo rename/transfer from "${candidate.repo_slug}" to "${repoSlug}". Auto-updating database record.`
          );
          await apkRepo.updateRepositorySlug(client, candidate.id, repoSlug);
          foundRepo = { ...candidate, repo_slug: repoSlug };
          break;
        }
      }
    }

    if (!foundRepo) {
      logger.warn(`[apk.service] Webhook received for unregistered repo: ${repoSlug}`);
      throw new HttpError(404, `Repository "${repoSlug}" is not registered in APK Store`);
    }

    // Validate HMAC signature (for normal exact-match flow)
    const isValid = verifyGitHubSignature(rawBody, signatureHeader, foundRepo.webhook_secret);
    if (!isValid) {
      logger.warn(`[apk.service] Invalid webhook signature for repo ${repoSlug}`);
      throw new HttpError(401, "Invalid webhook signature");
    }

    // Create sync job
    const createdJob = await apkRepo.createSyncJob(client, foundRepo.id, "webhook", {
      tag_name: payload.release?.tag_name,
      release_id: payload.release?.id,
      assets_count: payload.release?.assets?.length || 0,
    });

    return { repo: foundRepo, job: createdJob };
  });

  // Notify worker asynchronously
  notifyWorker({
    jobId: job.id,
    repoId: repo.id,
    repoSlug: repo.repo_slug,
    isPrivate: repo.is_private,
    accessToken: repo.access_token,
    assetFilterRegex: repo.asset_filter_regex,
    release: payload.release,
  }).catch((e) => {
    logger.error({ err: e }, "[apk.service] notifyWorker error");
  });

  return {
    ok: true,
    message: "Webhook accepted and queued for processing",
    job_id: job.id,
  };
}

/**
 * Trigger manual sync for a repository (calls GitHub latest release API)
 */
export async function triggerManualSync(repoId: string) {
  const { repo, job } = await withTransaction(async (client) => {
    const foundRepo = await apkRepo.getRepositoryById(client, repoId);
    if (!foundRepo) throw new HttpError(404, "Repository not found");

    const createdJob = await apkRepo.createSyncJob(client, foundRepo.id, "manual_sync", {
      initiated_at: new Date().toISOString(),
    });

    return { repo: foundRepo, job: createdJob };
  });

  // Notify worker
  notifyWorker({
    jobId: job.id,
    repoId: repo.id,
    repoSlug: repo.repo_slug,
    isPrivate: repo.is_private,
    accessToken: repo.access_token,
    assetFilterRegex: repo.asset_filter_regex,
    isManual: true,
  }).catch((e) => {
    logger.error({ err: e }, "[apk.service] notifyWorker manual sync error");
  });

  return {
    ok: true,
    message: "Sync job initiated successfully",
    job_id: job.id,
  };
}

/**
 * List recent sync jobs for admin audit
 */
export async function listRecentSyncJobs(limit = 20) {
  return withTransaction(async (client) => {
    return await apkRepo.listRecentSyncJobs(client, limit);
  });
}

/**
 * Resolve APK release file for streaming download
 */
export async function getDownloadRelease(packageName: string, versionCode?: number, platform?: string) {
  return withTransaction(async (client) => {
    const app = await apkRepo.getAppByPackageName(client, packageName);
    if (!app) {
      throw new HttpError(404, `App "${packageName}" not found`);
    }

    let release;
    if (versionCode) {
      release = await apkRepo.getReleaseByVersion(client, app.id, versionCode, platform);
    } else {
      release = await apkRepo.getLatestRelease(client, app.id, platform);
    }

    if (!release) {
      throw new HttpError(404, `Release not found for "${packageName}"${platform ? ` on ${platform}` : ""}`);
    }

    // Increment downloads inside transaction
    await apkRepo.incrementAppDownload(client, app.id);
    await apkRepo.incrementReleaseDownload(client, release.id);

    return { app, release };
  });
}

// ==========================================
// OFFICIAL STORE ACCESS & BETA ONBOARDING
// ==========================================

export const MAX_BETA_SLOTS_PER_PLATFORM = 50;
export const MAX_OTP_REQUESTS_PER_WINDOW = 20;
export const MAX_FAILED_OTP_ATTEMPTS = 10;

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "trashmail.com",
  "yopmail.com",
  "sharklasers.com",
  "getairmail.com",
  "dispostable.com",
  "temp-mail.org",
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

/**
 * Request OTP for Official Store (TestFlight / Google Play) beta testing access
 */
export async function requestBetaAccessOtp(
  packageName: string,
  platform: "ios" | "android",
  email: string,
  clientIp?: string
) {
  const cleanEmail = email.trim().toLowerCase();

  // Edge case 1: Reject burner / disposable emails
  if (isDisposableEmail(cleanEmail)) {
    throw new HttpError(
      400,
      "INVALID_EMAIL",
      "Temporary / disposable emails are not permitted for official store access."
    );
  }

  // Edge case 2: Rate limit by IP (default 20 requests per 15 minutes, 100 for localhost)
  if (clientIp) {
    const isLocalhost =
      clientIp === "127.0.0.1" ||
      clientIp === "::1" ||
      clientIp === "localhost" ||
      clientIp === "::ffff:127.0.0.1";
    const maxAllowedRequests = isLocalhost
      ? 100
      : Number(process.env.NUXT_BETA_OTP_RATE_LIMIT || MAX_OTP_REQUESTS_PER_WINDOW);

    const rateLimitKey = `rate:beta_otp:${clientIp}`;
    const currentCount = await redisGet(rateLimitKey);
    const count = currentCount ? parseInt(currentCount, 10) : 0;
    if (count >= maxAllowedRequests) {
      throw new HttpError(
        429,
        "RATE_LIMIT_EXCEEDED",
        "Too many verification requests. Please wait 15 minutes before trying again."
      );
    }
    await redisSet(rateLimitKey, String(count + 1), 900); // 15 mins
  }

  return withTransaction(async (client) => {
    const app = await apkRepo.getAppByPackageName(client, packageName);
    if (!app) {
      throw new HttpError(404, `App "${packageName}" not found`);
    }

    // Edge case: if platform is iOS, verify TestFlight Beta Group ID is configured for this app
    if (platform === "ios" && (!app.apple_beta_group_id || !app.apple_beta_group_id.trim())) {
      throw new HttpError(
        400,
        "BETA_UNAVAILABLE",
        `Apple TestFlight beta testing for "${app.app_name}" is not yet available. Please configure the Beta Group ID in the dashboard.`
      );
    }

    // Check if user is ALREADY active and not expired
    const existing = await apkRepo.findBetaTester(client, app.id, cleanEmail, platform);
    if (
      existing &&
      existing.status === "active" &&
      existing.expires_at &&
      new Date(existing.expires_at) > new Date()
    ) {
      return {
        already_active: true,
        expires_at: existing.expires_at,
        message: `You already have active beta access for ${app.app_name} (${platform === "ios" ? "TestFlight" : "Google Play"}) until ${new Date(existing.expires_at).toLocaleDateString()}.`,
      };
    }

    // Generate 6-digit cryptographic OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await apkRepo.upsertBetaTesterOtp(
      client,
      app.id,
      cleanEmail,
      platform,
      otpCode,
      otpExpiresAt
    );

    // Send confirmation email via Resend
    await sendBetaTesterOtp(cleanEmail, app.app_name, platform, otpCode);

    return {
      already_active: false,
      message: `A 6-digit confirmation code has been sent to ${cleanEmail}. Please enter it to verify.`,
    };
  });
}

/**
 * Verify OTP, apply auto-eviction if full, and activate 14-day beta pass
 */
export async function verifyBetaAccessOtp(
  packageName: string,
  platform: "ios" | "android",
  email: string,
  otpCode: string
) {
  const cleanEmail = email.trim().toLowerCase();

  return withTransaction(async (client) => {
    const app = await apkRepo.getAppByPackageName(client, packageName);
    if (!app) {
      throw new HttpError(404, `App "${packageName}" not found`);
    }

    const tester = await apkRepo.findBetaTester(client, app.id, cleanEmail, platform);
    if (!tester) {
      throw new HttpError(400, "NO_REQUEST_FOUND", "No pending verification request found for this email. Please request a new code.");
    }

    // Check attempts limit (max failed attempts)
    if (tester.otp_attempts >= MAX_FAILED_OTP_ATTEMPTS) {
      throw new HttpError(
        400,
        "MAX_ATTEMPTS_EXCEEDED",
        "Too many failed verification attempts. Please request a new confirmation code."
      );
    }

    // Check expiry
    if (!tester.otp_expires_at || new Date(tester.otp_expires_at) < new Date()) {
      throw new HttpError(
        400,
        "OTP_EXPIRED",
        "Your verification code has expired. Please request a new code."
      );
    }

    // Validate OTP
    if (tester.otp_code !== otpCode.trim()) {
      await apkRepo.incrementTesterOtpAttempts(null, tester.id);
      throw new HttpError(
        400,
        "INVALID_OTP",
        "Incorrect verification code. Please check your email and try again."
      );
    }

    // Check active tester slot capacity
    const activeCount = await apkRepo.countActiveTesters(client, app.id, platform);

    // If slots are 100% full, auto-evict the oldest or expired tester (FIFO / LRU recycling)
    if (activeCount >= MAX_BETA_SLOTS_PER_PLATFORM) {
      const candidateToEvict = await apkRepo.getOldestActiveTester(client, app.id, platform);
      if (candidateToEvict) {
        await apkRepo.revokeBetaTester(
          client,
          candidateToEvict.id,
          "Slot recycled: auto-evicted to accommodate new tester (FIFO policy)"
        );

        // Revoke from Apple TestFlight if candidate had a store tester ID
        if (platform === "ios" && candidateToEvict.store_tester_id) {
          removeTesterFromAppleTestFlight(candidateToEvict.store_tester_id).catch(() => {});
        } else if (platform === "android") {
          removeTesterFromGooglePlay(
            candidateToEvict.email,
            app.package_name,
            app.google_tester_group_email?.trim() || undefined
          ).catch(() => {});
        }

        logger.info(
          `[Beta] Auto-evicted tester ${candidateToEvict.email} (${platform}) to free slot for ${cleanEmail}`
        );
      }
    }

    // Call official Apple/Google Store API to add the tester
    // When Apple TestFlight API accepts, Apple itself sends the official invitation email to the tester!
    let storeTesterId: string | null = null;
    let isDirectStoreInviteSent = false;
    let storeMessage = "";

    if (platform === "ios") {
      if (!app.apple_beta_group_id || !app.apple_beta_group_id.trim()) {
        throw new HttpError(
          400,
          "BETA_UNAVAILABLE",
          `Apple TestFlight beta testing for "${app.app_name}" is not yet available. Please configure the Beta Group ID in the dashboard.`
        );
      }
      const appleRes = await addTesterToAppleTestFlight(cleanEmail, app.apple_beta_group_id.trim());
      storeTesterId = appleRes.storeTesterId || null;
      isDirectStoreInviteSent = appleRes.isDirectStoreInviteSent;
      storeMessage = appleRes.message || "";
    } else {
      const googleRes = await addTesterToGooglePlay(
        cleanEmail,
        app.package_name,
        app.google_tester_group_email?.trim() || undefined
      );
      isDirectStoreInviteSent = googleRes.isDirectStoreInviteSent;
      storeMessage = googleRes.message || "";
    }

    // Activate 14-day demo pass
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    const activated = await apkRepo.activateBetaTester(client, tester.id, expiresAt, storeTesterId);

    // Schedule automatic expiration via Asynq task queue
    await scheduleBetaTesterExpiration(tester.id, expiresAt).catch((err) => {
      logger.error({ err, testerId: tester.id }, "[apk.service] Failed to schedule beta tester expiration in Asynq");
    });

    const storeUrl = platform === "ios" ? app.testflight_url : app.play_store_url;

    return {
      success: true,
      email: cleanEmail,
      platform,
      expires_at: expiresAt,
      store_url: storeUrl || null,
      is_direct_store_invite_sent: isDirectStoreInviteSent,
      message: isDirectStoreInviteSent
        ? `Official invite dispatched directly by ${platform === "ios" ? "Apple TestFlight" : "Google Play"} to ${cleanEmail}.`
        : `Verification successful! Your official store invite (${platform === "ios" ? "Apple TestFlight" : "Google Play Track"}) is now active for 14 days.`,
    };
  });
}

/**
 * Get live slot availability for public showcase
 */
export async function getBetaSlotInfo(packageName: string, platform: "ios" | "android") {
  return withTransaction(async (client) => {
    const app = await apkRepo.getAppByPackageName(client, packageName);
    if (!app) {
      throw new HttpError(404, `App "${packageName}" not found`);
    }

    const isAvailable = platform === "ios" ? Boolean(app.apple_beta_group_id && app.apple_beta_group_id.trim()) : true;
    const activeTesters = await apkRepo.countActiveTesters(client, app.id, platform);

    return {
      platform,
      is_available: isAvailable,
      max_slots: MAX_BETA_SLOTS_PER_PLATFORM,
      active_testers: activeTesters,
      remaining_slots: isAvailable ? Math.max(0, MAX_BETA_SLOTS_PER_PLATFORM - activeTesters) : 0,
    };
  });
}

/**
 * List beta testers for an app (admin dashboard)
 */
export async function listBetaTesters(appId: string) {
  return withTransaction(async (client) => {
    return await apkRepo.listBetaTestersByAppId(client, appId);
  });
}

/**
 * Admin manually revokes a tester
 */
export async function adminRevokeBetaTester(testerId: string, reason?: string) {
  return withTransaction(async (client) => {
    const updated = await apkRepo.revokeBetaTester(
      client,
      testerId,
      reason || "Manually revoked by administrator"
    );
    if (!updated) {
      throw new HttpError(404, "Beta tester not found");
    }

    // Call store API to revoke from Apple/Google
    if (updated.platform === "ios" && updated.store_tester_id) {
      removeTesterFromAppleTestFlight(updated.store_tester_id).catch(() => {});
    } else if (updated.platform === "android") {
      const app = await apkRepo.getAppById(client, updated.app_id);
      if (app) {
        removeTesterFromGooglePlay(
          updated.email,
          app.package_name,
          app.google_tester_group_email?.trim() || undefined
        ).catch(() => {});
      }
    }

    return updated;
  });
}

/**
 * Update app official store links (Play Store, App Store & TestFlight)
 */
export async function updateAppStoreLinks(
  appId: string,
  playStoreUrl?: string | null,
  appStoreUrl?: string | null,
  testflightUrl?: string | null,
  appleBetaGroupId?: string | null,
  googleTesterGroupEmail?: string | null
) {
  return withTransaction(async (client) => {
    const updated = await apkRepo.updateAppStoreLinks(
      client,
      appId,
      playStoreUrl,
      appStoreUrl,
      testflightUrl,
      appleBetaGroupId,
      googleTesterGroupEmail
    );
    if (!updated) {
      throw new HttpError(404, "App not found");
    }
    return updated;
  });
}

/**
 * Admin manually adds a beta tester directly without OTP
 */
export async function adminAddBetaTester(
  appId: string,
  email: string,
  platform: "ios" | "android",
  days: number = 14
) {
  const cleanEmail = email.trim().toLowerCase();
  return withTransaction(async (client) => {
    const app = await apkRepo.getAppById(client, appId);
    if (!app) {
      throw new HttpError(404, "App not found");
    }

    let storeTesterId: string | null = null;
    if (platform === "ios") {
      if (!app.apple_beta_group_id || !app.apple_beta_group_id.trim()) {
        throw new HttpError(
          400,
          "BETA_UNAVAILABLE",
          `Apple TestFlight beta testing for "${app.app_name}" is not yet available. Please configure the Beta Group ID in the dashboard.`
        );
      }
      const appleRes = await addTesterToAppleTestFlight(cleanEmail, app.apple_beta_group_id.trim());
      storeTesterId = appleRes.storeTesterId || null;
    } else {
      await addTesterToGooglePlay(
        cleanEmail,
        app.package_name,
        app.google_tester_group_email?.trim() || undefined
      );
    }

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const tester = await apkRepo.adminUpsertActiveTester(
      client,
      appId,
      cleanEmail,
      platform,
      expiresAt,
      storeTesterId
    );

    // Schedule automatic expiration via Asynq task queue
    await scheduleBetaTesterExpiration(tester.id, expiresAt).catch((err) => {
      logger.error({ err, testerId: tester.id }, "[apk.service] Failed to schedule beta tester expiration in Asynq");
    });

    return tester;
  });
}
