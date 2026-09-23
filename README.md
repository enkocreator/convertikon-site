# convertikon.app

The website. One static page, no framework, no build step. Hosted on GitHub Pages
at the custom domain convertikon.app (the `CNAME` file), served over HTTPS only.

- `index.html` - the coming-soon page. Everything inline.
- `assets/` - the wordmark SVG, the mascot (512px), Chakra Petch (SIL OFL).
- `.nojekyll` - tells Pages to serve the files exactly as they are.

## Email sign-up

The gold button turns into an email field; Enter sends. Each address is posted to a
Google Form (one short-answer question), whose answers land in the form's linked Google
Sheet. Only the form's public submit address is in the page; the sheet stays private.
Set `SIGNUP.url` (`https://docs.google.com/forms/d/e/<form id>/formResponse`) and
`SIGNUP.field` (`entry.<question id>`) in `index.html`. Connected to the form
"CONVERTIKON launch list". The form must NOT limit to one response or allow response
editing: both make Google require sign-in, and every submission from the page is refused (401).

`apps-script/signup.gs` is an alternative (an Apps Script web app writing to a sheet
directly); it is not in use.

## More pages

A folder with an `index.html` becomes a clean URL:
`privacy/index.html` -> convertikon.app/privacy, `support/index.html` -> convertikon.app/support.
