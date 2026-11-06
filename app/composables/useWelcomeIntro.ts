export const useWelcomeIntro = () => {
  const isIntroActive = useState<boolean>('welcome_intro_active', () => false)
  const isDismissing = useState<boolean>('welcome_intro_dismissing', () => false)
  const isReplay = useState<boolean>('welcome_intro_replay', () => false)

  const isClient = typeof window !== 'undefined'

  const checkAndInit = () => {
    if (!isClient) return
    const route = useRoute()

    // Never interrupt admin dashboard
    if (route.path.startsWith('/dashboard')) {
      isIntroActive.value = false
      return
    }

    const forceIntro = route.query?.intro === 'true' || route.query?.intro === '1'
    const seen = localStorage.getItem('portfolio_welcome_seen')

    if (forceIntro) {
      isReplay.value = true
      isDismissing.value = false
      isIntroActive.value = true
    } else if (!seen) {
      isReplay.value = false
      isDismissing.value = false
      isIntroActive.value = true
    }
  }

  const dismissIntro = (immediate = false) => {
    if (immediate) {
      isIntroActive.value = false
      isDismissing.value = false
      isReplay.value = false
      if (isClient) {
        localStorage.setItem('portfolio_welcome_seen', 'true')
      }
      return
    }

    if (isDismissing.value) return
    isDismissing.value = true

    if (isClient) {
      localStorage.setItem('portfolio_welcome_seen', 'true')
    }

    // Match iOS unlock slide-up transition duration
    setTimeout(() => {
      isIntroActive.value = false
      isDismissing.value = false
      isReplay.value = false
    }, 650)
  }

  const triggerReplay = () => {
    isReplay.value = true
    isDismissing.value = false
    isIntroActive.value = true
  }

  return {
    isIntroActive,
    isDismissing,
    isReplay,
    checkAndInit,
    dismissIntro,
    triggerReplay
  }
}
