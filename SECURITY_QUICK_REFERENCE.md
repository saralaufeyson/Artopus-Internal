# 🛡️ Security Quick Reference Card

## Critical Issues Summary

### 🔴 8 CRITICAL Vulnerabilities Found

| ID | Issue | Impact | Fix Time |
|----|-------|--------|----------|
| **AUTH-001** | Missing JWT_SECRET | Auth broken | 5 min |
| **AUTH-004** | No token expiration | Session hijacking | 5 min |
| **AUTH-007** | CORS allows all origins | CSRF attacks | 10 min |
| **INJ-001** | Regex injection (ReDoS) | Server DoS | 15 min |
| **INJ-002** | NoSQL injection | Data breach | 15 min |
| **AUTHZ-001** | IDOR in artworks | Unauthorized access | 30 min |
| **AUTHZ-002** | IDOR in artists | Data leak | 30 min |
| **PRIV-003** | Hardcoded credentials | Database compromise | 5 min |

**Total Estimated Fix Time:** 2 hours

---

## 🚀 Quick Fix Commands

### 1. Install Security Packages (2 minutes)
```bash
cd backend
npm install helmet express-rate-limit validator express-mongo-sanitize joi
```

### 2. Generate JWT Secret (30 seconds)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output to .env as JWT_SECRET=...
```

### 3. Add to .env File (1 minute)
```bash
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> .env
echo "FRONTEND_URL=http://localhost:3000" >> .env
echo "NODE_ENV=development" >> .env
```

### 4. Update .gitignore (30 seconds)
```bash
echo ".env" >> .gitignore
git rm --cached .env  # Remove from git if already committed
```

---

## 📝 Essential Code Snippets

### Secure CORS (server.js)
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));
```

### Security Headers (server.js)
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### Rate Limiting (userRoutes.js)
```javascript
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});
router.post('/login', authLimiter, loginUser);
```

### Regex Sanitization
```javascript
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
```

### ObjectId Validation
```javascript
const mongoose = require('mongoose');
if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({ message: 'Invalid ID' });
}
```

---

## 🔍 Testing Checklist

Quick tests to verify security:

```bash
# Test 1: CORS (should only allow your frontend)
curl -I http://localhost:5000/

# Test 2: Rate limiting (should block after 5 attempts)
for i in {1..6}; do curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" -d '{"email":"a","password":"b"}'; done

# Test 3: Invalid ObjectId (should return 400, not 500)
curl http://localhost:5000/api/artists/invalid-id

# Test 4: XSS payload (should be sanitized)
curl -X POST http://localhost:5000/api/artists \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","contact":{"email":"test@test.com"}}'
```

---

## ⚠️ Common Mistakes to Avoid

1. ❌ **DON'T** commit `.env` files to git
2. ❌ **DON'T** use `app.use(cors())` without options
3. ❌ **DON'T** expose full error messages in production
4. ❌ **DON'T** trust user input - always sanitize
5. ❌ **DON'T** skip ObjectId validation
6. ❌ **DON'T** forget to check ownership before allowing access
7. ❌ **DON'T** store JWT in localStorage (use HTTPOnly cookies)
8. ❌ **DON'T** return passwords in API responses

---

## ✅ Security Best Practices

1. ✅ **DO** validate all inputs (client AND server)
2. ✅ **DO** use parameterized queries (Mongoose does this)
3. ✅ **DO** implement rate limiting on auth endpoints
4. ✅ **DO** use HTTPS in production
5. ✅ **DO** set token expiration times
6. ✅ **DO** sanitize error messages for production
7. ✅ **DO** use security headers (helmet)
8. ✅ **DO** regular security audits (`npm audit`)

---

## 🎯 Priority Order

### TODAY (Next 2 hours):
1. Add JWT_SECRET to .env
2. Configure CORS properly
3. Install and configure helmet
4. Add ObjectId validation
5. Sanitize regex inputs

### THIS WEEK:
6. Implement rate limiting
7. Add error sanitization
8. Fix IDOR vulnerabilities
9. Add input validation middleware
10. Frontend XSS protection

### THIS MONTH:
11. Comprehensive testing
12. Security documentation
13. Team training
14. Automated security scanning
15. Regular security reviews

---

## 🔐 Security Headers Reference

Required headers for production:

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

Helmet adds these automatically!

---

## 📊 Risk Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| 🔴 **CRITICAL** | Active exploit possible | Fix immediately |
| 🟠 **HIGH** | Likely to be exploited | Fix this week |
| 🟡 **MEDIUM** | Could be exploited | Fix this month |
| 🟢 **LOW** | Unlikely to be exploited | Plan to fix |

---

## 🚨 Incident Response

If you suspect a security breach:

1. **Immediately rotate all secrets** (JWT_SECRET, DB passwords)
2. **Review logs** for suspicious activity
3. **Notify team** and users if data was accessed
4. **Document the incident**
5. **Implement fixes** to prevent recurrence
6. **Conduct post-mortem** analysis

---

## 📞 Resources

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Helmet.js:** https://helmetjs.github.io/
- **Express Security:** https://expressjs.com/en/advanced/best-practice-security.html
- **MongoDB Security:** https://docs.mongodb.com/manual/security/
- **JWT Best Practices:** https://tools.ietf.org/html/rfc8725

---

## 🧰 Useful Commands

```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities automatically (if possible)
npm audit fix

# Generate secure random strings
openssl rand -base64 32

# Test API with verbose output
curl -v http://localhost:5000/api/endpoint

# Check security headers
curl -I http://localhost:5000/

# Validate JSON
echo '{"test":"value"}' | jq .
```

---

## 📈 Before vs After Metrics

| Metric | Before | After Fixes | Target |
|--------|--------|-------------|--------|
| Critical Issues | 8 | 0 | 0 |
| High Issues | 12 | 2 | 0 |
| Security Score | D- | B+ | A |
| Auth Weakness | Yes | No | No |
| Input Validation | Weak | Strong | Strong |
| CORS Config | Broken | Secure | Secure |
| Error Exposure | High | Low | Low |

---

**Keep this document handy during development!**

_Last Updated: 2025-10-16_
_Version: 1.0_
