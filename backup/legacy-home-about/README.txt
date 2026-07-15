LEGACY HOME AND ABOUT BACKUP

This folder preserves the standalone home and About implementations that were
replaced when the tested combined home-about design became the main homepage.

Contents:
- home/index.html: previous root homepage entry file
- about/: previous public About route and its complete image folder
- assets/home-page.js: previous standalone homepage script
- assets/home.css: snapshot of its page styles
- assets/about-v2.js, about.css and about-v2.css: snapshots of the About code
- content/: snapshot of the editable About copy

Shared site modules such as api.js, content.js, menu.js and base.css remain in
the main assets folder because Stories, Admin, and the promoted homepage use
them too. Restore the legacy files to their former root locations if the old
standalone pages are needed again.
