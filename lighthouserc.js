module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000",
        "http://localhost:3000/courses",
        "http://localhost:3000/dashboard",
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags:
          "--disable-gpu --no-sandbox --no-first-run --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.7 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.8 }],
        "categories:seo": ["error", { minScore: 0.8 }],
        "first-contentful-paint": ["error", { maxNumericValue: 3000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 500 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 500000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 2000000 }],
        "render-blocking-resources": ["error", { maxLength: 3 }],
        "uses-http2": "error",
        "uses-optimized-images": "warn",
        "modern-image-formats": "warn",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
    server: {
      command: "npm run start",
      port: 3000,
      url: "http://localhost:3000",
    },
  },
};
