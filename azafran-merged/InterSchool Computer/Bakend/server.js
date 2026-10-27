// AZAFRAN backend. Plain Node.js, no packages to install.
//   node server.js        then open http://localhost:3000
// Serves the Website folder and the /api routes (accounts, bookings, forms).
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data.json");
const SEED_FILE = path.join(__dirname, "data.json");
const SITE_DIR = path.join(__dirname, "..", "Website");
const ADMIN_KEY = process.env.ADMIN_KEY || ""; // empty = admin route is switched off
const SESSION_DAYS = 14;

// ---------- data ----------
let db;
function load() {
  const file = fs.existsSync(DATA_FILE) ? DATA_FILE : SEED_FILE;
  db = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const k of ["users", "sessions", "bookings", "hostApplications", "signups", "newsletter"]) db[k] = db[k] || [];
  db.fee = db.fee || 0.15;
}
function save() {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
load();

// ---------- helpers ----------
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png",
  ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
};
function send(res, status, obj, headers) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({ "Content-Type": "application/json", "Cache-Control": "no-store" }, headers || {}));
  res.end(body);
}
const fail = (res, status, msg) => send(res, status, { error: msg });
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > 100000) { reject(new Error("big")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { const v = JSON.parse(Buffer.concat(chunks).toString("utf8")); resolve(v && typeof v === "object" ? v : {}); }
      catch (e) { reject(new Error("bad json")); }
    });
    req.on("error", reject);
  });
}
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
function cookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((p) => { const i = p.indexOf("="); if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  return out;
}
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return salt.toString("hex") + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
}
function checkPassword(pw, stored) {
  const [saltHex, hashHex] = String(stored).split(":");
  const want = Buffer.from(hashHex, "hex");
  const got = crypto.scryptSync(pw, Buffer.from(saltHex, "hex"), 64);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}
function currentUser(req) {
  const token = cookies(req).sid;
  if (!token) return null;
  const now = Date.now();
  const s = db.sessions.find((x) => x.token === token && x.expires > now);
  return s ? db.users.find((u) => u.id === s.userId) || null : null;
}
function startSession(res, user, status, extra) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  db.sessions = db.sessions.filter((s) => s.expires > now).slice(-500);
  db.sessions.push({ token, userId: user.id, expires: now + SESSION_DAYS * 86400000 });
  save();
  const cookie = "sid=" + token + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=" + SESSION_DAYS * 86400;
  send(res, status, Object.assign({ user: { username: user.username } }, extra || {}), { "Set-Cookie": cookie });
}
const round2 = (n) => Math.round(n * 100) / 100;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------- API ----------
async function api(req, res, url) {
  const route = req.method + " " + url.pathname;
  if (req.method === "POST") {
    const type = req.headers["content-type"] || "";
    if (!type.includes("application/json")) return fail(res, 415, "Send JSON.");
  }
  let body = {};
  if (req.method === "POST") {
    try { body = await readBody(req); } catch (e) { return fail(res, 400, "That request could not be read."); }
  }
  const user = currentUser(req);

  switch (route) {
    case "GET /api/experiences":
      return send(res, 200, { items: db.experiences, fee: db.fee });

    case "GET /api/me":
      return send(res, 200, { user: user ? { username: user.username } : null });

    case "POST /api/signup": {
      const username = clean(body.username, 20), password = String(body.password || "");
      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return fail(res, 400, "Username: 3 to 20 letters, numbers or underscores.");
      if (password.length < 8 || password.length > 128) return fail(res, 400, "Password must be 8 to 128 characters.");
      if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) return fail(res, 409, "That username is taken.");
      const u = { id: crypto.randomUUID(), username, password: hashPassword(password), created: new Date().toISOString() };
      db.users.push(u);
      return startSession(res, u, 201);
    }
    case "POST /api/login": {
      const username = clean(body.username, 20), password = String(body.password || "").slice(0, 128);
      const u = db.users.find((x) => x.username.toLowerCase() === username.toLowerCase());
      const ok = u ? checkPassword(password, u.password) : (hashPassword(password), false); // same work either way
      if (!ok) return fail(res, 401, "Wrong username or password.");
      return startSession(res, u, 200);
    }
    case "POST /api/logout": {
      const token = cookies(req).sid;
      db.sessions = db.sessions.filter((s) => s.token !== token);
      save();
      return send(res, 200, { ok: true }, { "Set-Cookie": "sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" });
    }
    case "POST /api/bookings": {
      if (!user) return fail(res, 401, "Please log in to book.");
      const exp = db.experiences.find((e) => e.id === Number(body.experience_id));
      if (!exp) return fail(res, 400, "That experience does not exist.");
      const date = clean(body.date, 10), guests = Number(body.guests);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date + "T00:00:00Z"))) return fail(res, 400, "Choose a valid date.");
      const today = new Date().toLocaleDateString("en-CA");
      if (date < today) return fail(res, 400, "Choose a date from today onwards.");
      if (!Number.isInteger(guests) || guests < 1 || guests > 10) return fail(res, 400, "Guests must be between 1 and 10.");
      const total = exp.price * guests, fee = round2(total * db.fee);
      const b = {
        id: db.bookings.length + 1, userId: user.id, experience_id: exp.id, title: exp.title, city: exp.city,
        date, guests, total, fee, host_gets: round2(total - fee), currency: exp.currency, created: new Date().toISOString(),
      };
      db.bookings.push(b);
      save();
      return send(res, 201, { id: b.id, experience: exp.title, date, guests, total, fee, host_gets: b.host_gets, currency: exp.currency });
    }
    case "GET /api/my/bookings": {
      if (!user) return fail(res, 401, "Please log in.");
      const mine = db.bookings.filter((b) => b.userId === user.id).reverse()
        .map((b) => ({ id: b.id, title: b.title, city: b.city, date: b.date, guests: b.guests, total: b.total, currency: b.currency }));
      return send(res, 200, { bookings: mine });
    }
    case "POST /api/hosts": {
      const name = clean(body.name, 80), city = clean(body.city, 80), offer = clean(body.offer, 300);
      if (!name || !city || !offer) return fail(res, 400, "Please fill in every field.");
      db.hostApplications.push({ name, city, offer, created: new Date().toISOString() });
      save();
      return send(res, 201, { ok: true });
    }
    case "POST /api/signups": {
      const name = clean(body.name, 80), email = clean(body.email, 120);
      const role = ["visitor", "maker", "entrepreneur", "press"].includes(body.role) ? body.role : "visitor";
      const city = ["Jaipur", "Sevilla", "Online"].includes(body.city) ? body.city : "Online";
      if (!name || !EMAIL.test(email)) return fail(res, 400, "Name and a valid email are needed.");
      db.signups.push({ name, email, role, city, created: new Date().toISOString() });
      save();
      return send(res, 201, { ok: true });
    }
    case "POST /api/newsletter": {
      const email = clean(body.email, 120);
      if (!EMAIL.test(email)) return fail(res, 400, "Enter a valid email.");
      if (!db.newsletter.some((n) => n.email.toLowerCase() === email.toLowerCase())) db.newsletter.push({ email, created: new Date().toISOString() });
      save();
      return send(res, 201, { ok: true });
    }
    case "GET /api/admin/summary": {
      const key = String(req.headers["x-admin-key"] || "");
      const a = Buffer.from(key), b = Buffer.from(ADMIN_KEY);
      if (!ADMIN_KEY || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return fail(res, 403, "Admin key needed.");
      const revenue = {};
      db.bookings.forEach((x) => { revenue[x.currency] = round2((revenue[x.currency] || 0) + x.fee); });
      return send(res, 200, {
        users: db.users.length, bookings: db.bookings.length, hostApplications: db.hostApplications.length,
        festivalSignups: db.signups.length, newsletter: db.newsletter.length, platformFeeEarned: revenue,
      });
    }
  }
  return fail(res, 404, "Not found.");
}

// ---------- static files ----------
function serveStatic(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(SITE_DIR, rel));
  if (file !== SITE_DIR && !file.startsWith(SITE_DIR + path.sep)) { res.writeHead(404); return res.end("Not found"); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    const headers = { "Content-Type": type, "Content-Length": st.size, "Cache-Control": rel.startsWith("/assets/") ? "public, max-age=3600" : "no-cache" };
    // Let the soundtrack seek (browsers ask for byte ranges on audio).
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (range && st.size) {
      let start = range[1] === "" ? Math.max(0, st.size - Number(range[2])) : Number(range[1]);
      let end = range[1] !== "" && range[2] !== "" ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, { "Content-Range": "bytes */" + st.size }); return res.end(); }
      res.writeHead(206, Object.assign(headers, { "Content-Range": "bytes " + start + "-" + end + "/" + st.size, "Content-Length": end - start + 1, "Accept-Ranges": "bytes" }));
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, Object.assign(headers, { "Accept-Ranges": "bytes" }));
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer((req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    api(req, res, url).catch((e) => { console.error(e); if (!res.headersSent) fail(res, 500, "Server error."); });
  } else serveStatic(req, res, url);
}).listen(PORT, () => console.log("AZAFRAN running at http://localhost:" + PORT));
