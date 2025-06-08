// Template URL utilities to keep URLs clean and secure

interface TemplateData {
  prompt?: string
  style?: string
  platform?: string
  templateTitle?: string
  templateDescription?: string
  isTransformTemplate?: boolean
  caption?: string
  settings?: any
  templateId?: string
}

/**
 * Creates a clean URL for templates and stores sensitive data in sessionStorage
 * This keeps URLs short and hides prompt/template information
 */
export function createTemplateUrl(templateData: TemplateData): string {
  // Store sensitive data in sessionStorage
  const sessionData = {
    prompt: templateData.prompt,
    caption: templateData.caption,
    isFromTemplate: Boolean(templateData.prompt),
    isTransformTemplate: templateData.isTransformTemplate || false,
    templateInfo: {
      title: templateData.templateTitle,
      description: templateData.templateDescription
    },
    settings: {
      style: templateData.style,
      platform: templateData.platform,
      ...templateData.settings
    },
    templateId: templateData.templateId
  }
  
  // Only store in sessionStorage if we're in the browser
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('templateData', JSON.stringify(sessionData))
    console.log('📱 Template data stored in sessionStorage:', sessionData)
  }
  
  // Return clean URL with only basic parameters
  const params = new URLSearchParams()
  if (templateData.isTransformTemplate) {
    params.set('mode', 'transform')
  }
  if (templateData.templateId) {
    params.set('template', templateData.templateId)
  }
  
  const queryString = params.toString()
  return `/generate${queryString ? `?${queryString}` : ''}`
}

/**
 * Navigates to generate page with template data using clean URL
 */
export function navigateToTemplate(templateData: TemplateData): void {
  if (typeof window !== 'undefined') {
    const url = createTemplateUrl(templateData)
    window.location.href = url
  }
}

/**
 * Creates a link for templates that can be used with Next.js Link component
 */
export function getTemplateLinkProps(templateData: TemplateData) {
  return {
    href: createTemplateUrl(templateData),
    onClick: () => {
      // Store data when link is clicked
      if (typeof window !== 'undefined') {
        const sessionData = {
          prompt: templateData.prompt,
          caption: templateData.caption,
          isFromTemplate: Boolean(templateData.prompt),
          isTransformTemplate: templateData.isTransformTemplate || false,
          templateInfo: {
            title: templateData.templateTitle,
            description: templateData.templateDescription
          },
          settings: {
            style: templateData.style,
            platform: templateData.platform,
            ...templateData.settings
          },
          templateId: templateData.templateId
        }
        sessionStorage.setItem('templateData', JSON.stringify(sessionData))
      }
    }
  }
}

/**
 * Clears template data from sessionStorage
 */
export function clearTemplateData(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('templateData')
  }
}

/**
 * Gets template data from sessionStorage and clears it
 */
export function getAndClearTemplateData(): any | null {
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem('templateData')
    if (data) {
      sessionStorage.removeItem('templateData')
      try {
        return JSON.parse(data)
      } catch (error) {
        console.error('Error parsing template data:', error)
        return null
      }
    }
  }
  return null
} 