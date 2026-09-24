"""Build the free web version of CONVERTIKON (site folder app/) from the desktop app's own page.

    python tools/build_web_app.py

Copies ../CONVERTIKON/index.html and convert.js into app/, unchanged except for:
  - asset paths point at the site's assets/ (same wordmark and fonts as the app);
  - the panel has no background of its own, so it blends into whatever it sits on;
  - a small stand-in for the desktop-only electronAPI: never asks for a licence key,
    remembers FRACTIONAL/DECIMAL in this browser, the pin lights up, x clears the fields,
    - does nothing.
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
