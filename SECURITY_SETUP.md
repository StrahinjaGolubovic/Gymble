# Security Setup Guide

## ⚠️ CRITICAL: Required Before Running

This application **will not start** without proper environment variables configured. This is intentional for security.

## 1. Generate Secrets

Generate strong random secrets for production:

```bash
# Generate JWT_SECRET (32 bytes = 64 hex characters)
openssl rand -hex 32

# Generate ALTCHA_HMAC_KEY (32 bytes = 64 hex characters)
openssl rand -hex 32
```

Or use Node.js:

```javascript
// Run in Node.js console
require('crypto').randomBytes(32).toString('hex')
```

## 2. Create Environment File

Create `.env.local` file in the project root:

```env
JWT_SECRET=your_generated_jwt_secret_here
ALTCHA_HMAC_KEY=your_generated_altcha_key_here
DATABASE_PATH=./data/gymble.db
NODE_ENV=production
```

**NEVER commit this file to git** (already in `.gitignore`).

## 3. Security Features Implemented

### ✅ Rate Limiting
- **Authentication endpoints**: 5 requests per 15 minutes
- **Upload endpoints**: 20 requests per hour
- **Chat endpoints**: 30 requests per minute
- **Standard API endpoints**: 100 requests per hour
- **Admin endpoints**: 500 requests per hour

Rate limits are enforced via middleware on ALL API routes.

### ✅ HTTPS Enforcement
- Automatic HTTP → HTTPS redirect in production
- Strict-Transport-Security (HSTS) header enabled
- Certificate setup required for production deployment

### ✅ Security Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Content-Security-Policy` - Restricts resource loading
- `Referrer-Policy` - Controls referrer information
- `Permissions-Policy` - Disables unnecessary browser features

### ✅ Password Requirements
- Minimum 8 characters
- Must contain at least one letter
- Must contain at least one number
- Passwords hashed with bcrypt (10 rounds)

### ✅ SQL Injection Protection
- All queries use parameterized statements
- Table name whitelisting where dynamic queries needed
- No user input in SQL strings

### ✅ CAPTCHA Protection
- ALTCHA on login and registration
- Prevents automated bot attacks
- Invisible mode for better UX

### ✅ Input Validation
- File type validation (images only)
- File size limits (5MB uploads, 2MB profiles)
- Message length limits
- Username format validation
- All user input sanitized

### ✅ Authentication Security
- JWT tokens in HTTP-only cookies
- 7-day token expiration
- Secure cookie flags in production
- Admin permission checks

## 4. Production Deployment Checklist

### Before Deploying:

- [ ] Generate NEW secrets (never reuse development secrets)
- [ ] Set environment variables in production environment
- [ ] Enable HTTPS/SSL certificate (Let's Encrypt recommended)
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Test rate limiting is working
- [ ] Verify HTTPS redirect is working
- [ ] Check security headers are present
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review admin user list in `lib/admin.ts`

### SSL/HTTPS Setup:

For production, use Let's Encrypt for free SSL certificates:

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate (for nginx)
sudo certbot --nginx -d yourdomain.com

# Certificate auto-renewal is handled by certbot
```

### Environment Variables in Production:

**Never hardcode secrets**. Use your platform's secret management:

- **Vercel**: Environment Variables in dashboard
- **Netlify**: Environment Variables in dashboard
- **AWS**: AWS Secrets Manager
- **Docker**: Docker secrets or environment files
- **VPS**: System environment variables or secret manager

## 5. Secret Rotation

Rotate secrets every 90 days:

1. Generate new secrets
2. Update environment variables
3. Deploy with new secrets
4. Old tokens will expire within 7 days

## 6. Monitoring

Monitor for security incidents:

- Failed login attempts (rate limit triggers)
- Unusual API usage patterns
- Database query errors
- File upload failures
- Authentication errors

Consider integrating:
- Sentry for error tracking
- CloudWatch/DataDog for metrics
- Log aggregation (ELK stack, etc.)

## 7. Security Maintenance

### Weekly:
- Review error logs
- Check for unusual activity

### Monthly:
- Run `npm audit`
- Update dependencies
- Review rate limit thresholds

### Quarterly:
- Rotate secrets
- Security audit
- Review admin access list

## 8. Incident Response

If secrets are compromised:

1. **Immediately** rotate JWT_SECRET and ALTCHA_HMAC_KEY
2. All users will be logged out (JWT tokens invalidated)
3. Review access logs for unauthorized access
4. Check database for data modifications
5. Notify affected users if data breach occurred

## 9. Testing Security

Test your security setup:

```bash
# Test rate limiting
for i in {1..10}; do curl http://localhost:3000/api/auth/login -X POST; done

# Test HTTPS redirect (in production)
curl -I http://yourdomain.com

# Test security headers
curl -I https://yourdomain.com

# Test password requirements
# Try registering with weak passwords
```

## 10. Additional Recommendations

### High Priority:
- Set up automated backups
- Enable database encryption at rest
- Implement session revocation
- Add 2FA for admin accounts

### Medium Priority:
- Implement refresh tokens
- Add email verification
- Set up intrusion detection
- Add virus scanning for uploads

### Nice to Have:
- Implement audit logging
- Add geolocation blocking
- Set up honeypot endpoints
- Implement anomaly detection

## Support

For security issues, DO NOT create public GitHub issues. Contact the maintainers directly.

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Let's Encrypt](https://letsencrypt.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
