import express from "express";
import fetch from "node-fetch";
import moment from "moment-timezone";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;
const ANILIST_TOKEN = process.env.ANILIST_TOKEN;
const RUN_KEY = process.env.RUN_KEY || null;
const COOLDOWN = 120000;
const TIMEZONE = "Asia/Kolkata";
const LOG_FILE = "./logs.txt";

async function logToFile(msg) {
  const timestamp = moment().tz(TIMEZONE).format("YYYY-MM-DD HH:mm");
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`);
}

async function fetchMyId() {
  const query = `query { Viewer { id name } }`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ANILIST_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  return data.data?.Viewer?.id;
}

async function fetchActivities(userId) {
  const query = `
    query ($userId: Int) {
      Page(perPage: 20) {
        activities(userId: $userId, sort: ID_DESC) {
          id
          type
          status
          progress
          replyCount
          media { title { romaji english native } }
        }
      }
    }`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ANILIST_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables: { userId } })
  });
  const data = await res.json();
  return data.data?.Page?.activities || [];
}

async function postComment(activityId, text) {
  const mutation = `
    mutation ($id: Int, $text: String) {
      SaveActivityReply(activityId: $id, text: $text) { id }
    }`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ANILIST_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: mutation, variables: { id: activityId, text } })
  });
  return res.ok;
}

async function runBot() {
  const runDate = moment().tz(TIMEZONE).format("YYYY-MM-DD");
  await logToFile(`=== Run started on ${runDate} ===`);

  const userId = await fetchMyId();
  const activities = await fetchActivities(userId);

  const filtered = activities.filter(a =>
    a.replyCount === 0 &&
    (a.type === "ANIME_LIST" || a.type === "MANGA_LIST") &&
    (a.status?.includes("watched") || a.status?.includes("read") || a.status?.includes("Watched") || a.status?.includes("Read"))
  );

  await logToFile(`Found ${filtered.length} new activities.`);

  for (const act of filtered) {
    const title = act.media?.title?.romaji || act.media?.title?.english || act.media?.title?.native || "Unknown series";
    const comment = `Started ${title} on ${runDate}`;
    const success = await postComment(act.id, comment);
    if (success) {
      await logToFile(`Commented on ${title} (Activity ${act.id})`);
    } else {
      await logToFile(`Failed to comment on ${title} (Activity ${act.id})`);
    }
    await new Promise(r => setTimeout(r, COOLDOWN));
  }

  await logToFile("=== Run complete ===\n");
  process.exit(0);
}

app.get("/", (req, res) => res.send("AniList auto-bot is online."));
app.get("/run-now", async (req, res) => {
  if (RUN_KEY && req.query.key !== RUN_KEY) return res.status(403).send("Forbidden");
  res.send("Bot started!");
  runBot();
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));