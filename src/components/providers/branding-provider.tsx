'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { BrandingConfig, BrandingContextType, defaultBranding, brandingStorage, brandingUtils } from '@/lib/branding'

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

interface BrandingProviderProps {
  children: ReactNode
  initialBranding?: Partial<BrandingConfig>
}

export function BrandingProvider({ children, initialBranding }: BrandingProviderProps) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding)
  const [departmentBranding] = useState<BrandingConfig | null>(null)

  // Load branding from localStorage on mount
  useEffect(() => {
    const storedBranding = brandingStorage.loadBranding()
    if (storedBranding) {
      setBranding(storedBranding)
    } else if (initialBranding) {
      const mergedBranding = brandingUtils.mergeBranding(defaultBranding, initialBranding)
      setBranding(mergedBranding)
    }
  }, [initialBranding])

  // Apply branding CSS variables to document
  useEffect(() => {
    const themeCSS = brandingUtils.generateThemeCSS(branding)
    
    // Create or update style element
    let styleElement = document.getElementById('fox-lms-branding-styles')
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'fox-lms-branding-styles'
      document.head.appendChild(styleElement)
    }
    
    styleElement.textContent = themeCSS
    
    // Cleanup on unmount
    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement)
      }
    }
  }, [branding])

  const updateBranding = (updates: Partial<BrandingConfig>) => {
    const newBranding = brandingUtils.mergeBranding(branding, updates)
    setBranding(newBranding)
    brandingStorage.saveBranding(newBranding)
  }

  const resetBranding = () => {
    setBranding(defaultBranding)
    brandingStorage.clearBranding()
  }

  const contextValue: BrandingContextType = {
    branding: departmentBranding || branding,
    departmentBranding: departmentBranding ? { departmentId: '', departmentName: '', branding: departmentBranding } : undefined,
    updateBranding,
    resetBranding,
  }

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding(): BrandingContextType {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}

// Hook for accessing specific branding properties
export function useBrandingValue<K extends keyof BrandingConfig>(key: K): BrandingConfig[K] {
  const { branding } = useBranding()
  return branding[key]
}

// Hook for updating specific branding properties
export function useBrandingUpdater() {
  const { updateBranding } = useBranding()
  return updateBranding
}
