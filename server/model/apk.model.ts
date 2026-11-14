import { z } from "zod";

export const createApkRepositorySchema = z.object({
  repo_slug: z
    .string()
    .min(3, "Repo slug is required")
    .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "Format must be owner/repo (e.g. acme/mobile-app)"),
  is_private: z.boolean().default(false),
  access_token: z.string().optional().nullable(),
  webhook_secret: z.string().optional(),
  asset_filter_regex: z.string().default(".*\\.(apk|exe|msi|dmg|pkg|AppImage|deb|zip)$"),
});

export type SupportedPlatform = "android" | "windows" | "macos" | "linux";

export type CreateApkRepositoryInput = z.infer<typeof createApkRepositorySchema>;

export const updateApkRepositorySchema = z.object({
  repo_slug: z
    .string()
    .min(3, "Repo slug is required")
    .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "Format must be owner/repo (e.g. acme/mobile-app)")
    .optional(),
  is_private: z.boolean().optional(),
  access_token: z.string().optional().nullable(),
  webhook_secret: z.string().optional(),
  asset_filter_regex: z.string().optional(),
});

export type UpdateApkRepositoryInput = z.infer<typeof updateApkRepositorySchema>;

export interface ApkRepositoryModel {
  id: string;
  repo_slug: string;
  is_private: boolean;
  access_token: string | null;
  webhook_secret: string;
  asset_filter_regex: string;
  created_at: string;
  updated_at: string;
}

export const updateAppStatusSchema = z.object({
  status: z.enum(["development", "production"]),
});

export const updateReleaseStatusSchema = z.object({
  status: z.enum(["development", "production"]),
});

export interface ApkAppModel {
  id: string;
  repo_id: string;
  package_name: string;
  app_name: string;
  description: string | null;
  icon_url: string | null;
  latest_version_code: number;
  latest_version_name: string | null;
  status: "development" | "production";
  supported_platforms?: string[];
  play_store_url?: string | null;
  app_store_url?: string | null;
  testflight_url?: string | null;
  apple_beta_group_id?: string | null;
  google_tester_group_email?: string | null;
  is_published: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  repo_slug?: string;
  release_count?: number;
}

export const updateStoreLinksSchema = z.object({
  play_store_url: z.string().nullable().optional(),
  app_store_url: z.string().nullable().optional(),
  testflight_url: z.string().nullable().optional(),
  apple_beta_group_id: z.string().nullable().optional(),
  google_tester_group_email: z.string().nullable().optional(),
});

export const adminAddTesterSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  platform: z.enum(["ios", "android"]),
  days: z.number().int().min(1).max(90).optional().default(14),
});

export interface ApkReleaseModel {
  id: string;
  app_id: string;
  github_release_id: number | null;
  tag_name: string;
  version_code: number;
  version_name: string;
  status: "development" | "production";
  platform: string;
  original_filename?: string;
  arch?: string | null;
  min_sdk: number | null;
  target_sdk: number | null;
  changelog: string | null;
  file_size_bytes: number;
  sha256_hash: string | null;
  storage_path: string | null;
  download_url: string | null;
  download_count: number;
  published_at: string | null;
  created_at: string;
}

export interface ApkAppDetail extends ApkAppModel {
  releases: ApkReleaseModel[];
}

export interface ApkSyncJobModel {
  id: string;
  repo_id: string;
  event_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const requestBetaOtpSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  platform: z.enum(["ios", "android"]),
});

export const verifyBetaOtpSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  platform: z.enum(["ios", "android"]),
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

export interface ApkBetaTesterModel {
  id: string;
  app_id: string;
  email: string;
  platform: "ios" | "android";
  status: "pending_otp" | "active" | "revoked" | "expired";
  store_tester_id?: string | null;
  otp_code: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  revoked_reason: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  app_name?: string;
  package_name?: string;
}

