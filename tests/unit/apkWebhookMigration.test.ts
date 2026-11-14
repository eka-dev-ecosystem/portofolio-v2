import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { updateApkRepositorySchema } from "~~/server/model/apk.model";
import * as postgresDb from "~~/server/db/postgres";
import * as apkRepo from "~~/server/repositories/apk.repository";
import { handleGitHubWebhook } from "~~/server/services/apk.service";

describe("APK Repository Migration & Webhook Handling", () => {
  const mockClient = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Stub Nuxt runtime config
    (globalThis as any).useRuntimeConfig = () => ({
      jobWorkerUrl: "http://localhost:9090",
      jobWorkerSecret: "test-secret",
    });

    // Mock fetch for notifyWorker
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    // Mock withTransaction
    vi.spyOn(postgresDb, "withTransaction").mockImplementation(async (cb: any) => {
      return await cb(mockClient);
    });
  });

  describe("updateApkRepositorySchema", () => {
    it("should accept a valid new repo_slug format", () => {
      const validCases = [
        "eka-dev-ecosystem/winmix",
        "eka-dev-chat/mobile-chat-app",
        "owner123/repo.name",
        "user_name/project-repo",
      ];

      for (const slug of validCases) {
        const result = updateApkRepositorySchema.safeParse({ repo_slug: slug });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid repo_slug formats", () => {
      const invalidCases = [
        "just-repo-without-owner",
        "owner/repo/subpath",
        "invalid owner/repo",
        "owner/",
        "/repo",
        "",
      ];

      for (const slug of invalidCases) {
        const result = updateApkRepositorySchema.safeParse({ repo_slug: slug });
        expect(result.success).toBe(false);
      }
    });

    it("should allow omitting repo_slug for partial updates", () => {
      const result = updateApkRepositorySchema.safeParse({
        is_private: true,
        webhook_secret: "some-secret",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("handleGitHubWebhook smart migration & auto-healing", () => {
    const rawSecret = "super-secret-key-12345";

    const createSignature = (body: string, secret: string) => {
      return `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
    };

    it("should successfully process webhook when repo_slug matches directly", async () => {
      const payload = {
        action: "published",
        repository: {
          name: "winmix",
          full_name: "eka-dev-ecosystem/winmix",
        },
        release: {
          id: 12345,
          tag_name: "v1.2.0",
          assets: [{ name: "winmix-1.2.0.apk" }],
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = createSignature(rawBody, rawSecret);

      const getRepoBySlugSpy = vi.spyOn(apkRepo, "getRepositoryBySlug").mockResolvedValueOnce({
        id: "repo-uuid-1",
        repo_slug: "eka-dev-ecosystem/winmix",
        webhook_secret: rawSecret,
      } as any);

      const updateRepoSlugSpy = vi.spyOn(apkRepo, "updateRepositorySlug").mockResolvedValueOnce(null);

      const createSyncJobSpy = vi.spyOn(apkRepo, "createSyncJob").mockResolvedValueOnce({
        id: "job-uuid-1",
        repository_id: "repo-uuid-1",
        status: "pending",
      } as any);

      const result = await handleGitHubWebhook(rawBody, signature, "release", payload);

      expect(result.ok).toBe(true);
      expect(result.job_id).toBe("job-uuid-1");
      expect(getRepoBySlugSpy).toHaveBeenCalled();
      expect(updateRepoSlugSpy).not.toHaveBeenCalled();
      expect(createSyncJobSpy).toHaveBeenCalledWith(
        mockClient,
        "repo-uuid-1",
        "webhook",
        expect.objectContaining({ tag_name: "v1.2.0", release_id: 12345 })
      );
    });

    it("should auto-heal and migrate repo_slug when repo was transferred/renamed with valid HMAC signature", async () => {
      const oldSlug = "exa31/winmix";
      const newSlug = "eka-dev-ecosystem/winmix";

      const payload = {
        action: "published",
        repository: {
          name: "winmix",
          full_name: newSlug,
        },
        release: {
          id: 99999,
          tag_name: "v2.0.0",
          assets: [{ name: "winmix-release.apk" }],
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = createSignature(rawBody, rawSecret);

      // 1. Direct match by new slug returns null
      vi.spyOn(apkRepo, "getRepositoryBySlug").mockResolvedValueOnce(null);

      // 2. Candidate search by repo name returns old repository
      vi.spyOn(apkRepo, "getRepositoriesByName").mockResolvedValueOnce([
        {
          id: "repo-uuid-winmix",
          repo_slug: oldSlug,
          webhook_secret: rawSecret,
        } as any,
      ]);

      const updateRepoSlugSpy = vi.spyOn(apkRepo, "updateRepositorySlug").mockResolvedValueOnce({
        id: "repo-uuid-winmix",
        repo_slug: newSlug,
        webhook_secret: rawSecret,
      } as any);

      const createSyncJobSpy = vi.spyOn(apkRepo, "createSyncJob").mockResolvedValueOnce({
        id: "job-uuid-migrated",
        repository_id: "repo-uuid-winmix",
        status: "pending",
      } as any);

      const result = await handleGitHubWebhook(rawBody, signature, "release", payload);

      expect(result.ok).toBe(true);
      expect(result.job_id).toBe("job-uuid-migrated");
      // Verified that updateRepositorySlug was called with the new slug
      expect(updateRepoSlugSpy).toHaveBeenCalledWith(
        mockClient,
        "repo-uuid-winmix",
        newSlug
      );
      // Verified sync job was created
      expect(createSyncJobSpy).toHaveBeenCalledWith(
        mockClient,
        "repo-uuid-winmix",
        "webhook",
        expect.objectContaining({ tag_name: "v2.0.0", release_id: 99999 })
      );
    });

    it("should reject with 404 if candidates exist but HMAC signature does not match (preventing spoofing)", async () => {
      const newSlug = "malicious-user/winmix";
      const payload = {
        action: "published",
        repository: {
          name: "winmix",
          full_name: newSlug,
        },
        release: {
          id: 11111,
          tag_name: "v1.0.0",
        },
      };

      const rawBody = JSON.stringify(payload);
      // Signature signed with wrong attacker secret
      const invalidSignature = createSignature(rawBody, "attacker-secret-xyz");

      vi.spyOn(apkRepo, "getRepositoryBySlug").mockResolvedValueOnce(null);
      vi.spyOn(apkRepo, "getRepositoriesByName").mockResolvedValueOnce([
        {
          id: "repo-uuid-winmix",
          repo_slug: "exa31/winmix",
          webhook_secret: rawSecret, // legitimate secret
        } as any,
      ]);

      const updateRepoSlugSpy = vi.spyOn(apkRepo, "updateRepositorySlug");
      const createSyncJobSpy = vi.spyOn(apkRepo, "createSyncJob");

      await expect(
        handleGitHubWebhook(rawBody, invalidSignature, "release", payload)
      ).rejects.toThrow('Repository "malicious-user/winmix" is not registered in APK Store');

      expect(updateRepoSlugSpy).not.toHaveBeenCalled();
      expect(createSyncJobSpy).not.toHaveBeenCalled();
    });

    it("should ignore non-release webhook events gracefully", async () => {
      const payload = {
        action: "deleted",
        repository: { full_name: "eka-dev-ecosystem/winmix" },
      };

      const result = await handleGitHubWebhook("{}", "dummy", "issues", payload);
      expect(result.ok).toBe(true);
      expect(result.ignored).toBe(true);
    });
  });
});
