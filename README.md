# AniList Auto-Comment Bot

### 💡 What it does
Posts comments like:
> Started {series name} on {date}

...for your AniList “Watched/Read” activities that have **0 comments**.

---

### 🛠 Setup (Replit)
1. Import this folder to Replit.
2. Add Secrets:
   - `ANILIST_TOKEN` = your AniList access token  
   - (optional) `RUN_KEY` = secret string to protect endpoint
3. Run once → note your Repl URL (e.g., `https://mybot.username.repl.co`).
4. On [cron-job.org](https://cron-job.org):
   - URL → `https://mybot.username.repl.co/run-now`
   - Method → GET
   - Schedule → 11:59 PM IST (GMT + 5:30)
5. Check `logs.txt` for daily activity.

---

### ⚙️ Environment
Node.js 18+  
Dependencies: `express`, `node-fetch`, `moment-timezone`