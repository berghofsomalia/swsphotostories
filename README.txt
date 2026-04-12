Photostory GitHub Pages package

Contents
- index.html: main one-page experience
- assets/styles.css: site styles
- assets/app.js: site logic
- data/stories.json: cleaned story data used by the site
- images/: bundled image assets, including local lead photos in images/leads/
- .github/workflows/pages.yml: GitHub Pages workflow for static deployment

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


Landing assets: place landing visuals in /images/landing using names like 1 (1).jpg, 1 (2).jpg for section 1, 3 (1).jpg for section 3, 4 (1).jpg for section 4, 5 (1).jpg for section 5, and map 2.png for the map section. The first digit is the section number and the number in brackets is used for randomisation on each page load.
