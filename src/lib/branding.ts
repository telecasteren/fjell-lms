// Centralized branding configuration for FJELL-LMS
export interface BrandingConfig {
  // Application Identity
  appName: string;
  appShortName: string;
  appVersion: string;
  appDescription: string;
  companyName: string;

  // Visual Identity
  logo: {
    light: string;
    dark: string;
    favicon: string;
    alt: string;
  };

  // Color Scheme
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
  };

  // Typography
  typography: {
    fontFamily: string;
    fontWeights: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    fontSizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
      "4xl": string;
    };
  };

  // Links and URLs
  links: {
    homepage: string;
    contact?: string;
    link1: string;
    link2: string;
    link3: string;
    terms?: string;
    faq?: string;
  };

  // Features
  features: {
    enableDarkMode: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
    enableFeedback: boolean;
  };

  // Customization
  customization: {
    allowThemeOverride: boolean;
    allowLogoOverride: boolean;
    allowColorOverride: boolean;
  };
}

// Default branding configuration
export const defaultBranding: BrandingConfig = {
  appName: "FJELL-LMS",
  appShortName: "FJELL",
  appVersion: "1.0.0",
  appDescription: "Reaching higher, together.",
  companyName: "FJELL-LMS",

  logo: {
    light: "/fjell_lms-logo.svg",
    dark: "/fjell_lms-logo-dark.svg",
    favicon: "/fjell_lms-logo.svg",
    alt: "FJELL-LMS Logo",
  },

  colors: {
    primary: "#3b82f6", // blue-500
    secondary: "#64748b", // slate-500
    accent: "#f59e0b", // amber-500
    success: "#10b981", // emerald-500
    warning: "#f59e0b", // amber-500
    error: "#ef4444", // red-500
    background: "#ffffff",
    foreground: "#0f172a", // slate-900
  },

  typography: {
    fontFamily: "Tomatogrotesk, sans-serif",
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    fontSizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
  },

  links: {
    homepage: "",
    link1: "https://example.com/link1",
    link2: "https://example.com/link2",
    link3: "https://example.com/link3",
    terms: "",
    faq: "/faq",
  },

  features: {
    enableDarkMode: true,
    enableNotifications: true,
    enableAnalytics: true,
    enableFeedback: true,
  },

  customization: {
    allowThemeOverride: true,
    allowLogoOverride: true,
    allowColorOverride: true,
  },
};

// Department-specific branding overrides
export interface DepartmentBranding {
  departmentId: string;
  departmentName: string;
  branding: Partial<BrandingConfig>;
}

// Branding context for React components
export interface BrandingContextType {
  branding: BrandingConfig;
  departmentBranding?: DepartmentBranding;
  updateBranding: (updates: Partial<BrandingConfig>) => void;
  resetBranding: () => void;
}

// Utility functions for branding
export const brandingUtils = {
  // Get CSS custom properties for colors
  getColorVariables: (colors: BrandingConfig["colors"]) => {
    return {
      "--color-primary": colors.primary,
      "--color-secondary": colors.secondary,
      "--color-accent": colors.accent,
      "--color-success": colors.success,
      "--color-warning": colors.warning,
      "--color-error": colors.error,
      "--color-background": colors.background,
      "--color-foreground": colors.foreground,
    };
  },

  // Get CSS custom properties for typography
  getTypographyVariables: (typography: BrandingConfig["typography"]) => {
    return {
      "--font-family": typography.fontFamily,
      "--font-weight-normal": typography.fontWeights.normal.toString(),
      "--font-weight-medium": typography.fontWeights.medium.toString(),
      "--font-weight-semibold": typography.fontWeights.semibold.toString(),
      "--font-weight-bold": typography.fontWeights.bold.toString(),
      "--font-size-xs": typography.fontSizes.xs,
      "--font-size-sm": typography.fontSizes.sm,
      "--font-size-base": typography.fontSizes.base,
      "--font-size-lg": typography.fontSizes.lg,
      "--font-size-xl": typography.fontSizes.xl,
      "--font-size-2xl": typography.fontSizes["2xl"],
      "--font-size-3xl": typography.fontSizes["3xl"],
      "--font-size-4xl": typography.fontSizes["4xl"],
    };
  },

  // Merge branding configurations
  mergeBranding: (
    base: BrandingConfig,
    override: Partial<BrandingConfig>,
  ): BrandingConfig => {
    return {
      ...base,
      ...override,
      logo: { ...base.logo, ...override.logo },
      colors: { ...base.colors, ...override.colors },
      typography: { ...base.typography, ...override.typography },
      links: { ...base.links, ...override.links },
      features: { ...base.features, ...override.features },
      customization: { ...base.customization, ...override.customization },
    };
  },

  // Validate branding configuration
  validateBranding: (branding: Partial<BrandingConfig>): string[] => {
    const errors: string[] = [];

    if (branding.appName && branding.appName.length < 2) {
      errors.push("App name must be at least 2 characters long");
    }

    if (
      branding.colors?.primary &&
      !/^#[0-9A-Fa-f]{6}$/.test(branding.colors.primary)
    ) {
      errors.push("Primary color must be a valid hex color");
    }

    if (
      branding.links?.homepage &&
      !branding.links.homepage.startsWith("http")
    ) {
      errors.push("Homepage URL must start with http:// or https://");
    }

    return errors;
  },

  // Generate theme CSS
  generateThemeCSS: (branding: BrandingConfig): string => {
    const colorVars = brandingUtils.getColorVariables(branding.colors);
    const typographyVars = brandingUtils.getTypographyVariables(
      branding.typography,
    );

    const cssVars = Object.entries({ ...colorVars, ...typographyVars })
      .map(([key, value]) => `  ${key}: ${value};`)
      .join("\n");

    return `:root {\n${cssVars}\n}`;
  },
};

// Branding storage utilities
export const brandingStorage = {
  // Save branding to localStorage
  saveBranding: (branding: BrandingConfig): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fjell-lms-branding", JSON.stringify(branding));
    }
  },

  // Load branding from localStorage
  loadBranding: (): BrandingConfig | null => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fjell-lms-branding");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error("Failed to parse stored branding:", error);
          localStorage.removeItem("fjell-lms-branding");
        }
      }
    }
    return null;
  },

  // Clear branding from localStorage
  clearBranding: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("fjell-lms-branding");
    }
  },
};

// Export default branding
export default defaultBranding;
