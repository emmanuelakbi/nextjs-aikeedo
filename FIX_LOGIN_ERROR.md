# Fix Login Error - Step by Step Guide

## Problem
You can see the login page, but when you try to login, you get redirected to an error page. This means the **database tables haven't been created yet** in your production database.

## Solution
You need to apply the database migrations to create all the required tables.

---

## Step 1: Get Your Production Database URL

1. Go to your **Vercel Dashboard**
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` and **copy the value**
   - It should look like: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## Step 2: Apply Migrations

Open your terminal in the project folder and run these commands:

### On Mac/Linux:

```bash
# Set the database URL (replace with your actual URL from Vercel)
export DATABASE_URL='postgresql://your-actual-database-url-here'

# Apply migrations
npx prisma migrate deploy
```

### On Windows (Command Prompt):

```cmd
# Set the database URL (replace with your actual URL from Vercel)
set DATABASE_URL=postgresql://your-actual-database-url-here

# Apply migrations
npx prisma migrate deploy
```

### On Windows (PowerShell):

```powershell
# Set the database URL (replace with your actual URL from Vercel)
$env:DATABASE_URL='postgresql://your-actual-database-url-here'

# Apply migrations
npx prisma migrate deploy
```

---

## Step 3: Verify Migrations

After running the command, you should see output like:

```
✓ Applying migration `20240101000000_initial_schema`
✓ Applying migration `20240102000000_add_affiliates`
...
✓ All migrations have been successfully applied.
```

---

## Step 4: Redeploy on Vercel

1. Go to **Vercel Dashboard**
2. Click on your project
3. Go to **Deployments** tab
4. Find the latest deployment
5. Click the **three dots (...)** next to it
6. Click **"Redeploy"**
7. **UNCHECK** "Use existing Build Cache"
8. Click **"Redeploy"**

---

## Step 5: Test Login

1. Go to your deployed site: https://nextjs-aikeedo-cyoredoer-aikeedos-projects.vercel.app
2. Try logging in again
3. It should work now! 🎉

---

## Alternative: Use Prisma Studio to Check Database

You can also verify the tables were created:

```bash
# Set the database URL
export DATABASE_URL='postgresql://your-actual-database-url-here'

# Open Prisma Studio
npx prisma studio
```

This will open a web interface where you can see all your database tables.

---

## Still Having Issues?

If you still get errors after following these steps:

1. Check the **Vercel Runtime Logs**:
   - Go to Vercel Dashboard → Your Project → **Functions** tab
   - Look for error messages

2. Check the **error URL** in your browser:
   - When redirected to `/api/auth/error`, look at the full URL
   - It might have `?error=Something` at the end
   - Share that error code with me

3. Make sure these environment variables are set in Vercel:
   - ✅ `DATABASE_URL`
   - ✅ `NEXTAUTH_SECRET` (at least 32 characters)
   - ✅ `NEXTAUTH_URL` (your Vercel URL)
   - ✅ `OPENROUTER_API_KEY`

---

## Quick Troubleshooting

### Error: "Can't reach database server"
- Your database URL might be wrong
- Check if you copied the complete URL from Vercel
- Make sure there are no extra spaces

### Error: "Migration failed"
- The database might already have some tables
- Try running: `npx prisma db push` instead
- This will sync the schema without migrations

### Error: "Authentication failed"
- Make sure you're using the correct login credentials
- If you don't have an account yet, register first at `/register`

---

## Need Help?

Share with me:
1. The exact error message from the terminal when running migrations
2. The error code from the URL (e.g., `/api/auth/error?error=Configuration`)
3. Any error messages from Vercel Runtime Logs
