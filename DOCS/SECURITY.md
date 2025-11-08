# Security Configuration Guide

## Overview

This LMS application implements comprehensive security measures to protect against common web vulnerabilities and attacks.

## Security Features Implemented

### 1. Rate Limiting
- **Purpose**: Prevent brute force attacks, API abuse, and DDoS
- **Implementation**: Upstash Redis-based rate limiting
- **Limits**:
  - Authentication: 5 attempts per minute per IP
  - Registration: 3 registrations per hour per IP
  - Admin operations: 10 operations per hour per user
  - Course operations: 20 requests per minute per user
  - Reports: 10 requests per minute per user

### 2. CSRF Protection
- **Purpose**: Prevent Cross-Site Request Forgery attacks
- **Implementation**: Origin validation and session token verification
- **Headers**: X-CSRF-Token validation

### 3. Secure Session Management
- **Purpose**: Protect user sessions from hijacking
- **Implementation**: 
  - JWT tokens with 24-hour expiration
  - Secure HTTP-only cookies
  - SameSite cookie policy
  - Secure flag in production

### 4. Input Validation
- **Purpose**: Prevent injection attacks and data corruption
- **Implementation**: Zod schema validation for all API endpoints
- **Features**:
  - Email format validation
  - Password policy enforcement
  - SQL injection prevention via Prisma
  - XSS prevention via input sanitization

### 5. Error Handling
- **Purpose**: Prevent information disclosure
- **Implementation**: Centralized error handling with sanitized responses
- **Features**:
  - No sensitive data in error messages
  - Structured error responses
  - Error logging for monitoring

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# NextAuth (already configured)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Upstash Redis Setup

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and token
4. Add them to your `.env` file

### 3. Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate Redis token (handled by Upstash)
```

## Security Headers

The application automatically adds these security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'; ...`

## Rate Limiting Configuration

### Customizing Limits

Edit `src/lib/rate-limit.ts` to adjust limits:

```typescript
export const rateLimiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
    analytics: true,
    prefix: "auth",
  }),
  // ... other limiters
};
```

### Monitoring

Rate limiting includes analytics. Monitor usage in Upstash console.

## Password Policy

The application enforces strict password requirements:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Maximum 100 characters

## Role-Based Access Control (RBAC)

### Roles
- **BASIC**: Can view and enroll in published courses from their department and parent department
- **ADMIN**: Can manage users and enrollments in their department and sub-departments
- **WRITER**: Can create/edit courses and content within their own department only
- **AUTHOR**: Can create/edit courses and manage all users across all departments

### Permissions
- Course creation: AUTHOR and WRITER (WRITER limited to own department)
- User management: ADMIN and AUTHOR
- Course enrollment: ADMIN and self-enrollment
- Reports: ADMIN and AUTHOR
- Department hierarchy: ADMIN can access sub-departments, AUTHOR can access all departments

## Security Best Practices

### 1. Regular Updates
- Keep dependencies updated
- Monitor security advisories
- Update NextAuth and Prisma regularly

### 2. Monitoring
- Monitor rate limiting metrics
- Set up error alerting
- Track failed authentication attempts

### 3. Production Deployment
- Use HTTPS in production
- Set secure cookie flags
- Enable CSP headers
- Use environment-specific configurations

### 4. Database Security
- Use connection pooling
- Enable SSL connections
- Regular backups
- Access logging

## Testing Security

### 1. Rate Limiting Tests
```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"test","email":"test@example.com","password":"Test123!","department":"Test"}'
done
```

### 2. CSRF Tests
```bash
# Test CSRF protection
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -H "Origin: https://malicious-site.com" \
  -d '{"title":"Malicious Course"}'
```

### 3. Authentication Tests
```bash
# Test brute force protection
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/signin/credentials \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "email=admin@example.com&password=wrongpassword&csrfToken=test"
done
```

## Troubleshooting

### Common Issues

1. **Rate limiting not working**
   - Check Redis connection
   - Verify environment variables
   - Check Upstash console

2. **CSRF errors**
   - Verify origin headers
   - Check NEXTAUTH_URL configuration
   - Ensure proper cookie settings

3. **Session issues**
   - Check NEXTAUTH_SECRET
   - Verify cookie settings
   - Check domain configuration

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will show detailed error messages and stack traces.

## Security Checklist

- [ ] Rate limiting configured and tested
- [ ] CSRF protection enabled
- [ ] Secure session management
- [ ] Input validation on all endpoints
- [ ] Error handling implemented
- [ ] Security headers configured
- [ ] Password policy enforced
- [ ] RBAC properly implemented
- [ ] Environment variables secured
- [ ] HTTPS enabled in production
- [ ] Database connections secured
- [ ] Monitoring and alerting set up

## Support

For security issues or questions:
- Check the logs for detailed error messages
- Review the error handling implementation
- Test with the provided security test commands
- Monitor rate limiting metrics in Upstash console
