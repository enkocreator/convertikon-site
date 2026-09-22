# convertikon.app

The website. One static page, no framework, no build step. Hosted on GitHub Pages
at the custom domain convertikon.app (the `CNAME` file), served over HTTPS only.

- `index.html` - the coming-soon page. Everything inline.
- `assets/` - the wordmark SVG, the mascot (512px), Chakra Petch (SIL OFL).
- `.nojekyll` - tells Pages to serve the files exactly as they are.

## Email capture

The page uses Kit (kit.com) - free up to 10,000 subscribers, plain HTML form, no
script needed. Until the Kit form exists the button is a mail link.

To switch it on: create a form in Kit, open its Publish tab, choose HTML, and copy the
form id from the action URL (`https://app.kit.com/forms/<ID>/subscriptions`). Then
replace the mail-link block in `index.html` with:

    <form class="row" action="https://app.kit.com/forms/<ID>/subscriptions" method="post">
      <input type="email" id="email" name="email_address" placeholder="you@studio.com"
             autocomplete="email" inputmode="email" required>
      <button class="btn" type="submit">Tell me when</button>
    </form>

## More pages

A folder with an `index.html` becomes a clean URL:
`privacy/index.html` -> convertikon.app/privacy, `support/index.html` -> convertikon.app/support.
