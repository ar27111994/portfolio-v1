# Fetch Upwork Portfolio from Browser

Cloudflare + OAuth scope limitations prevent automated portfolio fetching.  
This manual process gets ALL attachments (including embedded links like Loom).

## Step 1 — Browser DevTools Console

1. Open Chrome and go to **https://www.upwork.com** — make sure you're logged in
2. Press `F12` to open DevTools
3. Go to the **Console** tab
4. Paste the entire script below and press Enter:

```javascript
fetch("https://api.upwork.com/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `
      query($personId: ID!, $pageSize: Int!) {
        talentPortfolioProjects(filter: {
          personId: $personId,
          published: true,
          page: 0,
          pageSize: $pageSize
        }) {
          projects {
            id
            title
            description
            projectUrl
            rank
            videoUrl
            completionDateTime
            createdDateTime
            thumbnail
            thumbnailOriginal
            attachments {
              id
              type
              title
              description
              link
              originalAttachment
              embeddedLinkUrl
              videoUrl
              fileName
              fileSize
              imageSmall
              imageMiddle
              imageLarge
              creationDateTime
              rank
            }
          }
          totalProjects
        }
      }
    `,
    variables: { personId: "424245383220543488", pageSize: 999999 }
  })
})
  .then((r) => r.json())
  .then((d) => {
    // Save with {data: {talentPortfolioProjects: ...}} wrapper
    // so transform-portfolio.mjs can read it directly
    const count = d.data.talentPortfolioProjects.projects.length;
    const blob = new Blob([JSON.stringify(d, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "upwork-raw.json";
    a.click();
    console.log("✓ Downloaded " + count + " projects");
  })
  .catch((err) => console.error("Failed:", err));
```

5. A file called **`upwork-raw.json`** will download to your Downloads folder

## Step 2 — Process the raw data

```bash
# Copy the downloaded file into the project
cp ~/Downloads/upwork-raw.json src/data/upwork-raw.json

# Transform it to portfolio format
node scripts/transform-portfolio.mjs src/data/upwork-raw.json

# Clean up
rm src/data/upwork-raw.json
```

The final `src/data/upwork-portfolio.json` will now contain ALL attachments for all projects.

## Step 3 — Build

```bash
npm run build
```

## Notes

- You must be logged into Upwork in the browser tab where you open DevTools
- If the download doesn't start, check the DevTools Console for error messages
- The `pageSize: 999999` ensures all projects are returned in one request
- This fetches `talentPortfolioProjects` (browser-only query), which returns ALL attachment types including `embeddedLink` (Loom, GitHub, X/Twitter links)
- The OAuth-based fetch script (`fetch-portfolio-build.mjs`) uses `talentProfile` which is capped at 3 attachments per project — it can't get embedded links
