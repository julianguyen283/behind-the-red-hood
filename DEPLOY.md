# One-time setup: GitHub + Vercel

You do this once. Afterwards, every change publishes itself.
You need about 10 minutes, and only free accounts.

## 1. Create a GitHub account and an empty repository

1. Sign up or log in at <https://github.com>.
2. Open <https://github.com/new>.
   - **Repository name:** `behind-the-red-hood`
   - **Visibility:** *Public* or *Private*. Both work with Vercel. Private keeps your draft source hidden; the website itself is public either way.
   - **Leave everything else unticked.** Don't add a README, .gitignore or licence; the project already has them.
3. Click **Create repository**.

## 2. Put the code in the repository

**If Claude is setting this up for you:** connect GitHub to Claude at <https://claude.ai/connect-github>, installing the Claude GitHub App on the new repository when asked. Then tell Claude the repository name, and it will push the code.

**If you're doing it yourself** from a terminal in this folder:

```bash
git remote add origin https://github.com/YOUR-USERNAME/behind-the-red-hood.git
git push -u origin main
```

## 3. Connect Vercel

1. Go to <https://vercel.com/signup> and choose **Continue with GitHub**. The free *Hobby* plan is fine for a student project.
2. Vercel asks for permission to see your repositories. Choose **Only select repositories**, pick `behind-the-red-hood`, and click **Install**.
3. On <https://vercel.com/new>, click **Import** next to `behind-the-red-hood`.
4. Vercel detects **Vite** automatically, and the build settings come from `vercel.json`. Don't change anything.
5. Click **Deploy**. After about a minute you get a URL such as `behind-the-red-hood.vercel.app`.
   - **Optional:** change the name under **Project → Settings → Domains**, for example to `behind-the-red-hood-yourname.vercel.app`. That address is your permanent public URL.

## 4. Check the automatic publishing

- Under **Project → Settings → Git**, the **Production Branch** should be `main` (the default). Every push to `main` then updates the public site.
- Pushes to any other branch, and pull requests, get a **Preview Deployment** with its own URL. The live site doesn't change until you merge.

## 5. Before you submit

- Open the public URL in a **private/incognito window**, on desktop and on your phone.
- Check that **Project → Settings → Deployment Protection** doesn't put *Vercel Authentication* on **production**. If it did, your marker would see a login page. Protecting previews only is fine.
- Fill in every credit shown in red at the bottom of the site.
