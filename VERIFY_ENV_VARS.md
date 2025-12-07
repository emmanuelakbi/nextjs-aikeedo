# Verify Environment Variables

## The Issue

You're getting "Application error: a client-side exception has occurred" which usually means NextAuth can't initialize properly. This is often due to missing or incorrect environment variables.

## Required Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Make sure you have these set for **Production**:

### 1. NEXTAUTH_SECRET ✅
Should be at least 32 characters long. You can generate one with:
```bash
openssl rand -base64 32
```

### 2. NEXTAUTH_URL ⚠️ IMPORTANT
This should be your **Vercel deployment URL**:
```
https://nextjs-aikeedo-k71lmochv-aikeedos-projects.vercel.app
```

**Common mistake:** If this is set to `http://localhost:3000`, it will fail in production!

### 3. DATABASE_URL ✅
```
postgresql://neondb_owner:npg_cbx5hGnFj8BN@ep-rough-cherry-a4ypaob0-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 4. OPENROUTER_API_KEY ✅
Your OpenRouter API key (the new one you rotated)

---

## Most Likely Issue: NEXTAUTH_URL

The most common cause of this error is that `NEXTAUTH_URL` is either:
1. Not set at all
2. Set to `http://localhost:3000` (wrong for production)
3. Set to a different URL than your actual deployment

### How to Fix:

1. Go to Vercel → Settings → Environment Variables
2. Find `NEXTAUTH_URL`
3. Make sure it's set to: `https://nextjs-aikeedo-k71lmochv-aikeedos-projects.vercel.app`
4. Make sure it's enabled for **Production** environment
5. After changing it, **redeploy** your app

---

## Check Your Settings

Please verify these in Vercel:

| Variable | Should Be | Environment |
|----------|-----------|-------------|
| `NEXTAUTH_SECRET` | 32+ character string | Production |
| `NEXTAUTH_URL` | `https://nextjs-aikeedo-k71lmochv-aikeedos-projects.vercel.app` | Production |
| `DATABASE_URL` | Your Neon database URL | Production |
| `OPENROUTER_API_KEY` | Your API key | Production |

---

## After Fixing

1. Update the environment variable(s)
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment
4. Wait for deployment to complete
5. Try accessing the site again

---

## Alternative: Use Vercel's Automatic URL

Instead of hardcoding the URL, you can use Vercel's automatic URL:

Set `NEXTAUTH_URL` to:
```
https://$VERCEL_URL
```

This will automatically use the correct URL for each deployment.

---

Let me know what your `NEXTAUTH_URL` is currently set to in Vercel!
