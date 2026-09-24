/* Email links: clicking an address opens a small menu, so a new email opens even when the
   visitor's computer has no mail app set up (a bare mailto: link then does nothing).
   Gmail and Outlook open a ready-addressed email in the browser; "Mail app" is the plain mailto:.
   No outside services, nothing is sent anywhere by this script. */
(function () {
  var SUBJECT = 'CONVERTIKON';
  var css =
    '.ck-mail{position:absolute;z-index:1000;min-width:200px;padding:6px 0;background:#3E5A6E;color:#DCD9D3;' +
    'font:700 13px/1 "Chakra Petch","Segoe UI",system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;' +
    'clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);box-shadow:0 6px 18px rgba(0,0,0,.18)}' +
    '.ck-mail a,.ck-mail button{display:block;width:100%;padding:11px 16px;background:none;border:0;color:inherit;font:inherit;' +
    'letter-spacing:inherit;text-transform:inherit;text-align:left;text-decoration:none;cursor:pointer}' +
    '.ck-mail a:hover,.ck-mail button:hover,.ck-mail a:focus-visible,.ck-mail button:focus-visible{background:#4A6B82;color:#E8C32B;outline:0}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  var menu = null;
  function close() { if (menu) { menu.remove(); menu = null; } }

  function open(link) {
    close();
    var addr = link.getAttribute('href').replace(/^mailto:/i, '').split('?')[0];
    var to = encodeURIComponent(addr), su = encodeURIComponent(SUBJECT);
    var items = [
      ['Gmail', 'https://mail.google.com/mail/?view=cm&fs=1&to=' + to + '&su=' + su],
      ['Outlook', 'https://outlook.live.com/mail/0/deeplink/compose?to=' + to + '&subject=' + su],
      ['Mail app', 'mailto:' + addr + '?subject=' + su]
    ];
    menu = document.createElement('div'); menu.className = 'ck-mail'; menu.setAttribute('role', 'menu');
    items.forEach(function (it) {
      var a = document.createElement('a'); a.textContent = it[0]; a.href = it[1]; a.setAttribute('role', 'menuitem');
      if (it[1].indexOf('http') === 0) { a.target = '_blank'; a.rel = 'noopener'; }
      a.addEventListener('click', function () { setTimeout(close, 0); });
      menu.appendChild(a);
    });
    var copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy address'; copy.setAttribute('role', 'menuitem');
    copy.addEventListener('click', function () {
      var done = function () { copy.textContent = 'Copied'; setTimeout(close, 900); };
      if (navigator.clipboard) navigator.clipboard.writeText(addr).then(done, done); else done();
    });
    menu.appendChild(copy);
    document.body.appendChild(menu);
    var r = link.getBoundingClientRect(), w = menu.offsetWidth;
    var left = Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - w - 8);
    menu.style.left = Math.max(8, left) + 'px';
    menu.style.top = (r.bottom + window.scrollY + 6) + 'px';
    menu.querySelector('a').focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (link && !(menu && menu.contains(link))) { e.preventDefault(); open(link); return; }
    if (menu && !menu.contains(e.target)) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', close);
})();
