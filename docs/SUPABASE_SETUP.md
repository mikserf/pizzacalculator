# Supabase + Google login setup

About 30 minutes. Do the parts in order: part 2 needs the project URL from part 1, and part 3 needs the Google keys from part 2.

Keep a scratch note open for the values you copy along the way: **Project URL**, **anon key**, **Google Client ID**, **Google Client secret**. Put the Client secret in your password manager. It is the only real secret here.

---

## 1. Create the Supabase project

1. Go to **https://supabase.com**. Sign in (the "Continue with GitHub" option is easiest).
2. Click **New project**.
   - **Organization:** your personal org (created automatically). Plan: **Free**.
   - **Project name:** `pizzacalculator`
   - **Database password:** click **Generate a password** and save it in your password manager. The app doesn't need it, but you might need it later.
   - **Region:** **North EU (Stockholm)**. If that isn't offered, pick **Central EU (Frankfurt)**. An EU region keeps the data in the EU for GDPR.
3. Click **Create new project** and wait about 2 minutes while it sets up.
4. Open **Project Settings** (gear icon, bottom left), then **Data API** (some accounts call it **API**):
   - Copy the **Project URL**. It looks like `https://abcdefghijkl.supabase.co`. The `abcdefghijkl` part is your **project ref**.
5. Go to **Project Settings → API Keys**:
   - Copy the **anon / public** key, a long string starting with `eyJ…`. If you only see "publishable" keys, copy the publishable one (`sb_publishable_…`); either works.
   - Do **not** copy the `service_role` / secret key. It must never go in the app.

## 2. Create the Google login key

1. Go to **https://console.cloud.google.com** and sign in with the Google account that should own the app.
2. In the top bar, open the project picker → **New project** → name it `pizzacalculator` → **Create**. Make sure it is selected afterwards.
3. Open the menu (☰) → **APIs & Services → OAuth consent screen**. On newer consoles this is called **Google Auth Platform**. Click **Get started**.
   - **App name:** `Pizza Calculator`
   - **User support email:** your email
   - **Audience:** **External**
   - **Contact information:** your email
   - Agree to the policy and click **Create**.
4. Still in Google Auth Platform → **Branding**:
   - **Application home page:** `https://pizzacalculator.se`
   - **Application privacy policy link:** `https://pizzacalculator.se/privacy`. I'm building this page in Phase 2.
   - **Authorized domains:** add `pizzacalculator.se` **and** `supabase.co`.
   - **Save**.
5. **Data Access** (scopes): leave as is. The default `email`, `profile` and `openid` are all we use. With only these basic scopes, Google doesn't require app verification.
6. **Audience** → **Publish app** → confirm. Until you do this, only addresses you list as "test users" can log in.
7. **Clients** → **Create client**:
   - **Application type:** **Web application**
   - **Name:** `pizzacalculator web`
   - **Authorized JavaScript origins:**
     - `https://pizzacalculator.se`
     - `http://localhost:5173`
   - **Authorized redirect URIs:** `https://<project-ref>.supabase.co/auth/v1/callback`. Use your project ref from step 1.4. This is the most common place to make a typo.
   - **Create**. Copy the **Client ID** and **Client secret**.

## 3. Connect Google to Supabase

1. In Supabase → **Authentication → Sign In / Providers** (or **Providers**) → **Google**:
   - Turn on **Enable Sign in with Google**.
   - Paste the **Client ID** and **Client secret**. Leave the other fields empty.
   - **Save**.
2. **Authentication → URL Configuration**:
   - **Site URL:** `https://pizzacalculator.se`
   - **Redirect URLs** → **Add URL**, one at a time:
     - `https://pizzacalculator.se/**`
     - `http://localhost:5173/**`
     - `http://localhost:5175/**` (the port Claude's test browser sometimes uses)
   - **Save**.

## 4. Create the database tables

1. In Supabase → **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this repo, copy all of it, paste it in, and click **Run**.
3. You should see "Success. No rows returned".
4. Check: **Table Editor** shows `profiles` and `pizzas`, each with a shield icon (RLS on).

## 5. Give the app the keys

**Locally:** create a file named `.env.local` in the project root, next to `package.json`:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<the anon / publishable key>
```

`.env.local` is ignored by git (`*.local` in `.gitignore`), so it is never committed. Restart `npm run dev` after creating it.

**On GitHub (for pizzacalculator.se):**

1. Open the repo → **Settings → Secrets and variables → Actions → New repository secret**.
2. Add the secret `VITE_SUPABASE_URL` with the Project URL.
3. Add the secret `VITE_SUPABASE_ANON_KEY` with the anon / publishable key.

The deploy workflow passes these to the build.

## 6. Test

1. Run `npm run dev` and open Party Mode.
2. Click **Sign in** and pick your Google account. You should come back to the same page, logged in.
3. Create a pizza. Then, in Supabase → **Table Editor → pizzas**, check that it appears with your `user_id`.

### Troubleshooting

| Symptom | Fix |
|---|---|
| Google says `redirect_uri_mismatch` | The redirect URI in Google (step 2.7) must be exactly `https://<ref>.supabase.co/auth/v1/callback`. |
| After login you land on pizzacalculator.se instead of localhost | Add your localhost URL under Supabase Redirect URLs (step 3.2). |
| "Access blocked: app not published" | Publish the app (step 2.6), or add yourself as a test user. |
| Sign-in button doesn't appear | `.env.local` is missing or misnamed, or you didn't restart the dev server. |
