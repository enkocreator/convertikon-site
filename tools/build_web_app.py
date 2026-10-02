"""Build the free web version of CONVERTIKON (site folder app/) from the desktop app's own page.

    python tools/build_web_app.py

Copies ../CONVERTIKON/index.html and convert.js into app/, unchanged except for:
  - asset paths point at the site's assets/ (same wordmark and fonts as the app);
  - the panel has no background of its own, so it blends into whatever it sits on;
  - on phones FT and IN open the regular keyboard (its 123 page has - ' " / and space);
    MM, CM and M keep the number pad;
  - a small stand-in for the desktop-only electronAPI: never asks for a licence key,
    remembers FRACTIONAL/DECIMAL in this browser, the pin lights up, x clears the fields
    (its tooltip says Clear, where the desktop app's says Hide), - does nothing.
Rerun it after any change to the app's index.html or convert.js.
"""
import pathlib, re

SITE = pathlib.Path(__file__).resolve().parents[1]
APP = SITE.parent / "CONVERTIKON"
OUT = SITE / "app"

page = (APP / "index.html").read_text(encoding="utf-8")
conv = (APP / "convert.js").read_text(encoding="utf-8")

page = page.replace("'./assets/", "'../assets/").replace('"./assets/', '"../assets/')
assert "./assets/" not in page.replace("../assets/", "")

head_extra = """<meta name="robots" content="noindex">
<!-- WEB VERSION, built by convertikon-site/tools/build_web_app.py from the desktop app's index.html. Don't edit by hand. -->
"""
page = page.replace("<title>CONVERTIKON</title>", head_extra + "<title>CONVERTIKON</title>", 1)

# Phones: FT and IN need - ' " / and space, which the number pad (inputmode="decimal") doesn't have.
for unit in ("ft", "in"):
    old = '<input class="field-input" id="f-%s" type="text" inputmode="decimal" autocomplete="off" spellcheck="false">' % unit
    assert page.count(old) == 1, unit
    page = page.replace(old, '<input class="field-input" id="f-%s" type="text" inputmode="text" autocomplete="off" '
                             'autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done">' % unit)

# The desktop app's x hides the panel to the tray (tooltip "Hide"); on the web there is no tray,
# and x clears the fields (see the stand-in below), so the tooltip says so.
old = '<button class="icon-btn" id="btn-close" aria-label="Hide" title="Hide">'
assert page.count(old) == 1
page = page.replace(old, '<button class="icon-btn" id="btn-close" aria-label="Clear" title="Clear">')

css_extra = """
  /* ── Web version: the panel blends into the page behind it ── */
  .panel { background: none !important; }
</style>"""
page = page.replace("</style>", css_extra, 1)

shim = """<script>
  /* Web version: a stand-in for the desktop app's electronAPI. */
  (function () {
    var mode = 'FRAC', pinned = false;
    try { if (localStorage.getItem('ck-mode') === 'DEC') mode = 'DEC'; } catch (e) {}
    window.electronAPI = {
      initialState: { mode: mode, pinned: false, licensed: true },
      setMode: function (m) { try { localStorage.setItem('ck-mode', m); } catch (e) {} },
      togglePin: function () { pinned = !pinned; return Promise.resolve(pinned); },
      closeWindow: function () { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); },
      minimizeWindow: function () {},
      activateLicense: function () { return Promise.resolve({ ok: true }); }
    };
  })();
</script>
<script src="./convert.js"></script>"""
assert page.count('<script src="./convert.js"></script>') == 1
page = page.replace('<script src="./convert.js"></script>', shim, 1)

OUT.mkdir(exist_ok=True)
(OUT / "index.html").write_text(page, encoding="utf-8")
(OUT / "convert.js").write_text(conv, encoding="utf-8")
print("built", OUT / "index.html", len(page), "bytes")
