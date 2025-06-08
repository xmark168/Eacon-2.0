// Utility to clean up old localStorage data
export function cleanupLocalStorage() {
  try {
    // Remove generation history
    localStorage.removeItem('generationHistory')
    
    // Remove any other old data if exists
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('eacon') || key.includes('generation') || key.includes('images'))) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log('LocalStorage cleanup completed')
  } catch (error) {
    console.error('Error cleaning up localStorage:', error)
  }
} 