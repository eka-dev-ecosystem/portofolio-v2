import type { PoolClient } from "pg";
import { query } from "~~/server/db/postgres";
import type {
  ApkAppModel,
  ApkBetaTesterModel,
  ApkReleaseModel,
  ApkRepositoryModel,
  ApkSyncJobModel,
  CreateApkRepositoryInput,
  UpdateApkRepositoryInput,
} from "~~/server/model/apk.model";

// ==========================================
// REPOSITORIES
// ==========================================

export const createRepository = async (
  client: PoolClient,
  data: CreateApkRepositoryInput & { webhook_secret: string }
): Promise<ApkRepositoryModel> => {
  const sql = `
    INSERT INTO apk_repositories (repo_slug, is_private, access_token, webhook_secret, asset_filter_regex)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [
    data.repo_slug,
    data.is_private ?? false,
    data.access_token || null,
    data.webhook_secret,
    data.asset_filter_regex || ".*\\.apk$",
  ];
  const res = await client.query<ApkRepositoryModel>(sql, values);
  return res.rows[0];
};

export const updateRepository = async (
  client: PoolClient,
  id: string,
  data: UpdateApkRepositoryInput
): Promise<ApkRepositoryModel | null> => {
  const updates: string[] = [];
  const values: unknown[] = [id];
  let idx = 2;

  if (data.repo_slug !== undefined) {
    updates.push(`repo_slug = $${idx++}`);
    values.push(data.repo_slug);
  }
  if (data.is_private !== undefined) {
    updates.push(`is_private = $${idx++}`);
    values.push(data.is_private);
  }
  if (data.access_token !== undefined) {
    updates.push(`access_token = $${idx++}`);
    values.push(data.access_token);
  }
  if (data.webhook_secret !== undefined) {
    updates.push(`webhook_secret = $${idx++}`);
    values.push(data.webhook_secret);
  }
  if (data.asset_filter_regex !== undefined) {
    updates.push(`asset_filter_regex = $${idx++}`);
    values.push(data.asset_filter_regex);
  }

  if (updates.length === 0) {
    return getRepositoryById(client, id);
  }

  updates.push(`updated_at = current_timestamp`);

  const sql = `
    UPDATE apk_repositories
    SET ${updates.join(", ")}
    WHERE id = $1
    RETURNING *
  `;
  const res = await client.query<ApkRepositoryModel>(sql, values);
  return res.rows[0] || null;
};

export const deleteRepository = async (
  client: PoolClient,
  id: string
): Promise<boolean> => {
  const res = await client.query(
    "DELETE FROM apk_repositories WHERE id = $1",
    [id]
  );
  return (res.rowCount ?? 0) > 0;
};

export const getRepositoryById = async (
  client: PoolClient,
  id: string
): Promise<ApkRepositoryModel | null> => {
  const res = await client.query<ApkRepositoryModel>(
    "SELECT * FROM apk_repositories WHERE id = $1",
    [id]
  );
  return res.rows[0] || null;
};

export const getRepositoryBySlug = async (
  client: PoolClient,
  slug: string
): Promise<ApkRepositoryModel | null> => {
  const res = await client.query<ApkRepositoryModel>(
    "SELECT * FROM apk_repositories WHERE LOWER(repo_slug) = LOWER($1)",
    [slug]
  );
  return res.rows[0] || null;
};

export const getRepositoriesByName = async (
  client: PoolClient,
  repoName: string
): Promise<ApkRepositoryModel[]> => {
  const res = await client.query<ApkRepositoryModel>(
    "SELECT * FROM apk_repositories WHERE LOWER(repo_slug) LIKE '%/' || LOWER($1)",
    [repoName]
  );
  return res.rows;
};

export const updateRepositorySlug = async (
  client: PoolClient,
  id: string,
  newSlug: string
): Promise<ApkRepositoryModel | null> => {
  const res = await client.query<ApkRepositoryModel>(
    "UPDATE apk_repositories SET repo_slug = $1, updated_at = current_timestamp WHERE id = $2 RETURNING *",
    [newSlug, id]
  );
  return res.rows[0] || null;
};

export const listRepositories = async (
  client: PoolClient
): Promise<(ApkRepositoryModel & { app_count: number; release_count: number })[]> => {
  const sql = `
    SELECT r.*,
      COUNT(DISTINCT a.id)::int AS app_count,
      COUNT(DISTINCT rel.id)::int AS release_count
    FROM apk_repositories r
    LEFT JOIN apk_apps a ON a.repo_id = r.id
    LEFT JOIN apk_releases rel ON rel.app_id = a.id
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `;
  const res = await client.query<
    ApkRepositoryModel & { app_count: number; release_count: number }
  >(sql);
  return res.rows;
};

// ==========================================
// APPS
// ==========================================

export const upsertApp = async (
  client: PoolClient,
  data: {
    repo_id: string;
    package_name: string;
    app_name: string;
    description?: string | null;
    icon_url?: string | null;
    latest_version_code: number;
    latest_version_name?: string | null;
    supported_platforms?: string[];
  }
): Promise<ApkAppModel> => {
  const sql = `
    INSERT INTO apk_apps (
      repo_id, package_name, app_name, description, icon_url,
      latest_version_code, latest_version_name, supported_platforms, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, ARRAY[]::text[]), current_timestamp)
    ON CONFLICT (package_name) DO UPDATE SET
      repo_id = EXCLUDED.repo_id,
      app_name = EXCLUDED.app_name,
      description = COALESCE(EXCLUDED.description, apk_apps.description),
      icon_url = COALESCE(EXCLUDED.icon_url, apk_apps.icon_url),
      latest_version_code = GREATEST(apk_apps.latest_version_code, EXCLUDED.latest_version_code),
      latest_version_name = CASE
        WHEN EXCLUDED.latest_version_code >= apk_apps.latest_version_code
        THEN EXCLUDED.latest_version_name
        ELSE apk_apps.latest_version_name
      END,
      supported_platforms = CASE
        WHEN EXCLUDED.supported_platforms IS NOT NULL AND array_length(EXCLUDED.supported_platforms, 1) > 0
        THEN EXCLUDED.supported_platforms
        ELSE apk_apps.supported_platforms
      END,
      updated_at = current_timestamp
    RETURNING *
  `;
  const values = [
    data.repo_id,
    data.package_name,
    data.app_name,
    data.description || null,
    data.icon_url || null,
    data.latest_version_code,
    data.latest_version_name || null,
    data.supported_platforms || null,
  ];
  const res = await client.query<ApkAppModel>(sql, values);
  return res.rows[0];
};

export const getAppByPackageName = async (
  client: PoolClient,
  packageName: string
): Promise<ApkAppModel | null> => {
  const sql = `
    SELECT a.*, r.repo_slug,
      COALESCE(
        (SELECT array_agg(DISTINCT rel.platform) FROM apk_releases rel WHERE rel.app_id = a.id AND rel.platform IS NOT NULL AND rel.platform != 'unknown'),
        a.supported_platforms,
        ARRAY[]::text[]
      ) AS supported_platforms
    FROM apk_apps a
    JOIN apk_repositories r ON r.id = a.repo_id
    WHERE a.package_name = $1
  `;
  const res = await client.query<ApkAppModel>(sql, [packageName]);
  return res.rows[0] || null;
};

export const getAppById = async (
  client: PoolClient,
  id: string
): Promise<ApkAppModel | null> => {
  const sql = `
    SELECT a.*, r.repo_slug,
      COALESCE(
        (SELECT array_agg(DISTINCT rel.platform) FROM apk_releases rel WHERE rel.app_id = a.id AND rel.platform IS NOT NULL AND rel.platform != 'unknown'),
        a.supported_platforms,
        ARRAY[]::text[]
      ) AS supported_platforms
    FROM apk_apps a
    JOIN apk_repositories r ON r.id = a.repo_id
    WHERE a.id = $1
  `;
  const res = await client.query<ApkAppModel>(sql, [id]);
  return res.rows[0] || null;
};

export const listPublishedApps = async (
  client: PoolClient
): Promise<(ApkAppModel & { latest_release?: ApkReleaseModel | null })[]> => {
  const sql = `
    SELECT a.*, r.repo_slug,
      COALESCE(
        (SELECT array_agg(DISTINCT rel2.platform) FROM apk_releases rel2 WHERE rel2.app_id = a.id AND rel2.platform IS NOT NULL AND rel2.platform != 'unknown'),
        a.supported_platforms,
        ARRAY[]::text[]
      ) AS supported_platforms,
      json_build_object(
        'id', rel.id,
        'tag_name', rel.tag_name,
        'version_code', rel.version_code,
        'version_name', rel.version_name,
        'status', rel.status,
        'platform', rel.platform,
        'original_filename', rel.original_filename,
        'min_sdk', rel.min_sdk,
        'target_sdk', rel.target_sdk,
        'changelog', rel.changelog,
        'file_size_bytes', rel.file_size_bytes,
        'sha256_hash', rel.sha256_hash,
        'published_at', rel.published_at
      ) AS latest_release
    FROM apk_apps a
    JOIN apk_repositories r ON r.id = a.repo_id
    LEFT JOIN LATERAL (
      SELECT * FROM apk_releases
      WHERE app_id = a.id
      ORDER BY version_code DESC,
        CASE
          WHEN platform = 'macos' AND (original_filename ILIKE '%.dmg' OR original_filename ILIKE '%.pkg') THEN 1
          WHEN platform = 'windows' AND (original_filename ILIKE '%.exe' OR original_filename ILIKE '%.msi') THEN 1
          WHEN platform = 'android' AND original_filename ILIKE '%.apk' THEN 1
          WHEN platform = 'linux' AND (original_filename ILIKE '%.appimage' OR original_filename ILIKE '%.deb') THEN 1
          ELSE 2
        END ASC,
        created_at DESC
      LIMIT 1
    ) rel ON true
    WHERE a.is_published = true
    ORDER BY a.updated_at DESC
  `;
  const res = await client.query(sql);
  return res.rows;
};

export const listAllApps = async (
  client: PoolClient
): Promise<(ApkAppModel & { release_count: number })[]> => {
  const sql = `
    SELECT a.*, r.repo_slug,
      COALESCE(
        (SELECT array_agg(DISTINCT rel2.platform) FROM apk_releases rel2 WHERE rel2.app_id = a.id AND rel2.platform IS NOT NULL AND rel2.platform != 'unknown'),
        a.supported_platforms,
        ARRAY[]::text[]
      ) AS supported_platforms,
      (SELECT COUNT(*)::int FROM apk_releases WHERE app_id = a.id) AS release_count
    FROM apk_apps a
    JOIN apk_repositories r ON r.id = a.repo_id
    ORDER BY a.updated_at DESC
  `;
  const res = await client.query(sql);
  return res.rows;
};

export const updateAppStatus = async (
  client: PoolClient,
  id: string,
  status: "development" | "production"
): Promise<ApkAppModel | null> => {
  const sql = `
    UPDATE apk_apps
    SET status = $1, updated_at = current_timestamp
    WHERE id = $2
    RETURNING *
  `;
  const res = await client.query<ApkAppModel>(sql, [status, id]);
  return res.rows[0] || null;
};

export const updateAppStoreLinks = async (
  client: PoolClient,
  id: string,
  playStoreUrl?: string | null,
  appStoreUrl?: string | null,
  testflightUrl?: string | null,
  appleBetaGroupId?: string | null,
  googleTesterGroupEmail?: string | null
): Promise<ApkAppModel | null> => {
  const sql = `
    UPDATE apk_apps
    SET play_store_url = $1,
        app_store_url = $2,
        testflight_url = $3,
        apple_beta_group_id = $4,
        google_tester_group_email = $5,
        updated_at = current_timestamp
    WHERE id = $6
    RETURNING *
  `;
  const res = await client.query<ApkAppModel>(sql, [
    playStoreUrl && playStoreUrl.trim() ? playStoreUrl.trim() : null,
    appStoreUrl && appStoreUrl.trim() ? appStoreUrl.trim() : null,
    testflightUrl && testflightUrl.trim() ? testflightUrl.trim() : null,
    appleBetaGroupId && appleBetaGroupId.trim() ? appleBetaGroupId.trim() : null,
    googleTesterGroupEmail && googleTesterGroupEmail.trim() ? googleTesterGroupEmail.trim() : null,
    id,
  ]);
  return res.rows[0] || null;
};

export const updateReleaseStatus = async (
  client: PoolClient,
  id: string,
  status: "development" | "production"
): Promise<ApkReleaseModel | null> => {
  const sql = `
    UPDATE apk_releases
    SET status = $1
    WHERE id = $2
    RETURNING *
  `;
  const res = await client.query<ApkReleaseModel>(sql, [status, id]);
  return res.rows[0] || null;
};

export const incrementAppDownload = async (
  client: PoolClient,
  appId: string
): Promise<void> => {
  await client.query(
    "UPDATE apk_apps SET download_count = download_count + 1 WHERE id = $1",
    [appId]
  );
};

// ==========================================
// RELEASES
// ==========================================

export const upsertRelease = async (
  client: PoolClient,
  data: {
    app_id: string;
    github_release_id?: number | null;
    tag_name: string;
    version_code: number;
    version_name: string;
    platform?: string;
    original_filename?: string;
    arch?: string | null;
    min_sdk?: number | null;
    target_sdk?: number | null;
    changelog?: string | null;
    file_size_bytes: number;
    sha256_hash?: string | null;
    storage_path?: string | null;
    download_url?: string | null;
    published_at?: string | null;
  }
): Promise<ApkReleaseModel> => {
  const platform = data.platform || "android";
  const originalFilename = data.original_filename || "";

  const sql = `
    INSERT INTO apk_releases (
      app_id, github_release_id, tag_name, version_code, version_name,
      platform, original_filename, arch,
      min_sdk, target_sdk, changelog, file_size_bytes, sha256_hash,
      storage_path, download_url, published_at, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, current_timestamp)
    ON CONFLICT (app_id, version_code, platform, original_filename) DO UPDATE SET
      github_release_id = COALESCE(EXCLUDED.github_release_id, apk_releases.github_release_id),
      tag_name = EXCLUDED.tag_name,
      version_name = EXCLUDED.version_name,
      arch = COALESCE(EXCLUDED.arch, apk_releases.arch),
      min_sdk = COALESCE(EXCLUDED.min_sdk, apk_releases.min_sdk),
      target_sdk = COALESCE(EXCLUDED.target_sdk, apk_releases.target_sdk),
      changelog = COALESCE(EXCLUDED.changelog, apk_releases.changelog),
      file_size_bytes = EXCLUDED.file_size_bytes,
      sha256_hash = COALESCE(EXCLUDED.sha256_hash, apk_releases.sha256_hash),
      storage_path = COALESCE(EXCLUDED.storage_path, apk_releases.storage_path),
      download_url = COALESCE(EXCLUDED.download_url, apk_releases.download_url),
      published_at = COALESCE(EXCLUDED.published_at, apk_releases.published_at)
    RETURNING *
  `;
  const values = [
    data.app_id,
    data.github_release_id || null,
    data.tag_name,
    data.version_code,
    data.version_name,
    platform,
    originalFilename,
    data.arch || "universal",
    data.min_sdk || null,
    data.target_sdk || null,
    data.changelog || null,
    data.file_size_bytes,
    data.sha256_hash || null,
    data.storage_path || null,
    data.download_url || null,
    data.published_at || null,
  ];
  const res = await client.query<ApkReleaseModel>(sql, values);
  return res.rows[0];
};

export const getReleaseByVersion = async (
  client: PoolClient,
  appId: string,
  versionCode: number,
  platform?: string
): Promise<ApkReleaseModel | null> => {
  let sql = `
    SELECT * FROM apk_releases
    WHERE app_id = $1 AND version_code = $2
  `;
  const values: any[] = [appId, versionCode];
  if (platform) {
    sql += ` AND platform = $3`;
    values.push(platform);
  }
  sql += ` ORDER BY created_at DESC LIMIT 1`;
  const res = await client.query<ApkReleaseModel>(sql, values);
  return res.rows[0] || null;
};

export const getLatestRelease = async (
  client: PoolClient,
  appId: string,
  platform?: string
): Promise<ApkReleaseModel | null> => {
  let sql = `
    SELECT * FROM apk_releases
    WHERE app_id = $1
  `;
  const values: any[] = [appId];
  if (platform) {
    sql += ` AND platform = $2`;
    values.push(platform);
  }
  sql += ` ORDER BY version_code DESC,
    CASE
      WHEN platform = 'macos' AND (original_filename ILIKE '%.dmg' OR original_filename ILIKE '%.pkg') THEN 1
      WHEN platform = 'windows' AND (original_filename ILIKE '%.exe' OR original_filename ILIKE '%.msi') THEN 1
      WHEN platform = 'android' AND original_filename ILIKE '%.apk' THEN 1
      WHEN platform = 'linux' AND (original_filename ILIKE '%.appimage' OR original_filename ILIKE '%.deb') THEN 1
      ELSE 2
    END ASC,
    created_at DESC
    LIMIT 1`;
  const res = await client.query<ApkReleaseModel>(sql, values);
  return res.rows[0] || null;
};

export const listReleasesByAppId = async (
  client: PoolClient,
  appId: string
): Promise<ApkReleaseModel[]> => {
  const sql = `
    SELECT * FROM apk_releases
    WHERE app_id = $1
    ORDER BY version_code DESC
  `;
  const res = await client.query<ApkReleaseModel>(sql, [appId]);
  return res.rows;
};

export const incrementReleaseDownload = async (
  client: PoolClient,
  releaseId: string
): Promise<void> => {
  await client.query(
    "UPDATE apk_releases SET download_count = download_count + 1 WHERE id = $1",
    [releaseId]
  );
};

// ==========================================
// SYNC JOBS
// ==========================================

export const createSyncJob = async (
  client: PoolClient,
  repoId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<ApkSyncJobModel> => {
  const sql = `
    INSERT INTO apk_sync_jobs (repo_id, event_type, status, payload)
    VALUES ($1, $2, 'pending', $3)
    RETURNING *
  `;
  const res = await client.query<ApkSyncJobModel>(sql, [
    repoId,
    eventType,
    JSON.stringify(payload),
  ]);
  return res.rows[0];
};

export const updateSyncJobStatus = async (
  client: PoolClient,
  id: string,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string | null
): Promise<void> => {
  const sql = `
    UPDATE apk_sync_jobs
    SET status = $2, error_message = $3, updated_at = current_timestamp
    WHERE id = $1
  `;
  await client.query(sql, [id, status, errorMessage || null]);
};

export const listRecentSyncJobs = async (
  client: PoolClient,
  limit: number = 20
): Promise<(ApkSyncJobModel & { repo_slug: string })[]> => {
  const sql = `
    SELECT j.*, r.repo_slug
    FROM apk_sync_jobs j
    JOIN apk_repositories r ON r.id = j.repo_id
    ORDER BY j.created_at DESC
    LIMIT $1
  `;
  const res = await client.query<ApkSyncJobModel & { repo_slug: string }>(sql, [limit]);
  return res.rows;
};

// ==========================================
// BETA TESTERS & STORE ACCESS
// ==========================================

export const upsertBetaTesterOtp = async (
  client: PoolClient,
  appId: string,
  email: string,
  platform: "ios" | "android",
  otpCode: string,
  otpExpiresAt: Date
): Promise<ApkBetaTesterModel> => {
  const existing = await client.query<ApkBetaTesterModel>(
    `SELECT * FROM apk_beta_testers WHERE app_id = $1 AND LOWER(email) = LOWER($2) AND platform = $3`,
    [appId, email, platform]
  );

  if (existing.rows.length > 0) {
    const updated = await client.query<ApkBetaTesterModel>(
      `UPDATE apk_beta_testers
       SET otp_code = $1, otp_expires_at = $2, otp_attempts = 0, updated_at = current_timestamp
       WHERE id = $3
       RETURNING *`,
      [otpCode, otpExpiresAt, existing.rows[0].id]
    );
    return updated.rows[0];
  }

  const res = await client.query<ApkBetaTesterModel>(
    `INSERT INTO apk_beta_testers (app_id, email, platform, status, otp_code, otp_expires_at, otp_attempts)
     VALUES ($1, LOWER($2), $3, 'pending_otp', $4, $5, 0)
     RETURNING *`,
    [appId, email, platform, otpCode, otpExpiresAt]
  );
  return res.rows[0];
};

export const findBetaTester = async (
  client: PoolClient,
  appId: string,
  email: string,
  platform: "ios" | "android"
): Promise<ApkBetaTesterModel | null> => {
  const res = await client.query<ApkBetaTesterModel>(
    `SELECT * FROM apk_beta_testers
     WHERE app_id = $1 AND LOWER(email) = LOWER($2) AND platform = $3`,
    [appId, email, platform]
  );
  return res.rows[0] || null;
};

export const countActiveTesters = async (
  client: PoolClient,
  appId: string,
  platform: "ios" | "android"
): Promise<number> => {
  // Count only active testers whose 14-day expiry has not passed yet
  const res = await client.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count
     FROM apk_beta_testers
     WHERE app_id = $1 AND platform = $2 AND status = 'active' AND (expires_at IS NULL OR expires_at > current_timestamp)`,
    [appId, platform]
  );
  return parseInt(res.rows[0]?.count || "0", 10);
};

export const getOldestActiveTester = async (
  client: PoolClient,
  appId: string,
  platform: "ios" | "android"
): Promise<ApkBetaTesterModel | null> => {
  // Priority 1: Expired testers still marked active
  const expired = await client.query<ApkBetaTesterModel>(
    `SELECT * FROM apk_beta_testers
     WHERE app_id = $1 AND platform = $2 AND status = 'active' AND expires_at <= current_timestamp
     ORDER BY expires_at ASC
     LIMIT 1`,
    [appId, platform]
  );
  if (expired.rows.length > 0) return expired.rows[0];

  // Priority 2: Oldest active tester (FIFO / LRU eviction)
  const oldest = await client.query<ApkBetaTesterModel>(
    `SELECT * FROM apk_beta_testers
     WHERE app_id = $1 AND platform = $2 AND status = 'active'
     ORDER BY created_at ASC
     LIMIT 1`,
    [appId, platform]
  );
  return oldest.rows[0] || null;
};

export const activateBetaTester = async (
  client: PoolClient,
  id: string,
  expiresAt: Date,
  storeTesterId?: string | null
): Promise<ApkBetaTesterModel> => {
  const res = await client.query<ApkBetaTesterModel>(
    `UPDATE apk_beta_testers
     SET status = 'active', otp_code = NULL, otp_expires_at = NULL, expires_at = $1,
         store_tester_id = COALESCE($3, store_tester_id), updated_at = current_timestamp
     WHERE id = $2
     RETURNING *`,
    [expiresAt, id, storeTesterId || null]
  );
  return res.rows[0];
};

export const incrementTesterOtpAttempts = async (
  client: PoolClient | null | undefined,
  id: string
): Promise<number> => {
  const sql = `
    UPDATE apk_beta_testers
    SET otp_attempts = otp_attempts + 1, updated_at = current_timestamp
    WHERE id = $1
    RETURNING otp_attempts
  `;
  const res = client
    ? await client.query<{ otp_attempts: number }>(sql, [id])
    : await query<{ otp_attempts: number }>(sql, [id]);
  return res.rows[0]?.otp_attempts || 0;
};

export const revokeBetaTester = async (
  client: PoolClient,
  id: string,
  reason: string
): Promise<ApkBetaTesterModel | null> => {
  const res = await client.query<ApkBetaTesterModel>(
    `UPDATE apk_beta_testers
     SET status = 'revoked', revoked_reason = $1, updated_at = current_timestamp
     WHERE id = $2
     RETURNING *`,
    [reason, id]
  );
  return res.rows[0] || null;
};

export const listBetaTestersByAppId = async (
  client: PoolClient,
  appId: string
): Promise<ApkBetaTesterModel[]> => {
  const res = await client.query<ApkBetaTesterModel>(
    `SELECT * FROM apk_beta_testers
     WHERE app_id = $1
     ORDER BY created_at DESC`,
    [appId]
  );
  return res.rows;
};

export const adminUpsertActiveTester = async (
  client: PoolClient,
  appId: string,
  email: string,
  platform: "ios" | "android",
  expiresAt: Date,
  storeTesterId?: string | null
): Promise<ApkBetaTesterModel> => {
  const existing = await client.query<ApkBetaTesterModel>(
    `SELECT * FROM apk_beta_testers WHERE app_id = $1 AND LOWER(email) = LOWER($2) AND platform = $3`,
    [appId, email, platform]
  );

  if (existing.rows.length > 0) {
    const updated = await client.query<ApkBetaTesterModel>(
      `UPDATE apk_beta_testers
       SET status = 'active', expires_at = $1, store_tester_id = COALESCE($3, store_tester_id), revoked_reason = NULL, otp_code = NULL, otp_expires_at = NULL, updated_at = current_timestamp
       WHERE id = $2
       RETURNING *`,
      [expiresAt, existing.rows[0].id, storeTesterId || null]
    );
    return updated.rows[0];
  }

  const res = await client.query<ApkBetaTesterModel>(
    `INSERT INTO apk_beta_testers (app_id, email, platform, status, expires_at, store_tester_id)
     VALUES ($1, LOWER($2), $3, 'active', $4, $5)
     RETURNING *`,
    [appId, email, platform, expiresAt, storeTesterId || null]
  );
  return res.rows[0];
};

