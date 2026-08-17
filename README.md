# Remnant Atlas

Static, GitHub Pages-ready atlas for Soul's Remnant.

## What this build includes

- Actual world map as the main navigation canvas
- Admin-only location dot placement and drag repositioning
- Toggleable world-map labels
- World-map zoom controls, 100% reset, Fit to Screen, and Ctrl/Cmd + mouse-wheel zoom
- Per-location minimaps
- Minimap marker placement
- Admin-only minimap workshop
- Automatic minimap extraction for the game's minimap screenshots
- Local browser persistence
- Versioned JSON import/export
- Data migration hook for future schema changes

## Run locally

### Easiest

You can now double-click `index.html`.

When opened directly from disk, the app uses `js/seed-data.js` as a fallback because browsers normally block `fetch()` requests from `file://` pages.

### Local-server mode

You can also run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

When served over HTTP (including GitHub Pages), the app prefers `data/atlas.json` as the source of truth.

## GitHub Pages

1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Choose deployment from your main branch/root.
5. GitHub will publish the site.

## Admin mode

Default local prototype PIN:

```text
0420
```

This is not secure authentication. GitHub Pages is static hosting. Admin edits are currently stored only in the browser until exported.

## Saving your work

Use **Export Data** frequently.

The exported JSON contains your atlas data, including world dots, labels, descriptions, minimap markers, and any minimaps saved as browser data URLs.

To make exported data the public version of the atlas:

1. Export your current atlas JSON.
2. Replace `data/atlas.json` in the repository with the exported file.
3. Commit/push.
4. GitHub Pages publishes the updated atlas.

## Future-safe data

`data/atlas.json` has a `schemaVersion`.

Future app builds should add migrations in:

```text
js/migrations.js
```

instead of replacing or resetting existing atlas data.

## Recommended next upgrade

The current GitHub Pages approach is intentionally backend-free.

A future publishing workflow can add a GitHub-authenticated "Publish Changes" action that commits `data/atlas.json` and uploaded minimaps directly to this repository through the GitHub API.
