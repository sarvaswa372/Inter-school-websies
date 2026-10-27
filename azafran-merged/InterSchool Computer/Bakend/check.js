// Self-test for the backend. Run it with:  node check.js
// Starts the server on a spare port with a temporary data file, tries the main features, then stops.
const { spawn } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");

const PORT = 3999;
const DATA = path.join(os.tmpdir(), "azafran-check-" + Date.now() + ".json");
const B = "http://127.0.0.1:" + PORT;
const JSON_HEADER = { "Content-Type": "application/json" };
let passed = 0, failed = 0;

function check(name, ok) { console.log((ok ? "PASS  " : "FAIL  ") + name); ok ? passed++ : failed++; }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(url, opt = {}) {
  const r = await fetch(B + url, { redirect: "manual", ...opt });
  let json = null;
  try { json = await r.clone().json(); } catch {}
  return { status: r.status, json, res: r };
}
const post = (url, body, cookie, extra) =>
  call(url, { method: "POST", headers: { ...JSON_HEADER, ...(cookie ? { Cookie: cookie } : {}), ...(extra || {}) }, body: JSON.stringify(body) });

async function main() {
  console.log("Testing with Node " + process.version + "\n");
  const server = spawn(process.execPath, [path.join(__dirname, "server.js")], {
    env: { ...process.env, PORT: String(PORT), DATA_FILE: DATA, ADMIN_KEY: "test-key" }, stdio: "ignore",
  });
  try {
    for (let i = 0; i < 50; i++) { try { await fetch(B + "/api/experiences"); break; } catch { await wait(100); } }
    for (const p of ["index", "market", "credits", "experiences", "login", "register", "bookings"]) {
      check("page " + p + ".html loads", (await call("/" + p + ".html")).status === 200);
    }
    check("/ shows the home page", (await call("/")).status === 200);
    check("server code is not downloadable", (await call("/server.js")).status === 404);
    check("folder escape is blocked", (await call("/..%2FBakend%2Fdata.json")).status === 404);
    check("8 experiences load", (await call("/api/experiences")).json.items.length === 8);
    check("not logged in at the start", (await call("/api/me")).json.user === null);

    const date = new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-CA");
    check("booking needs login", (await post("/api/bookings", { experience_id: 1, date, guests: 2 })).status === 401);
    check("short password is refused", (await post("/api/signup", { username: "asha_1", password: "short" })).status === 400);

    const s = await post("/api/signup", { username: "asha_1", password: "correct horse 9" });
    check("sign up works", s.status === 201);
    const cookie = (s.res.headers.getSetCookie()[0] || "").split(";")[0];
    check("login cookie is HttpOnly", /HttpOnly/i.test(s.res.headers.getSetCookie()[0] || ""));
    check("same username is refused", (await post("/api/signup", { username: "ASHA_1", password: "another pass 1" })).status === 409);
    check("me shows the user", (await call("/api/me", { headers: { Cookie: cookie } })).json.user.username === "asha_1");

    const b = await post("/api/bookings", { experience_id: 1, date, guests: 2 }, cookie);
    check("booking works (2 x 35 = 70, fee 10.5, host 59.5)", b.status === 201 && b.json.total === 70 && b.json.fee === 10.5 && b.json.host_gets === 59.5);
    check("past date is refused", (await post("/api/bookings", { experience_id: 1, date: "2020-01-01", guests: 2 }, cookie)).status === 400);
    check("11 guests is refused", (await post("/api/bookings", { experience_id: 1, date, guests: 11 }, cookie)).status === 400);
    check("My bookings shows 1 booking", (await call("/api/my/bookings", { headers: { Cookie: cookie } })).json.bookings.length === 1);
    check("form without JSON is refused", (await call("/api/hosts", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "x" })).status === 415);
    check("host application works", (await post("/api/hosts", { name: "A", city: "B", offer: "C" })).status === 201);
    check("festival signup works", (await post("/api/signups", { name: "Lucia", email: "l@example.com", role: "maker", city: "Sevilla" })).status === 201);
    check("bad email is refused", (await post("/api/newsletter", { email: "nope" })).status === 400);
    check("newsletter works", (await post("/api/newsletter", { email: "n@example.com" })).status === 201);

    await post("/api/logout", {}, cookie);
    check("log out works", (await call("/api/me", { headers: { Cookie: cookie } })).json.user === null);
    check("wrong password is refused", (await post("/api/login", { username: "asha_1", password: "wrong wrong 1" })).status === 401);
    check("log in works", (await post("/api/login", { username: "asha_1", password: "correct horse 9" })).status === 200);
    check("admin needs the key", (await call("/api/admin/summary")).status === 403);
    const adm = await call("/api/admin/summary", { headers: { "x-admin-key": "test-key" } });
    check("admin summary works with the key", adm.status === 200 && adm.json.bookings === 1 && adm.json.users === 1);
  } finally {
    server.kill();
    fs.rmSync(DATA, { force: true });
  }
  console.log("\n" + passed + " passed, " + failed + " failed");
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
