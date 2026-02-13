module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/app',
        'http://localhost:3000/app/matrices',
        'http://localhost:3000/app/option-groups'
      ],
      numberOfRuns: 3,
      startServerCommand: 'npm run build && npm run start',
      startServerReadyPattern: 'listening',
      startServerReadyTimeout: 30000,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        }
      }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['off']
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
