# Running the Wellness Planner on Replit (view only, no deploying)

The zip `wellness_replit.zip` holds the backend (`wellness_planner`), the front end
(`wellness_frontend`), and two Replit files: `.replit` (settings) and `start.sh` (starts both servers).

## Setting it up (one person, about 10 minutes)

1. In Replit, click **New → Empty project**. If it asks for a language or template, pick any blank one; our `.replit` file replaces it. Don't describe the app to the Agent or start from Chat or Website, because those have the AI build its own version and use credits.
2. In the file panel, open the **⋮** menu and choose **Upload folder**. Upload the `wellness_replit` folder.
3. Open the **Shell** tab and run this, which moves everything out of the folder to the top level (our `.replit` replaces the template's):
   ```bash
   cp -a wellness_replit/. . && rm -rf wellness_replit
   ```
   (If you uploaded the zip file instead, run `unzip -o wellness_replit.zip && rm wellness_replit.zip`.)
4. Press **Run**. The first run takes a few minutes because it installs packages and creates the demo account. Later runs take about 20 seconds.
5. When the Console shows `Local: http://localhost:5173/`, the preview opens. To use the app in a full browser tab, click the **open in new tab** icon in the preview's address bar.

The demo login is in `wellness_planner/wellness/seed.py` (DEMO_EMAIL / DEMO_PASSWORD).

## Sharing with the team

- **Invite them:** click **Invite** at the top right and add their Replit accounts. They open the app and press **Run**.
- **Or share the preview address** (ending in `.replit.dev`) while you have it running. It stops working when the app stops, and anyone with the link can open it, so share it only with the team.

## Rules

- **Don't click Deploy or Publish.** The team agreed not to deploy until the app is finished.
- **Don't ask the Agent or Assistant to change or fix things.** That uses credits and edits the code. Make code changes on our own computers, then upload a new zip.
- **Running and clicking around doesn't use AI credits.**

## Troubleshooting

| Problem | Fix |
|---|---|
| "The server isn't responding" | The backend didn't start. Check the Console for a Python error, then press Stop and Run again. |
| Login works in a new tab but not in the small preview | The browser blocks cookies inside the preview frame. Use the full tab. |
| Reset the demo data | In the Shell: `cd wellness_planner && python3 -m flask --app wellness seed-demo` |
| Start over completely | In the Shell: `rm wellness_planner/instance/wellness.sqlite`, then press Run. |
| Updating to a newer version | Upload the new folder, run the `cp -a` command again, then Stop and Run. Your demo data is kept. |
