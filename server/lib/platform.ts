/**
 * Platform Detection & Normalization Utilities
 * Prevents misclassifying apps (e.g. Winmix) as Windows when they are macOS binaries.
 */

export type SupportedPlatform = "android" | "windows" | "macos" | "linux" | "ios";

/**
 * Detect OS platform from a file name using strict token boundaries.
 */
export function detectPlatform(
  filename: string,
  appName?: string,
  repoSlug?: string
): SupportedPlatform | "unknown" {
  if (!filename) return "unknown";
  const lower = filename.toLowerCase();

  // 1. Direct file extensions
  if (lower.endsWith(".apk") || lower.endsWith(".aab")) return "android";
  if (lower.endsWith(".dmg") || lower.endsWith(".pkg")) return "macos";
  if (
    lower.endsWith(".exe") ||
    lower.endsWith(".msi") ||
    lower.endsWith(".msix") ||
    lower.endsWith(".appx")
  ) {
    return "windows";
  }
  if (
    lower.endsWith(".appimage") ||
    lower.endsWith(".deb") ||
    lower.endsWith(".rpm")
  ) {
    return "linux";
  }
  if (lower.endsWith(".ipa")) return "ios";

  // 2. Token extraction: strip known app/repo name prefixes to avoid matching
  // substrings in app names like "winmix", "darwin", "twin", etc.
  let sanitized = lower;
  const prefixesToRemove = [
    appName?.toLowerCase(),
    repoSlug?.split("/")[1]?.toLowerCase(),
    repoSlug?.toLowerCase(),
  ].filter(Boolean) as string[];

  for (const prefix of prefixesToRemove) {
    if (sanitized.startsWith(prefix)) {
      sanitized = sanitized.slice(prefix.length);
      break;
    }
  }

  // Token boundary regex
  const hasToken = (pattern: RegExp) => pattern.test(sanitized);

  // macOS tokens
  const macRegex = /(?:^|[-_./+])(mac|macos|darwin|osx|apple)(?:$|[-_./+])/i;
  // Linux tokens
  const linuxRegex = /(?:^|[-_./+])(linux|ubuntu|debian|fedora|archlinux|unknown-linux-gnu)(?:$|[-_./+])/i;
  // Windows tokens: must be distinct words like win, win32, win64, windows, etc.
  const winRegex = /(?:^|[-_./+])(win|win32|win64|windows|x86_64-pc-windows|x64-windows|ia32-win)(?:$|[-_./+])/i;

  if (hasToken(macRegex)) return "macos";
  if (hasToken(linuxRegex)) return "linux";
  if (hasToken(winRegex)) return "windows";

  return "unknown";
}

/**
 * Return user-friendly platform label.
 */
export function getPlatformDisplayName(platform: string): string {
  switch (platform?.toLowerCase()) {
    case "windows":
      return "Windows (.exe)";
    case "macos":
      return "macOS (.dmg)";
    case "linux":
      return "Linux";
    case "android":
      return "Android APK";
    case "ios":
      return "iOS (TestFlight / App Store)";
    default:
      return platform || "Unknown Platform";
  }
}

