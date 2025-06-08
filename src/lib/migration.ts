// Migration utility to move localStorage data to database
export async function migrateLocalStorageToDatabase() {
  try {
    const generationHistory = localStorage.getItem('generationHistory')
    if (!generationHistory) {
      console.log('No localStorage data to migrate')
      return { success: true, migrated: 0 }
    }

    const history = JSON.parse(generationHistory)
    if (!Array.isArray(history) || history.length === 0) {
      console.log('No valid localStorage data to migrate')
      return { success: true, migrated: 0 }
    }

    let migratedCount = 0
    const errors = []

    for (const item of history) {
      if (!item.imageUrl || !item.prompt) {
        continue // Skip invalid items
      }

      try {
        const response = await fetch('/api/images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: item.imageUrl,
            prompt: item.prompt,
            caption: item.caption || '',
            settings: {
              style: item.settings?.style || 'realistic',
              size: item.settings?.size || '1024x1024',
              platform: item.settings?.platform || 'instagram',
              quality: item.settings?.quality || 'standard'
            }
          })
        })

        if (response.ok) {
          migratedCount++
        } else {
          const errorData = await response.json()
          errors.push(`Failed to migrate item: ${errorData.error}`)
        }
      } catch (error) {
        errors.push(`Error migrating item: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Clear localStorage after successful migration
    if (migratedCount > 0) {
      localStorage.removeItem('generationHistory')
      console.log(`Successfully migrated ${migratedCount} items from localStorage to database`)
    }

    return { 
      success: true, 
      migrated: migratedCount, 
      errors: errors.length > 0 ? errors : undefined 
    }

  } catch (error) {
    console.error('Migration error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Migration failed' 
    }
  }
} 