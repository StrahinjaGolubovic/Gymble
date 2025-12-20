# How to Push Your Code to GitHub

## Step 1: Install Git (if not installed)

1. Download Git for Windows: https://git-scm.com/download/win
2. Run the installer (use default settings)
3. Restart your terminal/command prompt after installation

## Step 2: Verify Git Installation

Open a new terminal/PowerShell and run:
```bash
git --version
```

You should see something like `git version 2.x.x`

## Step 3: Configure Git (First Time Only)

Set your name and email:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 4: Initialize Git in Your Project

1. Open terminal/PowerShell in your project folder (`C:\Users\strah\Desktop\Gymble`)
2. Run these commands:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Gymble app ready for Railway deployment"
```

## Step 5: Create a GitHub Repository

1. Go to https://github.com and sign in (or create an account)
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `Gymble` (or any name you want)
4. Description: "Gym accountability platform with streak tracking"
5. Choose **Public** or **Private**
6. **DO NOT** check "Initialize with README" (we already have files)
7. Click **"Create repository"**

## Step 6: Connect and Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Gymble.git

# Rename branch to main (if needed)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

**Note**: If you're using HTTPS, GitHub will ask for your username and password. 
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your GitHub password)

### How to Create a Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Gymble Deployment"
4. Select scopes: Check **"repo"** (this gives full repository access)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

## Alternative: Using GitHub Desktop (Easier GUI Method)

If you prefer a visual interface:

1. Download GitHub Desktop: https://desktop.github.com/
2. Install and sign in with your GitHub account
3. Click "File" → "Add Local Repository"
4. Browse to `C:\Users\strah\Desktop\Gymble`
5. Click "Publish repository" button
6. Choose name and visibility
7. Click "Publish Repository"

## Step 7: Verify Upload

1. Go to your GitHub repository page
2. You should see all your files there
3. Files like `package.json`, `app/`, `lib/`, etc. should be visible

## Step 8: Deploy to Railway

Once your code is on GitHub:

1. Go to https://railway.app
2. Sign up/login
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Authorize Railway to access your GitHub
6. Select your `Gymble` repository
7. Railway will automatically start building!

## Troubleshooting

### "git is not recognized"
- Git is not installed or not in PATH
- Install Git from https://git-scm.com/download/win
- Restart your terminal after installation

### "Authentication failed"
- Use Personal Access Token instead of password
- Make sure token has "repo" scope

### "Repository not found"
- Check that the repository name matches
- Make sure you have access to the repository

### "Permission denied"
- Check your GitHub username is correct
- Verify your Personal Access Token is valid

## Next Steps After Pushing

1. ✅ Code is on GitHub
2. ✅ Deploy to Railway (see RAILWAY_DEPLOYMENT.md)
3. ✅ Set environment variables in Railway
4. ✅ Add persistent volume for database
5. ✅ Your app will be live!

