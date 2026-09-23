# convertikon.app

The website. One static page, no framework, no build step. Hosted on GitHub Pages
at the custom domain convertikon.app (the `CNAME` file), served over HTTPS only.

- `index.html` - the coming-soon page. Everything inline.
- `assets/` - the wordmark SVG, the mascot (512px), Chakra Petch (SIL OFL).
- `.nojekyll` - tells Pages to serve the files exactly as they are.

## Email sign-up

The page has an email field and a button. Each address is posted to a small Google Apps
Script web app, which appends it as a row (date, email, source) to the "Signups" tab of a
private Google Sheet. Duplicates and bot submissions are skipped. The sheet itself is
never public; the page only knows the script's URL.

Setup, once: new Google Sheet -> Extensions -> Apps Script -> paste `apps-script/signup.gs`
-> Deploy -> New deployment -> Web app, Execute as: Me, Who has access: Anyone -> authorise
-> copy the Web app URL (`https://script.google.com/macros/s/.../exec`) into `SIGNUP_URL`
in `index.html`. Until `SIGNUP_URL` is set, the button opens an email to Elizabeth instead.

## More pages

A folder with an `index.html` becomes a clean URL:
`privacy/index.html` -> convertikon.app/privacy, `support/index.html` -> convertikon.app/support.
