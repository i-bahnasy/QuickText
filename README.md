# QuickText

Easily save text entries in the GNOME Shell system tray / top bar, copy them to the clipboard silently, or delete them when no longer needed.

- **UUID:** `quicktext@i-bahnasy`
- **GNOME Shell Version:** 51 (and versions listed in `metadata.json`)
- **Repository:** https://github.com/i-bahnasy/QuickText

## Features

- **System Tray / Top Bar Menu:** Displays `quicktext-symbolic.svg` in the top panel and opens a scrollable popup menu.
- **Add Entries (Up to 200 Characters):** Type a snippet and click **Add** or press `Enter`, with a live character counter capped at **200 characters**.
- **30-Entry Limit:** Keeps up to **30 saved entries** persistently in `GSettings` and disables adding new entries once the limit is reached until an entry is deleted.
- **Silent Copy & Delete:** Every entry includes a **Copy** button (copies to clipboard with no desktop notification banner) and a **Delete** button.

## Project Structure

```text
quicktext@i-bahnasy/
├── extension.js
├── metadata.json
├── quicktext-symbolic.svg
├── README.md
├── stylesheet.css
└── schemas/
    └── org.gnome.shell.extensions.snippet-vault.gschema.xml
```

## Manual Installation

1. **Create the extension directory**

   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/quicktext@i-bahnasy/schemas
   ```

2. **Add the extension files**

   Save `metadata.json`, `extension.js`, `stylesheet.css`, `quicktext-symbolic.svg`, and `schemas/org.gnome.shell.extensions.snippet-vault.gschema.xml` inside `~/.local/share/gnome-shell/extensions/quicktext@i-bahnasy/`.

3. **Compile the GSettings schema**

   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/quicktext@i-bahnasy/schemas/
   ```

   Verify that `gschemas.compiled` was generated:

   ```bash
   ls ~/.local/share/gnome-shell/extensions/quicktext@i-bahnasy/schemas/gschemas.compiled
   ```

4. **Restart your GNOME Shell session and enable the extension**

   Log out and log back in so GNOME Shell detects the extension, then run:

   ```bash
   gnome-extensions enable quicktext@i-bahnasy
   gnome-extensions info quicktext@i-bahnasy
   ```

## Packaging

To build a `.shell-extension.zip` archive for distribution (such as uploading to extensions.gnome.org or attaching to a GitHub release):

```bash
cd ~/.local/share/gnome-shell/extensions/quicktext@i-bahnasy

gnome-extensions pack \
  --force \
  --extra-source=quicktext-symbolic.svg \
  --schema=schemas/org.gnome.shell.extensions.snippet-vault.gschema.xml \
  --out-dir=.
```

### Verify the Packaged Archive

```bash
unzip -l quicktext@i-bahnasy.shell-extension.zip
```

Expected files in the archive:

- `metadata.json`
- `extension.js`
- `stylesheet.css`
- `quicktext-symbolic.svg`
- `schemas/org.gnome.shell.extensions.snippet-vault.gschema.xml`
- `schemas/gschemas.compiled`

### Install from the Packaged Archive

```bash
gnome-extensions install --force quicktext@i-bahnasy.shell-extension.zip
```

Log out and log back in, then enable it:

```bash
gnome-extensions enable quicktext@i-bahnasy
```

## Troubleshooting

- **Extension not listed or not enabling:** Confirm `metadata.json` has `"uuid": "quicktext@i-bahnasy"` and a matching `"shell-version"`, ensure `schemas/gschemas.compiled` exists, log out and back in, and check logs with:

  ```bash
  journalctl /usr/bin/gnome-shell -n 40 --no-pager
  ```

- **Changes not showing up after editing files:** Log out of your GNOME session and log back in so GNOME Shell reloads the extension code.

## Uninstall

To disable and remove the extension and reset its saved entries:

```bash
gnome-extensions disable quicktext@i-bahnasy
gsettings reset org.gnome.shell.extensions.snippet-vault entries
rm -rf ~/.local/share/gnome-shell/extensions/quicktext@i-bahnasy
```