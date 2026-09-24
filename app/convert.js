/* Convertikon — conversion rules: reading what the user types and formatting
   results. Pure logic, no DOM. index.html loads this as a plain script (so the
   functions are globals there); tests/conversion.test.js loads it with require(). */

const DENOM = 16;                                            // fraction precision (1/16")
const FACTORS = { mm: 1, cm: 10, m: 1000, ft: 304.8, in: 25.4 };
const HINT_BASE = 1000;                                      // 1 metre drives the ghost hints
const THIN = ' ';                                       // thousands separator: a narrow space

// ── Reading ─────────────────────────────────────────────────────
// Every reader returns one of:
//   { state: 'empty' }             nothing typed
//   { state: 'ok', value }         a complete number
//   { state: 'partial', value? }   still being typed ("12.", "1 1/"); value is the part
//                                  that is already complete, if any
//   { state: 'bad' }               can never become a number (letters, a second dot,
//                                  a minus sign, /0 …) — the other fields show 0
// A comma counts as a decimal point: the numpad types one on many keyboard layouts.
// The thousands space the app shows (THIN) is ignored, so a shown value reads back.

function readNumber(raw) {
  const s = String(raw).replace(/ /g, '').trim().replace(',', '.');
  if (!s) return { state: 'empty' };
  let m;
  if (/^\d+(\.\d*)?$|^\.\d+$/.test(s)) return { state: 'ok', value: parseFloat(s) };   // 12 · 12.5 · 12. · .5
  if ((m = s.match(/^(\d+)\/(\d+)$/))) {                                                // 3/8
    return +m[2] ? { state: 'ok', value: m[1] / m[2] } : { state: 'bad' };
  }
  if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) {                                        // 4 1/2
    return +m[3] ? { state: 'ok', value: +m[1] + m[2] / m[3] } : { state: 'bad' };
  }
  if (s === '.' || /^\d+\/$/.test(s)) return { state: 'partial' };                      // "." · "3/"
  if ((m = s.match(/^(\d+)\s+(\d+\/?)?$/))) return { state: 'partial', value: +m[1] };   // "4 1" · "4 1/"
  return { state: 'bad' };
}

const unifyQuotes = s => String(s).replace(/ /g, '').trim().replace(/[‘’′]/g, "'").replace(/[“”″]/g, '"');

// IN: a number, optionally closed with an inch mark ("4 1/2\""). A feet mark is wrong here.
function readInches(raw) {
  let s = unifyQuotes(raw);
  if (!s) return { state: 'empty' };
  if (s.includes("'")) return { state: 'bad' };
  const mark = s.endsWith('"');
  if (mark) s = s.slice(0, -1);
  if (s.includes('"')) return { state: 'bad' };
  const r = readNumber(s);
  return mark && r.state !== 'ok' ? { state: 'bad' } : r;   // a closing " means "finished"
}

// FT: whole feet, then optionally a separator — ' or - or '- (the app's own 1'-8" form),
// with or without spaces — and inches in any IN form, optionally closed with ".
// A bare space also separates feet from inches, but only when whole inches come next
// (6 3 · 6 3 1/2 · 6 3.5). A fraction straight after the space stays rejected: "6 1/2"
// could mean 6'-1/2" or 6 1/2 feet.
// In DECIMAL mode it also takes decimal feet: 6.25 · 6,25 · 6.25' · .5 — a single number
// with a decimal point can only mean feet. FRACTIONAL mode keeps feet whole, so there
// "6.25" is rejected. Bare inches ("6\"") are rejected in both.
function readFeet(raw, mode) {
  let s = unifyQuotes(raw);
  if (!s) return { state: 'empty' };
  if (mode === 'DEC') {
    const d = s.match(/^(\d*[.,]\d*)\s*'?$/);
    if (d) return readNumber(d[1]);
  }
  const mark = s.endsWith('"');
  if (mark) s = s.slice(0, -1).trimEnd();
  let m;
  if ((m = s.match(/^(\d+)\s*(?:'\s*-?|-)\s*(.*)$/)) ||
      (m = s.match(/^(\d+)\s+(\d+(?:[.,]\d*)?(?:\s+\S*)?)$/))) {
    const ft = +m[1];
    if (!m[2]) return mark ? { state: 'bad' } : { state: 'ok', value: ft };        // 6' · 6- · 6'-
    const r = readNumber(m[2]);
    if (r.state === 'ok') return { state: 'ok', value: ft + r.value / 12 };
    if (r.state === 'partial' && !mark) return { state: 'partial', value: ft + (r.value || 0) / 12 };
    return { state: 'bad' };
  }
  if (!mark && /^\d+$/.test(s)) return { state: 'ok', value: +s };                // 6
  return { state: 'bad' };
}

function readField(unit, raw, mode) {
  return unit === 'ft' ? readFeet(raw, mode) : unit === 'in' ? readInches(raw) : readNumber(raw);
}

// ── Formatting ──────────────────────────────────────────────────
function trimNum(v, dp) {
  if (!isFinite(v)) return '0';
  return String(parseFloat(v.toFixed(dp)));
}

function fracIn(v) {
  let whole = Math.floor(v + 1e-9);
  let num = Math.round((v - whole) * DENOM);
  let d = DENOM;
  if (num === DENOM) { whole++; num = 0; }
  while (num > 0 && num % 2 === 0 && d % 2 === 0) { num /= 2; d /= 2; }
  const parts = [];
  if (whole) parts.push(String(whole));
  if (num)   parts.push(num + '/' + d);
  return parts.length ? parts.join(' ') : '0';
}

// Split a length (mm) into whole feet + an inch string. The inches are rounded to
// display precision FIRST, so a remainder that rounds up to 12 rolls over into the
// next foot — the result is never 3'-12".
function feetParts(mm, mode) {
  const totalIn = mm / 25.4;
  const rounded = mode === 'FRAC' ? Math.round(totalIn * DENOM) / DENOM
                                  : Math.round(totalIn * 1000) / 1000;
  const ft = Math.floor(rounded / 12 + 1e-9);
  const rem = rounded - ft * 12;
  if (mode !== 'FRAC') return { ft, inStr: trimNum(rem, 3) };
  // Under an inch the zero inches are written out, as on drawings: 164'-0 1/2", not 164'-1/2"
  const inStr = fracIn(rem);
  return { ft, inStr: inStr.includes('/') && !inStr.includes(' ') ? '0 ' + inStr : inStr };
}

// Result display: 1'-8" · 1'-8 1/2" · 1'-8.5"; whole feet show bare, e.g. 44
function feetMarked(mm, mode) {
  const { ft, inStr } = feetParts(mm, mode);
  return inStr === '0' ? String(ft) : ft + "'-" + inStr + '"';
}

// Plain dash form, shown while editing FT and in the FT ghost hint: 1-8 · 1-8 1/2
function feetPlain(mm, mode) {
  const { ft, inStr } = feetParts(mm, mode);
  return inStr === '0' ? String(ft) : ft + '-' + inStr;
}

// A result as a field shows it when you're not typing in it.
// FT is always feet-and-inches: fractions in FRACTIONAL mode (3'-3 3/8"), decimal
// inches in DECIMAL mode (3'-3.37"). Never decimal feet (Elizabeth, 23 Sep 2026).
function formatUnit(unit, mm, mode) {
  if (mm == null) return '';
  if (unit === 'ft') return feetMarked(mm, mode);
  // MM shows whole millimetres, decimals cut off (1828.8 -> 1828). Display only:
  // the other fields still convert from the exact length. The tiny nudge keeps
  // float noise (1904.9999999998 for 6'-3") from dropping a whole millimetre.
  if (unit === 'mm') return String(Math.floor(mm + 1e-6));
  const v = mm / FACTORS[unit];
  if (unit === 'in' && mode === 'FRAC') return fracIn(v);
  return trimNum(v, 3);
}

// Thousands grouped with a narrow space, from 1 000 up: 50 000 · 1 968 1/2 · 1 640'-5".
// Only whole-number digits — never decimals or the parts of a fraction. Narrower than
// the space before a fraction, so 1 968 1/2 still reads as one number.
function groupThousands(s) {
  return String(s).replace(/(^|[^\d.\/])(\d{4,})/g,
    (m, pre, digits) => pre + digits.replace(/\B(?=(\d{3})+$)/g, THIN));
}

// A result as the field shows it: formatUnit with thousands grouped. Editing and
// copying use the plain formatUnit form (typing "1 000" in FT would mean 1'-0").
function showUnit(unit, mm, mode) {
  return groupThousands(formatUnit(unit, mm, mode));
}

// Ghost hint for an empty field (the 1-metre demo values). FT shows its plain form.
function hintValue(unit, mode) {
  return groupThousands(unit === 'ft' ? feetPlain(HINT_BASE, mode) : formatUnit(unit, HINT_BASE, mode));
}

if (typeof module !== 'undefined') {
  module.exports = { DENOM, FACTORS, HINT_BASE, THIN, readNumber, readInches, readFeet, readField,
                     trimNum, fracIn, feetParts, feetMarked, feetPlain, formatUnit,
                     groupThousands, showUnit, hintValue };
}
