import { describe, it, expect } from "vitest";
import { detectPlatform, getPlatformDisplayName } from "../../server/lib/platform";

describe("detectPlatform Unit Tests", () => {
  it("should detect android platform from .apk and .aab files", () => {
    expect(detectPlatform("f-tracker-mobile-v1.5.1-47.apk")).toBe("android");
    expect(detectPlatform("cyber-mobile-v1.1.1-35.apk")).toBe("android");
    expect(detectPlatform("app-release.apk")).toBe("android");
    expect(detectPlatform("bundle-release.aab")).toBe("android");
  });

  it("should detect macos platform from .dmg and .pkg files", () => {
    expect(detectPlatform("WinMix-v1.1.0.dmg")).toBe("macos");
    expect(detectPlatform("app-installer.pkg")).toBe("macos");
  });

  it("should detect windows platform from .exe and .msi files", () => {
    expect(detectPlatform("AnimeWallpaper.exe")).toBe("windows");
    expect(detectPlatform("installer.msi")).toBe("windows");
    expect(detectPlatform("setup.msix")).toBe("windows");
  });

  it("should detect linux platform from .AppImage, .deb, and .rpm files", () => {
    expect(detectPlatform("app-v1.0.0.AppImage")).toBe("linux");
    expect(detectPlatform("package_1.0.0_amd64.deb")).toBe("linux");
    expect(detectPlatform("app-1.0.0.x86_64.rpm")).toBe("linux");
  });

  it("should NOT detect WinMix as windows even though the app name starts with 'win'", () => {
    // When appName is WinMix, "win" from the app name is stripped and should not match Windows
    const result = detectPlatform("WinMix-v1.1.0.zip", "WinMix", "exa31/winmix");
    expect(result).not.toBe("windows");
    expect(result).toBe("unknown");
  });

  it("should detect windows from zip archives when Windows tokens are present", () => {
    expect(detectPlatform("AnimeWallpaper-v1.1.0-win-x64.zip")).toBe("windows");
    expect(detectPlatform("tool-windows-x64.zip")).toBe("windows");
    expect(detectPlatform("app_win32.zip")).toBe("windows");
    expect(detectPlatform("client-win64.zip")).toBe("windows");
  });

  it("should detect macos from zip archives when macOS tokens are present", () => {
    expect(detectPlatform("AnimeWallpaper-v1.1.0-macos-arm64.zip")).toBe("macos");
    expect(detectPlatform("app-darwin-x64.zip")).toBe("macos");
    expect(detectPlatform("tool-osx.zip")).toBe("macos");
  });

  it("should NOT misclassify darwin archives as windows even though darwin contains 'win'", () => {
    expect(detectPlatform("release-darwin-arm64.zip")).toBe("macos");
    expect(detectPlatform("release-darwin-arm64.zip")).not.toBe("windows");
  });

  it("should detect linux from zip archives when linux tokens are present", () => {
    expect(detectPlatform("tool-linux-x64.zip")).toBe("linux");
    expect(detectPlatform("app-ubuntu-x64.zip")).toBe("linux");
  });

  it("should return correct display names for platforms", () => {
    expect(getPlatformDisplayName("windows")).toBe("Windows (.exe)");
    expect(getPlatformDisplayName("macos")).toBe("macOS (.dmg)");
    expect(getPlatformDisplayName("android")).toBe("Android APK");
    expect(getPlatformDisplayName("linux")).toBe("Linux");
  });
});

