# Deployment Guide

This guide covers deploying the Remilia Wiki Graph to Vercel with a custom domain.

## 🚀 Vercel Deployment

### Prerequisites
- GitHub account
- Vercel account (free tier is fine)
- Custom domain (optional)

### Initial Setup

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/remilia-wiki-graph.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel auto-detects Vite settings ✅

3. **Configure Build Settings**
   
   Vercel should auto-detect these, but verify:
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes
   - Your site is live at `https://your-project.vercel.app`

### Custom Domain

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **DNS Configuration**
   
   Add these records to your domain registrar:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Wait for Propagation**
   - Usually takes 5-30 minutes
   - Check status in Vercel dashboard

## 🔄 Continuous Deployment

Every push to `main` branch triggers auto-deployment:

```bash
git add .
git commit -m "Update graph styling"
git push
```

Vercel builds and deploys automatically. No extra steps needed!

## 🌿 Branch Previews

Vercel creates preview deployments for every branch:

```bash
git checkout -b feature/new-panel
git push origin feature/new-panel
```

Vercel comments on your PR with a preview link.

## 📊 Environment Variables

If you need API keys or secrets (not required for this project):

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add key-value pairs
3. Redeploy to apply

## 🔍 Monitoring

Vercel provides:
- **Analytics**: Page views, performance (free tier: 100k views/month)
- **Logs**: Build logs and runtime logs
- **Speed Insights**: Core Web Vitals

Access via Vercel Dashboard.

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Test locally: `npm run build`

### 404 on Routes
- React Router routes work automatically with Vite
- No extra config needed

### Slow Load Times
- Check bundle size: `npm run build` shows size
- Consider code splitting if bundle > 1MB

## 🔐 Security

- **HTTPS**: Automatic with Vercel (free SSL)
- **Headers**: Configure in `vercel.json` if needed
- **No secrets**: This project has no API keys

## 💰 Cost

**Free Tier includes:**
- Unlimited deployments
- 100GB bandwidth/month
- Custom domains
- SSL certificates
- Preview deployments

This project stays well within free tier limits.

## 📝 vercel.json (Optional)

For advanced config, create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

## 🚀 Production Checklist

Before going live:
- [ ] Test on multiple browsers
- [ ] Test on mobile
- [ ] Verify all links work
- [ ] Check loading performance
- [ ] Confirm custom domain SSL works
- [ ] Test graph with 500+ nodes (if applicable)

## 🔄 Updating Data

1. Run crawler locally: `python scripts/wiki_crawler.py`
2. Commit new JSON: `git add data/ && git commit -m "Update graph data"`
3. Push: `git push`
4. Vercel auto-deploys with new data

**Future (Phase 6):** GitHub Actions will do this automatically daily.
