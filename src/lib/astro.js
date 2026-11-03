// Sky maths for Devprayag, ported verbatim from the prototype (design/prototype/JournalPost.dc.html, astro_()).
// Every page variant of this code was run side by side and gives identical results; this is the superset.
// Accurate to about a degree, which the footer says on every page.
/* eslint-disable */
// ---- sky maths for Devprayag (30.146°N, 78.598°E); accurate to about a degree ----
var rad = function (x) { return x * Math.PI / 180; }, deg = function (x) { return x * 180 / Math.PI; }, norm = function (x) { return ((x % 360) + 360) % 360; };
var LAT = 30.146, LON = 78.598;
var dayN = function (ms) { return ms / 864e5 + 2440587.5 - 2451545.0; };
var sunLon = function (ms) { var d = dayN(ms), M = rad(357.529 + 0.98560028 * d); return norm(280.459 + 0.98564736 * d + 1.915 * Math.sin(M) + 0.02 * Math.sin(2 * M)); };
var moonLon = function (ms) { var d = dayN(ms), Ms = rad(357.529 + 0.98560028 * d), M = rad(134.963 + 13.064993 * d), F = rad(93.272 + 13.22935 * d), D = rad(297.85 + 12.190749 * d); return norm(218.316 + 13.176396 * d + 6.289 * Math.sin(M) + 1.274 * Math.sin(2 * D - M) + 0.658 * Math.sin(2 * D) - 0.186 * Math.sin(Ms) - 0.114 * Math.sin(2 * F)); };
var ayanOf = function (ms) { return 23.853 + 0.013969 * dayN(ms) / 365.25; };
var span = 360 / 27;
var nakAt = function (ms) { return Math.floor(norm(moonLon(ms) - ayanOf(ms)) / span); };
var sunNakAt = function (ms) { return Math.floor(norm(sunLon(ms) - ayanOf(ms)) / span); };
// ecliptic (tropical, of date) to equatorial
var eqOf = function (lam, bet) {
  var e = rad(23.4393), l = rad(lam), b = rad(bet);
  var dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  var ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
  return { ra: norm(deg(ra)), dec: deg(dec) };
};
var lst = function (ms) { return norm(280.46061837 + 360.98564736629 * dayN(ms) + LON); };
var altAz = function (ra, dec, ms) {
  var H = rad(norm(lst(ms) - ra)), p = rad(LAT), d = rad(dec);
  var alt = Math.asin(Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H));
  var az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(p) - Math.tan(d) * Math.cos(p));
  return { alt: deg(alt), az: norm(deg(az) + 180) };
};
// next rise, culmination and set of a fixed star after `ms`
var riseSet = function (ra, dec, ms) {
  var rate = 360.98564736629, toT = (norm(ra - lst(ms)) / rate) * 864e5, tr = ms + toT;
  var p = rad(LAT), d = rad(dec), c = (Math.sin(rad(-0.5667)) - Math.sin(p) * Math.sin(d)) / (Math.cos(p) * Math.cos(d));
  if (c <= -1 || c >= 1) return { transit: tr, rise: null, set: null, circumpolar: c <= -1 };
  var H0 = deg(Math.acos(c)) / rate * 864e5;
  var rise = tr - H0; if (rise < ms) rise += 864e5 / 1.0027379;
  return { transit: tr, rise: rise, set: tr + H0 };
};
var sunAlt = function (ms) { var q = eqOf(sunLon(ms), 0); return altAz(q.ra, q.dec, ms).alt; };
// the next times the Moon enters Nakshatra k (hour steps, then refined)
var moonVisits = function (k, ms, n) {
  var out = [], t = ms, prev = nakAt(t), lim = ms + 120 * 864e5;
  if (prev === k) { var s0 = t; while (nakAt(s0 - 36e5) === k) s0 -= 36e5; var e0 = t; while (nakAt(e0 + 36e5) === k) e0 += 36e5; out.push({ start: s0, end: e0 + 36e5, now: true }); }
  while (out.length < n && t < lim) {
    var t2 = t + 36e5, c = nakAt(t2);
    if (c === k && prev !== k) {
      var a = t, b = t2; for (var i = 0; i < 12; i++) { var m = (a + b) / 2; if (nakAt(m) === k) b = m; else a = m; }
      var e = b; while (nakAt(e + 36e5) === k) e += 36e5;
      out.push({ start: b, end: e + 36e5 });
    }
    prev = c; t = t2;
  }
  return out;
};
var sunVisit = function (k, ms) {
  var t = ms; if (sunNakAt(t) === k) { while (sunNakAt(t - 864e5) === k) t -= 864e5; var e = t; while (sunNakAt(e + 864e5) === k) e += 864e5; return { start: t, end: e + 864e5, now: true }; }
  for (var i = 0; i < 380; i++) { t += 864e5; if (sunNakAt(t) === k) { var e2 = t; while (sunNakAt(e2 + 864e5) === k) e2 += 864e5; return { start: t, end: e2 + 864e5, now: false }; } }
  return null;
};
var fmtIST = function (ms, withDay) {
  if (ms == null) return '';
  var o = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true };
  if (withDay) { o.weekday = 'short'; o.day = 'numeric'; o.month = 'short'; }
  return new Date(ms).toLocaleString('en-IN', o).replace(/\bam\b/i, 'am').replace(/\bpm\b/i, 'pm');
};
var fmtDate = function (ms) { var o = { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long' }; if (new Date(ms).getFullYear() !== new Date().getFullYear()) o.year = 'numeric'; return new Date(ms).toLocaleDateString('en-IN', o); };
var compass = function (az) { var N = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']; return N[Math.round(az / 45) % 8]; };
// ---- pañcāṅga and lagna ----
var sidSun = function (ms) { return norm(sunLon(ms) - ayanOf(ms)); };
var sidMoon = function (ms) { return norm(moonLon(ms) - ayanOf(ms)); };
var YOGA = ["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyana","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"];
var KARANA_MOV = ["Bava","Balava","Kaulava","Taitila","Gara","Vanija","Vishti"];
var karanaOf = function (elong) { var k = Math.floor(norm(elong) / 6); if (k === 0) return 'Kimstughna'; if (k >= 57) return ['Shakuni', 'Chatushpada', 'Naga'][k - 57]; return KARANA_MOV[(k - 1) % 7]; };
var yogaOf = function (ms) { return YOGA[Math.floor(norm(sidSun(ms) + sidMoon(ms)) / span)]; };
var sunrise = function (ms) {
  // the sunrise on the IST calendar day containing ms
  var ist0 = Math.floor((ms + 19800000) / 864e5) * 864e5 - 19800000, t = ist0 + 6.5 * 36e5;
  for (var i = 0; i < 3; i++) { var q = eqOf(sunLon(t), 0), p = rad(LAT), d = rad(q.dec), c = (Math.sin(rad(-0.833)) - Math.sin(p) * Math.sin(d)) / (Math.cos(p) * Math.cos(d)), H0 = deg(Math.acos(c)); var tr = ist0 + (norm(q.ra - lst(ist0)) / 360.98564736629) * 864e5; t = tr - H0 / 360.98564736629 * 864e5; if (t < ist0) t += 864e5 / 1.0027379; }
  return t;
};
var lagnaOf = function (ms) { var th = rad(lst(ms)), e = rad(23.4393), p = rad(LAT); var asc = norm(deg(Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(e) + Math.tan(p) * Math.sin(e))))); return norm(asc - ayanOf(ms)); };
// ---- the Sun's place, its setting, and the dark of the Moon ----
var sunAltAz = function (ms) { var q = eqOf(sunLon(ms), 0); return altAz(q.ra, q.dec, ms); };
var sunset = function (ms) { var r0 = sunrise(ms); var q = eqOf(sunLon(r0 + 6 * 36e5), 0), p = rad(LAT), d = rad(q.dec), c = (Math.sin(rad(-0.833)) - Math.sin(p) * Math.sin(d)) / (Math.cos(p) * Math.cos(d)), H0 = deg(Math.acos(c)) / 360.98564736629 * 864e5; return r0 + 2 * H0; };
var nextNewMoon = function (ms) { var t = ms, prev = norm(moonLon(t) - sunLon(t)); for (var i = 0; i < 24 * 32; i++) { t += 36e5; var e = norm(moonLon(t) - sunLon(t)); if (e < prev) return t; prev = e; } return null; };
// ---- the month: full moon, saṅkrānti, tithis, phases ----
var elongAt = function (ms) { return norm(moonLon(ms) - sunLon(ms)); };
var nextFullMoon = function (ms) { var t = ms, prev = elongAt(t); for (var i = 0; i < 24 * 32; i++) { t += 36e5; var e = elongAt(t); if (prev < 180 && e >= 180) return t; prev = e; } return null; };
var nextSankranti = function (ms) { var t = ms, s0 = Math.floor(sidSun(t) / 30); for (var i = 0; i < 24 * 33; i++) { t += 36e5; var s1 = Math.floor(sidSun(t) / 30); if (s1 !== s0) { var a = t - 36e5, b = t; for (var j = 0; j < 10; j++) { var m = (a + b) / 2; if (Math.floor(sidSun(m) / 30) === s0) a = m; else b = m; } return { t: b, sign: s1 }; } } return null; };
var tithiIdx = function (ms) { return Math.floor(elongAt(ms) / 12); };
var phasePath = function (el) { var illum = (1 - Math.cos(rad(el))) * 50, wax = norm(el) < 180, rx = Math.abs(60 * Math.cos(rad(el))).toFixed(2), gib = illum > 50; return 'M64 4 A60 60 0 0 ' + (wax ? 1 : 0) + ' 64 124 A' + rx + ' 60 0 0 ' + (wax ? (gib ? 1 : 0) : (gib ? 0 : 1)) + ' 64 4 Z'; };
var istParts = function (ms) { var d = new Date(ms + 19800000); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay() }; };
var istMidnight = function (y, m, d) { return Date.UTC(y, m, d) - 19800000; };

export { rad, deg, norm, dayN, sunLon, moonLon, ayanOf, nakAt, sunNakAt, eqOf, lst, altAz, riseSet, sunAlt, moonVisits, sunVisit, fmtIST, fmtDate, compass, sidSun, sidMoon, karanaOf, yogaOf, sunrise, lagnaOf, sunAltAz, sunset, nextNewMoon, elongAt, nextFullMoon, nextSankranti, tithiIdx, phasePath, istParts, istMidnight, LAT, LON, span, YOGA, KARANA_MOV };
