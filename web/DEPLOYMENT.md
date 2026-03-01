# Deployment Guide - Zipminator-PQC Landing Page

Complete deployment guide for the Zipminator-PQC landing page.

## Prerequisites

- Node.js 18+ installed
- Domain: zipminator.zip configured
- Git repository set up
- Platform account (Vercel/Netlify/etc.)

## Deployment Options

### 1. Vercel (Recommended)

Vercel is the easiest and fastest option for Next.js deployments.

#### A. Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd /Users/mos/dev/zipminator/landing-page

# Login to Vercel
vercel login

# Deploy
vercel

# For production
vercel --prod
```

#### B. Via GitHub Integration

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Zipminator landing page"
   git remote add origin https://github.com/qdaria/zipminator-landing.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: Next.js
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `.next`
   - Click "Deploy"

3. **Configure Custom Domain**:
   - Project Settings → Domains
   - Add: `zipminator.zip`
   - Add DNS records (provided by Vercel):
     ```
     Type: A
     Name: @
     Value: 76.76.21.21

     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

#### Environment Variables (Vercel)

Add in Project Settings → Environment Variables:

```bash
NEXT_PUBLIC_GA_ID=UA-XXXXXXXXX-X
NEXT_PUBLIC_API_URL=https://api.zipminator.zip
NEXT_PUBLIC_DOMAIN=zipminator.zip
```

### 2. Netlify

#### A. Via Netlify CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

#### B. Via GitHub Integration

1. Push code to GitHub (same as Vercel)
2. Visit [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect GitHub repository
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18
6. Click "Deploy"

#### Custom Domain (Netlify)

1. Site Settings → Domain Management → Custom Domains
2. Add `zipminator.zip`
3. Configure DNS:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5

   Type: CNAME
   Name: www
   Value: [your-site].netlify.app
   ```

#### Build Settings (netlify.toml)

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Docker Deployment

#### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  landing-page:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.zipminator.zip
    restart: unless-stopped
```

#### Deploy

```bash
# Build image
docker build -t zipminator-landing .

# Run container
docker run -p 3000:3000 zipminator-landing

# Or use docker-compose
docker-compose up -d
```

### 4. AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

### 5. Google Cloud Run

```bash
# Build and deploy
gcloud run deploy zipminator-landing \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## DNS Configuration

### For zipminator.zip Domain

#### Cloudflare (Recommended)

1. Add site to Cloudflare
2. Update nameservers at domain registrar
3. Add DNS records:

```
Type: A
Name: @
Value: [Your deployment IP]
Proxied: Yes

Type: CNAME
Name: www
Value: zipminator.zip
Proxied: Yes
```

4. SSL/TLS: Full (strict)
5. Enable HSTS
6. Enable Auto HTTPS Rewrites

#### Route 53 (AWS)

```bash
# Create hosted zone
aws route53 create-hosted-zone --name zipminator.zip

# Add A record
aws route53 change-resource-record-sets --hosted-zone-id ZXXXXX \
  --change-batch file://record.json
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Landing Page

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Performance Optimization

### Before Deployment

1. **Optimize Images**:
   ```bash
   # Install sharp for optimized image processing
   npm install sharp
   ```

2. **Enable Compression**:
   In `next.config.js`:
   ```javascript
   compress: true,
   ```

3. **Analyze Bundle**:
   ```bash
   npm install -D @next/bundle-analyzer
   ANALYZE=true npm run build
   ```

### After Deployment

1. **Enable CDN**:
   - Vercel: Automatic
   - Netlify: Automatic
   - Others: Configure CloudFlare

2. **Set Cache Headers**:
   ```javascript
   // next.config.js
   async headers() {
     return [
       {
         source: '/:all*(svg|jpg|png|webp)',
         headers: [
           {
             key: 'Cache-Control',
             value: 'public, max-age=31536000, immutable',
           },
         ],
       },
     ]
   }
   ```

3. **Monitor Performance**:
   - Google PageSpeed Insights
   - WebPageTest
   - Lighthouse CI

## Security

### SSL/TLS

- All platforms provide automatic SSL
- Enforce HTTPS redirects
- Enable HSTS

### Security Headers

Add to `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      ],
    },
  ]
}
```

## Monitoring

### Analytics

1. **Google Analytics**:
   ```javascript
   // Add to app/layout.tsx
   <Script src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID" />
   ```

2. **Vercel Analytics**:
   ```bash
   npm install @vercel/analytics
   ```

### Error Tracking

1. **Sentry**:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

## Rollback Procedures

### Vercel
```bash
vercel rollback [deployment-url]
```

### Netlify
```bash
netlify rollback
```

### Docker
```bash
docker pull zipminator-landing:previous-tag
docker-compose up -d
```

## Troubleshooting

### Build Fails

1. Check Node version: `node --version` (should be 18+)
2. Clear cache: `rm -rf .next node_modules && npm install`
3. Check TypeScript errors: `npm run type-check`

### Deployment Fails

1. Check build logs
2. Verify environment variables
3. Test locally: `npm run build && npm start`

### Domain Not Resolving

1. Check DNS propagation: `dig zipminator.zip`
2. Wait 24-48 hours for full propagation
3. Verify nameservers at registrar

## Post-Deployment Checklist

- [ ] Site loads on https://zipminator.zip
- [ ] All sections render correctly
- [ ] Navigation works
- [ ] Forms submit properly
- [ ] Mobile responsive
- [ ] Performance score >90 (Lighthouse)
- [ ] Analytics tracking
- [ ] SSL certificate valid
- [ ] Redirects work (www → non-www)
- [ ] 404 page works
- [ ] Sitemap accessible
- [ ] robots.txt configured

## Support

- Vercel: [vercel.com/support](https://vercel.com/support)
- Netlify: [netlify.com/support](https://netlify.com/support)
- QDaria: contact@qdaria.com
