# Phase 1 — Security & Codebase Cleanup Report

This report documents the security fixes, codebase cleanup, quality updates, and structural improvements performed during **Phase 1**.

---

## 1. Security Findings

*   **Public Access to Messages Endpoint:** Previously, any user could navigate to `GET /api/messages` and retrieve all submitted contact form details (names, emails, and message texts) stored in the PostgreSQL database.
*   **Committed Local Credentials:** A duplicate, untracked directory containing local `.env` configuration files with sensitive postgres passwords, Telegram bot tokens, Cloudinary API secrets, and YouTube API keys was present in the directory structure.

---

## 2. Secret Exposure Findings

*   **Exposed Files:** 
    *   `c:\merged_partition_content\amarjeet-portfolio\.env` (untracked, local only)
    *   `c:\merged_partition_content\amarjeet-portfolio\amarjeet-portfolio\.env` (nested copy, deleted during cleanup)
    *   `server/.env` (previously committed and tracked, now removed in commit history but still visible in past commit objects)

*Note: No actual secret values are displayed in this report to prevent further credential exposure.*

---

## 3. Credential Rotation Requirements

Because credentials were previously checked into the Git history, they are considered compromised. You should rotate the following keys on their respective management dashboards:

1.  **Neon PostgreSQL Database Connection:** Reset the database password in the Neon Console. Update the `DATABASE_URL` env variable in your hosting platform (Render/Vercel) and local `.env` with the new connection string.
2.  **Telegram Bot Token:** Use BotFather on Telegram to revoke the current API token and generate a new one. Update `TELEGRAM_BOT_TOKEN`.
3.  **Cloudinary Credentials:** Log into your Cloudinary console and rotate the API secret. Update `CLOUDINARY_API_SECRET`.
4.  **YouTube API Key:** Log into the Google Cloud Console, navigate to APIs & Services -> Credentials, and delete/recreate the API key. Update `YOUTUBE_API_KEY`.

---

## 4. Git-History Findings

*   **History Check:** A review of Git commit logs shows that `server/.env` containing credentials was committed in the past (e.g. in commits `0e714b7f`, `20509768`, `a26116a3`, and `f0c89d09`). It was later deleted in commit `e4a64a1e9`.
*   **Tracking Status:** The root `.env` and `server/.env` are not currently tracked in the Git index.
*   **Cleanup Required:** To fully delete these historical credentials from Git history, you must run a history rewriting tool.

### Manual Actions Required: Purge Git History
We did not rewrite your Git history because it is a destructive operation. To purge the credentials from past commits, execute the following command in your local terminal:

```bash
# We recommend using git-filter-repo (Python-based tool)
pip install git-filter-repo
git filter-repo --path server/.env --invert-paths
```
*Note: This will rewrite commit hashes in your branch history. Once completed, you will need to force push to your remote repository (`git push origin --force`). Do not do this if other developers are actively contributing to the same branch without coordination.*

---

## 5. `/api/messages` Security Changes

*   **Secured Endpoint:** Replaced the public `app.get('/api/messages', ...)` route in [server/server.js](file:///c:/merged_partition_content/amarjeet-portfolio/server/server.js#L1139) with token-authorized access.
*   **Authentication Check:** The endpoint now checks for the header `Authorization: Bearer <API_KEY>`, verifying it against `process.env.ADMIN_API_KEY`. Requests without a matching token receive `401 Unauthorized` responses.
*   **Contact Form Integrity:** The public contact form submission (`POST /api/contact`) continues to work without authentication, ensuring visitors can still submit messages.

---

## 6. Duplicate Codebase Cleanup

*   Deleted the entire nested directory `amarjeet-portfolio/amarjeet-portfolio`.
*   Verified that it was completely redundant and did not contain any unique files.

---

## 7. ESLint Fixes

*   Updated [eslint.config.js](file:///c:/merged_partition_content/amarjeet-portfolio/eslint.config.js) to configure frontend (`src/`) and backend (`server/`, `start.js`, config files) under separate scope blocks.
*   Assigned browser globals (`globals.browser`) to frontend files, and Node.js globals (`globals.node`) to server scripts.
*   Ignored `dist/` and automated directories.
*   Set ESLint compiler parser options to `ecmaVersion: 2022` to support ES12 features.
*   Removed unused `useEffect` import in [Navbar.jsx](file:///c:/merged_partition_content/amarjeet-portfolio/src/Navbar.jsx#L1).
*   Prefixed the Express error handler unused `next` parameter with `_next` and added `argsIgnorePattern` to ESLint rules to prevent warnings.
*   Linter output now shows **0 errors and 0 warnings**.

---

## 8. Link Fixes

*   **LeetCode Badge Link:** Updated placeholder in [README.md](file:///c:/merged_partition_content/amarjeet-portfolio/README.md#L160) to point to the user's profile: `https://leetcode.com/u/Amarjeet__Yadav/`.
*   **LinkedIn Links:** Replaced old LinkedIn username links in [README.md](file:///c:/merged_partition_content/amarjeet-portfolio/README.md) with `https://linkedin.com/in/amarjeet-yadav-978820291` to match the website footer.
*   **Netlify URL Space:** Removed the leading space in the live URL link in [Projects.jsx](file:///c:/merged_partition_content/amarjeet-portfolio/src/Projects.jsx#L51).

---

## 9. Technology Consistency Fixes

*   **Cafe Management System:** Aligned technology details in [README.md](file:///c:/merged_partition_content/amarjeet-portfolio/README.md) to match the PHP/MySQL stack in [Projects.jsx](file:///c:/merged_partition_content/amarjeet-portfolio/src/Projects.jsx).
*   **Auto Theft Guard:** Unified the project name and repository path between [Projects.jsx](file:///c:/merged_partition_content/amarjeet-portfolio/src/Projects.jsx) and the [README.md](file:///c:/merged_partition_content/amarjeet-portfolio/README.md).

---

## 10. CSS Fixes

*   **Cascading Order:** Moved `max-width: 768px` media query *before* `max-width: 640px` query in [App.css](file:///c:/merged_partition_content/amarjeet-portfolio/src/App.css#L1210-L1272) to fix Mobile layout precedence overrides.
*   **Variable Consolidations:** Swapped `:root` and `[data-theme='light']` variable definitions in [Theme.css](file:///c:/merged_partition_content/amarjeet-portfolio/src/Theme.css#L1-L24) so that the default root styles are dark-mode first, aligning with `index.css`.

---

## 11. Accessibility Fixes

*   **Keyboard Focus visible outline:** Enabled focus rings globally using `:focus-visible` outline rings in [index.css](file:///c:/merged_partition_content/amarjeet-portfolio/src/index.css#L75-L80).
*   **Component Visual Indication:** Added focus glow indications to focused inputs in [App.css](file:///c:/merged_partition_content/amarjeet-portfolio/src/App.css#L930) and [SafeYouTube.css](file:///c:/merged_partition_content/amarjeet-portfolio/src/SafeYouTube.css#L67).

---

## 12. Sitemap / Robots Fixes

*   **Sitemap Generation:** Generated a valid [sitemap.xml](file:///c:/merged_partition_content/amarjeet-portfolio/public/sitemap.xml) in the public directory containing all page pathways.
*   **robots.txt Sitemap Alignment:** Confirmed that the sitemap target matches the domain in `robots.txt`.

---

## 13. Files Deleted

*   `src/Mobile.css` (0-byte empty file)
*   `server/LearnSection.jsx` (0-byte misplaced React file)
*   `view-messages.js` (0-byte unused root script)
*   `database.sqlite` (unused sqlite file; remote postgres is used)
*   `_profile_readme_push_20260706011146/` (legacy automated folder)
*   `amarjeet-portfolio/` (nested duplicate folder)

---

## 14. Files Modified

*   [README.md](file:///c:/merged_partition_content/amarjeet-portfolio/README.md)
*   [eslint.config.js](file:///c:/merged_partition_content/amarjeet-portfolio/eslint.config.js)
*   [public/sitemap.xml](file:///c:/merged_partition_content/amarjeet-portfolio/public/sitemap.xml)
*   [server/.env.example](file:///c:/merged_partition_content/amarjeet-portfolio/server/.env.example)
*   [server/server.js](file:///c:/merged_partition_content/amarjeet-portfolio/server/server.js)
*   [src/App.css](file:///c:/merged_partition_content/amarjeet-portfolio/src/App.css)
*   [src/Navbar.jsx](file:///c:/merged_partition_content/amarjeet-portfolio/src/Navbar.jsx)
*   [src/Projects.jsx](file:///c:/merged_partition_content/amarjeet-portfolio/src/Projects.jsx)
*   [src/SafeYouTube.css](file:///c:/merged_partition_content/amarjeet-portfolio/src/SafeYouTube.css)
*   [src/Skills.jsx](file:///c:/merged_partition_content/amarjeet-portfolio/src/Skills.jsx)
*   [src/Theme.css](file:///c:/merged_partition_content/amarjeet-portfolio/src/Theme.css)
*   [src/index.css](file:///c:/merged_partition_content/amarjeet-portfolio/src/index.css)

---

## 15. Dependencies Changed

*   No dependencies were added or updated.

---

## 16. Tests Performed

*   **Vite Production Build:** Compiled successfully via `npm run build`.
*   **Linter Checks:** Completed with 0 warnings/errors via `npm run lint`.
*   **Endpoint Privacy verification:** Sent `GET /api/messages` requests:
    *   *Without token:* Responded `401 Unauthorized` (Security PASS).
    *   *With token:* Responded `200 OK` containing message records (Access PASS).

---

## 17. Remaining Risks

*   **Historical Git Secrets:** Credentials remain accessible in historical commits until you complete the manual Git history cleanup outlined in Section 4.
*   **External Token Exposure:** Ensure the `ADMIN_API_KEY` token is rotated regularly.

---

```
Security status:
NEEDS MANUAL ACTION (Rotate external keys + purge historical Git commits)

Lint:
PASS

Build:
PASS

Public message exposure:
FIXED

Secrets removed from working tree:
YES

Secrets removed from Git history:
REQUIRES MANUAL ACTION
```
