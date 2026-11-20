# Eder Tattoos Agent — Open Agentic Web Challenge

Agentic booking website for **Eder Tattoos, Puebla** — built for the
[Open Agentic Web Challenge](https://cognizant-agenticweb.devpost.com/) on Devpost.
Deadline: **11 January 2027, 16:00 UTC (10:00 AM Puebla)**.
Prizes: 1st $5,000 · 2nd $3,000 · 3rd $2,000 (plus Mozilla Otari credits).

One service, real prices only — nothing invented:

| Service | Price | Deposit to book |
| --- | --- | --- |
| Small tattoo, up to 5 cm — fine line, letters, dates, symbols | $1,000 MXN | $200 MXN |

Contact: WhatsApp **2211447752** → https://wa.me/522211447752
No online payment is collected. Confirming a booking only prepares the
WhatsApp message; Eder confirms the date on WhatsApp. A tattoo bigger than
5 cm has no price here — the agent says so and gives the WhatsApp link.

## What is in this folder

- `index.html` — the site (Spanish, with small English labels for judges):
  catalog, booking form, price summary ($1,000 total / $200 deposit /
  $800 rest), WhatsApp link that activates when the booking is complete.
- `script.js` — the page logic and the only place business rules live
  (`App.page`): catalog, validation (size 1–5 cm, date today or later),
  price, WhatsApp message builder. The form and the agent both call it.
- `eder_tattoos_booking.hocon` — source of truth for the agent network.
- `eder_tattoos_booking.network.json` — the published network, built from the
  HOCON with the official build script (do not edit by hand; edit the HOCON
  and rebuild).
- `agent-manifest.json`, `links.json`, `agent-mcp.json`, `.well-known/` —
  public agent bundle (built by the same script).
- `bridge/` — action bridge the build writes (other agent sites load it).
- `site-actions.js` — the 4 tools the agents can call on this page:
  `website_get_tattoo_state` (read), `website_fill_booking` (write),
  `website_confirm_booking` (irreversible — browser asks first),
  `website_clear_booking` (write).
- `site.js` — mounts the "Ask Eder" chat panel + the confirmation dialog.
- `runtime/` — the official skill runtime (patched nsdeploy copy), **unchanged**.
  It runs the network in the visitor's browser.
- `demo-agent.js` — labelled local demo (rule-based, no AI) so the booking
  flow can be tried without a key. It is NOT the hackathon agent.
- `tests/booking-logic.mjs` — Node test for the page logic (14 checks).

### The agent network (3 agents)

- `eder_assistant` (front) — greets, delegates, answers in Spanish/English.
- `catalog_specialist` — price, styles, 5 cm limit, WhatsApp contact.
- `booking_specialist` — fills the form, confirms bookings, returns the
  WhatsApp link. Every agent also gets the 4 `website_*` tools plus
  `render_cruse` from the runtime. No partner sites are called.

## Run it locally

Needs Node.js 22+ for the build script; any Python 3 for the simple server.

```sh
# from this folder — serves with the CORS header the public agent files need
node /tmp/agentic-web/skills/agentify-website/scripts/serve_site.mjs . --port 8080
# open http://127.0.0.1:8080/
```

`python3 -m http.server` also works for one site, but it sends no CORS
header, so other agent sites could not call this one.

## Test it

### 1. Without a key (no AI, no cost)

- Open the site, scroll to **"Probar sin llave (demo local, sin IA)"** and
  press the 3 demo buttons. They fill the form and build the WhatsApp link
  using the same page functions as the real agent.
- Or run the logic test: `node tests/booking-logic.mjs` (14 checks: price,
  fill, size-6 refusal, stale-version refusal, confirm + WhatsApp link,
  past-date refusal, action registry).

### 2. With a key (the real agent)

1. Open the site, expand **⚙ AI model settings** in the chat panel.
2. Paste your own key (hosted Otari first, or **Connect with OpenRouter**)
   and **Save and start**. The key stays in your browser; the site never
   sees it and pays nothing. Use a key with a low spending limit, and delete
   the saved setup afterwards.
3. Try these 3 prompts (the same ones in the network's `sample_queries`):
   - `¿Cuánto cuesta un tatuaje pequeño y qué estilos hacen?`
   - `Llena mi reserva: quiero un tatuaje de letras de 4 cm en la muñeca, con la fecha 12-05-2020, para el 20 de enero de 2027. Me llamo Ana.`
   - `Confirma mi reserva.` — the browser asks you to confirm first, then
     the agent returns the WhatsApp link. Nothing is charged.
   - Decline check: `¿Puedes hacerme un tatuaje de 10 cm por $1,000?` —
     the agent must say no and give the WhatsApp link.

Without a key the chat shows: "Assistant needs your AI provider key. Add it
in AI model settings below." The page still works fully without the agent.

## Deploy (free)

Any static host works. GitHub Pages is the simplest:

1. Push this folder to a public GitHub repo (the project is open source).
2. Settings → Pages → deploy from the `main` branch (root of this folder).
3. Your URL will be `https://<user>.github.io/<repo>/`.

Hosting rules from the spec (see the skill's `references/bundle_and_hosting.md`):
serve `agent-manifest.json`, `eder_tattoos_booking.network.json`,
`links.json`, `agent-mcp.json` and the two `.well-known` files with
`Access-Control-Allow-Origin: *` (GitHub Pages already sends this).
Serve `runtime/sandbox-worker.js` with the CSP from that doc. Do not send
`X-Frame-Options` / `frame-ancestors` on `bridge/`.

## Submission checklist (Devpost)

From https://cognizant-agenticweb.devpost.com/ — do this on Devpost,
nothing here submits anything:

- [ ] Register for the hackathon on Devpost (free) + create a Devpost account.
- [ ] Read the minimum viable spec in the
      [official repo](https://github.com/cognizant-ai-labs/agentic-web)
      (`docs/worldwide_agentic_web_mvp_spec.md`).
- [ ] Public URL of this site, containing the conforming `.json` network file,
      the `runtime` file, and the chat interface — done in this folder.
- [ ] Text description of the project on Devpost.
- [ ] Video, under 2 minutes, showing the project running in a browser, with
      **you (Eder) explaining it yourself, not AI-generated** — upload it
      public on YouTube and paste the link.
- [ ] Screenshots of the website.
- [ ] If you use Mozilla Otari: your Otari account email + one or two
      sentences on a problem you had with Otari and how it could improve.
- [ ] Submit on Devpost before **11 January 2027, 16:00 UTC**.

## Verified here (18 Nov 2026)

- Official build: `build_network.mjs … --check` — exit 0, no warnings.
  3 agents, front `eder_assistant`, runtime adds
  `website_get_tattoo_state, website_fill_booking, website_confirm_booking,
  website_clear_booking, render_cruse` to every agent.
- `node tests/booking-logic.mjs` — 14/14 checks pass.
- Served locally: `index.html`, `agent-manifest.json`,
  `eder_tattoos_booking.network.json`, `links.json`, `agent-mcp.json`,
  `.well-known/nsdeploy.json`, `runtime/index.js`, `site.js`,
  `site-actions.js`, `script.js`, `demo-agent.js`,
  `bridge/action-bridge.html` — all HTTP 200; public agent files carry
  `Access-Control-Allow-Origin: *`. All JS files pass syntax check; the
  relative-import graph has no missing files.
- Example WhatsApp link produced:
  `https://wa.me/522211447752?text=Hola Eder Tattoos, quiero apartar un
  tatuaje pequeño (hasta 5 cm) de $1,000 MXN…` (full text in the test output).

## Not verified here — needs a browser

- The chat panel actually rendering and the no-key status message in a real
  browser (no headless browser was available in this VM). Open the served
  site in Chrome/Firefox and check the assistant section loads.
- A live run with a real LLM key (needs Eder's own key; never paste it in chat).

## Limits (honest)

- Static site only; the runtime is the skill's patched copy of nsdeploy, not
  nsdeploy itself. Bookings live only in the page — no server, no database.
- The network file, including its instructions, is public by design.
- The demo box is rule-based and labelled; it is not the LLM agent.
- Winning is not guaranteed: the prize goes to the best projects, judged on
  implementation, design, impact and idea quality.
