import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Nuxt runtime globals
const stateStore = new Map<string, any>();
(globalThis as any).useState = (key: string, init: () => any) => {
  if (!stateStore.has(key)) {
    const val = { value: init() };
    stateStore.set(key, val);
  }
  return stateStore.get(key);
};

let currentRoute = { path: "/", query: {} as Record<string, string> };
(globalThis as any).useRoute = () => currentRoute;

// Ensure import.meta.client is true during test
(import.meta as any).client = true;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Ensure window is defined for node environment test
(globalThis as any).window = globalThis;

import { useWelcomeIntro } from "../../app/composables/useWelcomeIntro";

describe("useWelcomeIntro Composable Unit Tests", () => {
  beforeEach(() => {
    stateStore.clear();
    localStorage.clear();
    currentRoute = { path: "/", query: {} };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should activate intro on first visit when localStorage has no record", () => {
    const { isIntroActive, checkAndInit } = useWelcomeIntro();
    expect(isIntroActive.value).toBe(false);

    checkAndInit();
    expect(isIntroActive.value).toBe(true);
  });

  it("should NOT activate intro if user has already seen it", () => {
    localStorage.setItem("portfolio_welcome_seen", "true");
    const { isIntroActive, checkAndInit } = useWelcomeIntro();

    checkAndInit();
    expect(isIntroActive.value).toBe(false);
  });

  it("should force activate intro if ?intro=true query param is present", () => {
    localStorage.setItem("portfolio_welcome_seen", "true");
    currentRoute = { path: "/", query: { intro: "true" } };

    const { isIntroActive, isReplay, checkAndInit } = useWelcomeIntro();
    checkAndInit();

    expect(isIntroActive.value).toBe(true);
    expect(isReplay.value).toBe(true);
  });

  it("should NEVER activate intro on admin dashboard route", () => {
    currentRoute = { path: "/dashboard/apps", query: {} };
    const { isIntroActive, checkAndInit } = useWelcomeIntro();

    checkAndInit();
    expect(isIntroActive.value).toBe(false);
  });

  it("should record seen status and dismiss with unlock animation delay", () => {
    const { isIntroActive, isDismissing, checkAndInit, dismissIntro } = useWelcomeIntro();
    checkAndInit();
    expect(isIntroActive.value).toBe(true);

    dismissIntro();
    expect(isDismissing.value).toBe(true);
    expect(localStorage.getItem("portfolio_welcome_seen")).toBe("true");

    // Fast-forward animation timer
    vi.advanceTimersByTime(700);

    expect(isIntroActive.value).toBe(false);
    expect(isDismissing.value).toBe(false);
  });

  it("should allow instant dismissal without timer delay", () => {
    const { isIntroActive, checkAndInit, dismissIntro } = useWelcomeIntro();
    checkAndInit();
    expect(isIntroActive.value).toBe(true);

    dismissIntro(true);
    expect(isIntroActive.value).toBe(false);
    expect(localStorage.getItem("portfolio_welcome_seen")).toBe("true");
  });

  it("should support manual replay trigger", () => {
    const { isIntroActive, isReplay, triggerReplay } = useWelcomeIntro();
    triggerReplay();

    expect(isIntroActive.value).toBe(true);
    expect(isReplay.value).toBe(true);
  });
});
