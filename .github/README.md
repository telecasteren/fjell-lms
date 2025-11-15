# GitHub Actions Workflow Templates

This directory contains workflow templates for the FOX-LMS project. These templates provide standardized patterns for common operations and can be customized as needed.

## Available Workflows

### Core Workflows

1. **ci.yml** - Continuous Integration Pipeline
   - TypeScript validation, ESLint/Prettier checks
   - Vitest unit tests with coverage reporting
   - Playwright E2E tests
   - Build verification and bundle analysis
   - Matrix testing across Node.js versions

2. **security.yml** - Security & Quality Checks
   - Dependency vulnerability scanning
   - CodeQL SAST analysis
   - Secret scanning with TruffleHog
   - License compliance verification
   - Docker security scanning (scheduled)

3. **database.yml** - Database Operations
   - Prisma schema validation
   - Migration testing (SQLite & PostgreSQL)
   - Seed data verification
   - Migration safety checks for PRs
   - Database backup testing

4. **deploy.yml** - Production Deployment
   - Environment validation
   - Database migration deployment
   - Vercel deployment with health checks
   - Post-deployment smoke tests
   - Rollback capabilities

5. **performance.yml** - Performance Monitoring
   - Bundle size analysis
   - Lighthouse performance audits
   - Database query performance testing
   - Load testing with k6
   - Comprehensive performance reporting

6. **release.yml** - Automated Release Management
   - Conventional commit analysis
   - Semantic versioning
   - Automated changelog generation
   - GitHub release creation
   - Post-release automation triggers

### Maintenance & Emergency Workflows

7. **maintenance.yml** - Manual Maintenance Operations
   - Artifact cleanup
   - Database backups
   - Security scans on demand
   - User data cleanup
   - Cache clearing operations

8. **hotfix.yml** - Emergency Hotfix Deployment
   - Emergency release process
   - Critical test validation
   - Hotfix deployment with minimal checks
   - Post-incident tracking
   - Team notification system

### Configuration Files

- **dependabot.yml** - Automated dependency updates with intelligent grouping
- **lighthouserc.js** - Lighthouse CI configuration for performance testing

## Workflow Features

### Security & Compliance

- Comprehensive vulnerability scanning
- Secret detection and prevention
- License compliance monitoring
- Security scorecard tracking
- Container security scanning

### Quality Assurance

- Multi-stage testing pipeline
- Code quality enforcement
- Performance monitoring
- Accessibility compliance
- SEO optimization tracking

### Deployment Safety

- Environment validation
- Database migration safety checks
- Health check verification
- Automatic rollback capabilities
- Post-deployment monitoring

### Developer Experience

- Fast feedback loops
- Detailed reporting and summaries
- Artifact management
- Parallel job execution
- Intelligent caching strategies

## Customization Guide

### Environment Variables Required

```bash
# Core application
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.com

# Deployment
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Optional services
UPSTASH_REDIS_REST_URL=your-redis-url
BUNNY_STORAGE_API_KEY=your-bunny-key
LHCI_GITHUB_APP_TOKEN=your-lighthouse-token
```

### Branch Protection Rules

Configure these branch protection rules for optimal workflow integration:

- Require pull request reviews (1+ reviewers)
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators in restrictions
- Auto-delete head branches after merge

### Workflow Triggers

- **Push to main**: Deploy, Release
- **Pull requests**: CI, Security, Database
- **Scheduled**: Security scans (weekly), Performance audits (weekly)
- **Manual dispatch**: Maintenance, Hotfix, Performance
- **Tag creation**: Deployment, Performance monitoring

## Monitoring & Alerts

### Success Metrics

- CI pipeline completion time < 10 minutes
- Test coverage > 80%
- Security scan results: zero high/critical vulnerabilities
- Performance scores > 90 (Lighthouse)
- Deployment success rate > 99%

### Alert Conditions

- Security vulnerabilities detected
- Performance regression > 20%
- Build failures on main branch
- Deployment failures
- Database migration failures

## Best Practices

### Commit Messages

Use conventional commits for automatic release management:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `BREAKING CHANGE:` - Breaking changes (major version bump)
- `chore:`, `docs:`, `style:`, `refactor:`, `test:` - No version bump

### Workflow Execution

1. Create feature branch from main
2. Make changes following conventional commits
3. Push branch and create PR
4. CI workflows validate changes
5. Review and merge PR
6. Release workflow analyzes commits
7. Automatic deployment to production

### Emergency Procedures

1. Create hotfix branch from main or release branch
2. Make critical fixes
3. Use hotfix workflow for emergency deployment
4. Follow up with post-incident review

## Troubleshooting

### Common Issues

**Workflow Permission Errors**

- Ensure GITHUB_TOKEN has sufficient permissions
- Check repository settings for Actions permissions

**Deployment Failures**

- Verify all required environment variables are set
- Check Vercel token validity and permissions
- Validate database connection strings

**Test Failures**

- Review test logs for specific failures
- Check environment setup in CI
- Validate test database configuration

**Performance Issues**

- Monitor bundle size trends
- Review Lighthouse audit details
- Check database query performance

### Getting Help

1. Check workflow run logs for detailed error messages
2. Review GitHub Actions documentation
3. Consult the repository issues for known problems
4. Contact the development team for assistance

## Maintenance Schedule

### Weekly

- Dependency updates (Monday 9:00 UTC)
- Security scans (Sunday 2:00 UTC)
- Performance audits (Sunday 1:00 UTC)

### Monthly

- GitHub Actions updates
- Docker image updates
- Security scorecard evaluation

### As Needed

- Emergency hotfixes
- Manual maintenance operations
- Performance optimization
- Security incident response
