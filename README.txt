Photostory GitHub Pages package

Contents
- index.html: combined home and project-background experience
- _about-source/index.html: private lazy-rendering source for the background sections
- stories/index.html: stories and gallery page
- admin/index.html: admin interface
- assets/base.css: shared reset, tokens, loading states and utility menu
- assets/home.css: home page styles
- assets/about.css: about page styles
- assets/home-about.css: combined-page layout and transition styles
- assets/stories.css: stories page styles
- assets/admin.css: admin page styles
- assets/app.js: site logic
- data/stories.json: cleaned story data used by the site
- images/: bundled image assets, including local lead photos in images/leads/
- .github/workflows/pages.yml: GitHub Pages workflow for static deployment
- content/about.json: editable English and Somali background copy
- backup/legacy-home-about/: recoverable standalone home and About sources

Deploy
1. Create a GitHub repository or open your existing Pages repository.
2. Upload all files and folders from this package to the repository root.
3. Enable GitHub Pages with GitHub Actions as the source.
4. Make sure .nojekyll stays in place.

Notes
- Saved stories are stored in the browser via localStorage.
- Share links point to index.html?code=STORYCODE.
- The first image for each story is the local real JPG lead image.
- The remaining carousel images come from the original package image folders.


Background images used by the combined homepage are stored in /_about-source/images.
