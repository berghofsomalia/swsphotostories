Editing about.json
==================

The About-page wording for both the standalone and combined pages lives in
about.json. Edit only the text between double quotation marks.

JSON punctuation rules:

1. Keep every field name and text value inside straight double quotes.
2. Keep a comma after each field or question except the final one in its group.
3. Apostrophes such as don't or community's are fine and need no special handling.
4. A double quote inside the text must be written with a backslash, for example:
   "They called it \"a shared journey\" during the workshop."
5. Do not add comments inside about.json.
6. Keep exactly six items in each questions list unless the page code is also changed.

If the JSON punctuation is broken, the website displays a specific error pointing
to content/about.json instead of silently showing incomplete text.
