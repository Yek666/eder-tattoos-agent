// Eder Tattoos — page logic. One source of truth for the site's business rules.
// The agent (site-actions.js) and the manual form both call App.page, so the
// assistant and the page share exactly the same prices, limits and WhatsApp link.
//
// Business facts (do not change without Eder):
//   - One service: small tattoo, up to 5 cm, $1,000 MXN.
//   - Styles: fine line, letters, dates, symbols.
//   - Deposit to book: $200 MXN. No online payment is collected here.
//   - Contact: WhatsApp 2211447752 (wa.me/522211447752).
//   - Bookings are NOT stored as real: confirming builds a WhatsApp message with
//     the details. Eder confirms the date on WhatsApp. No payment, no email.

export const TATTOO = {
  id: "tatuaje-pequeno",
  name: "Tatuaje pequeño — hasta 5 cm",
  nameEn: "Small tattoo — up to 5 cm",
  priceMXN: 1000,
  depositMXN: 200,
  currency: "MXN",
  maxSizeCm: 5,
  minSizeCm: 1,
  styles: [
    { id: "linea-fina", name: "Línea fina", nameEn: "Fine line" },
    { id: "letras", name: "Letras", nameEn: "Letters" },
    { id: "fechas", name: "Fechas", nameEn: "Dates" },
    { id: "simbolos", name: "Símbolos", nameEn: "Symbols" },
  ],
  city: "Puebla, México",
  whatsappNumber: "2211447752",
  whatsappUrlBase: "https://wa.me/522211447752",
};

export function formatMXN(amount) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

export function styleName(styleId) {
  const s = TATTOO.styles.find((x) => x.id === styleId);
  return s ? s.name : styleId;
}

/** Price is fixed: one small tattoo is $1,000, deposit $200. Nothing else to add. */
export function computePrice() {
  return { totalMXN: TATTOO.priceMXN, depositMXN: TATTOO.depositMXN, restMXN: TATTOO.priceMXN - TATTOO.depositMXN };
}

/** Validate a booking draft. Returns {ok, reason, field} — never throws for bad input. */
export function validateBooking(draft, todayStr) {
  const d = draft || {};
  if (!d.idea || String(d.idea).trim().length < 3) {
    return { ok: false, reason: "Falta la idea del tatuaje: describe en unas palabras qué quieres (mínimo 3 caracteres).", field: "idea" };
  }
  if (!TATTOO.styles.some((s) => s.id === d.style)) {
    return { ok: false, reason: "Elige un estilo: línea fina, letras, fechas o símbolos.", field: "style" };
  }
  const size = Number(d.sizeCm);
  if (!Number.isFinite(size) || size < TATTOO.minSizeCm || size > TATTOO.maxSizeCm) {
    return {
      ok: false,
      reason: `El tamaño debe ser entre ${TATTOO.minSizeCm} y ${TATTOO.maxSizeCm} cm. Este servicio es solo tatuaje pequeño de hasta 5 cm por $1,000; para uno más grande escríbele directo a Eder por WhatsApp, no hay otro precio publicado aquí.`,
      field: "sizeCm",
    };
  }
  if (!d.placement || String(d.placement).trim().length < 2) {
    return { ok: false, reason: "Falta la zona del cuerpo (por ejemplo: muñeca, antebrazo, tobillo).", field: "placement" };
  }
  if (!d.preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(d.preferredDate)) {
    return { ok: false, reason: "Falta la fecha preferida (AAAA-MM-DD).", field: "preferredDate" };
  }
  const today = todayStr || new Date().toISOString().slice(0, 10);
  if (d.preferredDate < today) {
    return { ok: false, reason: "La fecha preferida ya pasó. Elige hoy o una fecha futura.", field: "preferredDate" };
  }
  if (!d.name || String(d.name).trim().length < 2) {
    return { ok: false, reason: "Falta tu nombre para la reserva.", field: "name" };
  }
  return { ok: true };
}

/** Build the WhatsApp message + link for a valid draft. No message is sent by this site. */
export function buildWhatsApp(draft) {
  const price = computePrice();
  const lines = [
    "Hola Eder Tattoos, quiero apartar un tatuaje pequeño (hasta 5 cm) de $1,000 MXN.",
    `Idea: ${draft.idea}`,
    `Estilo: ${styleName(draft.style)}`,
    `Tamaño: ${draft.sizeCm} cm`,
    `Zona: ${draft.placement}`,
    `Fecha preferida: ${draft.preferredDate}`,
    `Nombre: ${draft.name}`,
    `Total: ${formatMXN(price.totalMXN)} — Anticipo para apartar: ${formatMXN(price.depositMXN)}.`,
  ];
  const text = lines.join("\n");
  return { text, url: `${TATTOO.whatsappUrlBase}?text=${encodeURIComponent(text)}` };
}

function makeReference() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replaceAll("-", "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ET-${ymd}-${rand}`;
}

export class TattooPage {
  constructor() {
    this.version = 0;
    this.draft = { idea: "", style: "", sizeCm: "", placement: "", preferredDate: "", name: "" };
    this.confirmed = null; // last confirmed booking receipt, local only
  }

  todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  catalogIds() {
    return [TATTOO.id];
  }

  styleIds() {
    return TATTOO.styles.map((s) => s.id);
  }

  getState() {
    const price = computePrice();
    return {
      ok: true,
      site: "Eder Tattoos",
      city: TATTOO.city,
      today: this.todayStr(),
      catalog: [
        {
          id: TATTOO.id,
          name: TATTOO.name,
          nameEn: TATTOO.nameEn,
          priceMXN: price.totalMXN,
          depositMXN: price.depositMXN,
          maxSizeCm: TATTOO.maxSizeCm,
          styles: TATTOO.styles.map((s) => ({ id: s.id, name: s.name })),
        },
      ],
      price: { totalMXN: price.totalMXN, depositMXN: price.depositMXN, restMXN: price.restMXN },
      whatsapp: TATTOO.whatsappUrlBase,
      whatsappNumber: TATTOO.whatsappNumber,
      bookingDraft: { ...this.draft },
      version: this.version,
      confirmedBooking: this.confirmed,
      cannotDo: [
        "No se cobra en línea: no hay pago con tarjeta ni transferencia en esta página.",
        "No hay otros precios: solo el tatuaje pequeño de hasta 5 cm por $1,000 con anticipo de $200.",
        "No se guarda una cita real: confirmar solo prepara el mensaje de WhatsApp; Eder confirma la fecha por WhatsApp.",
        "No se hacen tatuajes de más de 5 cm a este precio.",
      ],
    };
  }

  /** Fill (or update) the visible booking draft. Reversible: the visitor can edit or clear it. */
  fillBooking(args) {
    const next = { ...this.draft };
    for (const key of ["idea", "style", "sizeCm", "placement", "preferredDate", "name"]) {
      if (args[key] !== undefined && args[key] !== null && args[key] !== "") next[key] = args[key];
    }
    // Validate the merged draft so a partial fill cannot leave a silently invalid state.
    const partial = { ...next };
    // Only enforce the fields the caller actually set plus what is already filled;
    // a partial draft is fine as long as each set value is valid on its own.
    if (partial.style && !TATTOO.styles.some((s) => s.id === partial.style)) {
      return { ok: false, reason: "Elige un estilo: línea fina, letras, fechas o símbolos.", field: "style" };
    }
    if (partial.sizeCm !== "" && partial.sizeCm !== undefined) {
      const size = Number(partial.sizeCm);
      if (!Number.isFinite(size) || size < TATTOO.minSizeCm || size > TATTOO.maxSizeCm) {
        return { ok: false, reason: `El tamaño debe ser entre ${TATTOO.minSizeCm} y ${TATTOO.maxSizeCm} cm. Este servicio es solo tatuaje pequeño de hasta 5 cm por $1,000.`, field: "sizeCm" };
      }
    }
    if (partial.preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(partial.preferredDate)) {
      return { ok: false, reason: "La fecha preferida debe ser AAAA-MM-DD.", field: "preferredDate" };
    }
    if (partial.preferredDate && partial.preferredDate < this.todayStr()) {
      return { ok: false, reason: "La fecha preferida ya pasó. Elige hoy o una fecha futura.", field: "preferredDate" };
    }
    this.draft = next;
    this.version += 1;
    this.render();
    return { ok: true, ...this.getState() };
  }

  clearBooking() {
    this.draft = { idea: "", style: "", sizeCm: "", placement: "", preferredDate: "", name: "" };
    this.confirmed = null;
    this.version += 1;
    this.render();
    return { ok: true, ...this.getState() };
  }

  /** Read-only check the assistant's confirmation dialog uses before confirming. */
  checkConfirm(args) {
    const check = validateBooking(this.draft, this.todayStr());
    if (!check.ok) return check;
    if (args.expectedVersion !== this.version) {
      return { ok: false, reason: "La reserva cambió desde que se revisó. Vuelve a revisar los datos antes de confirmar.", field: "expectedVersion" };
    }
    const wa = buildWhatsApp(this.draft);
    return { ok: true, ...this.getState(), whatsappUrl: wa.url, whatsappText: wa.text };
  }

  /** Confirm the booking: irreversible in the sense that the visitor has agreed to
   *  send the WhatsApp request. Nothing is charged and nothing is stored server-side;
   *  the receipt is local and the visitor must still send the WhatsApp message. */
  confirmBooking(args) {
    const check = this.checkConfirm(args);
    if (!check.ok) return check;
    const wa = buildWhatsApp(this.draft);
    const receipt = {
      reference: makeReference(),
      service: TATTOO.id,
      ...this.draft,
      price: computePrice(),
      whatsappUrl: wa.url,
      whatsappText: wa.text,
      status: "prepared — send it on WhatsApp; Eder confirms the date there",
    };
    this.confirmed = receipt;
    this.version += 1;
    this.render();
    return { ok: true, receipt, ...this.getState() };
  }

  // ---- Manual UI wiring (browser only) ----
  render() {
    if (typeof document === "undefined") return;
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = value ?? "";
    };
    set("idea", this.draft.idea);
    set("style", this.draft.style);
    set("size", this.draft.sizeCm);
    set("placement", this.draft.placement);
    set("date", this.draft.preferredDate);
    set("name", this.draft.name);
    const price = computePrice();
    const summary = document.getElementById("price-summary");
    if (summary) {
      summary.textContent = `Total: ${formatMXN(price.totalMXN)} · Anticipo para apartar: ${formatMXN(price.depositMXN)} · Resto el día de la cita: ${formatMXN(price.restMXN)}`;
    }
    const link = document.getElementById("whatsapp-link");
    if (link) {
      const check = validateBooking(this.draft, this.todayStr());
      if (check.ok) {
        const wa = buildWhatsApp(this.draft);
        link.href = wa.url;
        link.classList.remove("disabled");
        link.setAttribute("aria-disabled", "false");
      } else {
        link.href = TATTOO.whatsappUrlBase;
        link.classList.add("disabled");
        link.setAttribute("aria-disabled", "true");
      }
    }
    const conf = document.getElementById("confirmed-box");
    if (conf) {
      if (this.confirmed) {
        conf.hidden = false;
        conf.innerHTML = "";
        const p = document.createElement("p");
        p.textContent = `Reserva preparada · Referencia local ${this.confirmed.reference}. No se cobró nada. Manda el mensaje por WhatsApp para que Eder te confirme la fecha.`;
        const a = document.createElement("a");
        a.href = this.confirmed.whatsappUrl;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "Abrir WhatsApp con mi reserva";
        conf.append(p, a);
      } else {
        conf.hidden = true;
        conf.innerHTML = "";
      }
    }
  }

  readForm() {
    if (typeof document === "undefined") return { ...this.draft };
    const v = (id) => document.getElementById(id)?.value ?? "";
    return {
      idea: v("idea").trim(),
      style: v("style"),
      sizeCm: v("size") === "" ? "" : Number(v("size")),
      placement: v("placement").trim(),
      preferredDate: v("date"),
      name: v("name").trim(),
    };
  }

  wireForm() {
    if (typeof document === "undefined") return;
    const form = document.getElementById("booking-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const result = this.fillBooking(this.readForm());
      const msg = document.getElementById("form-message");
      if (msg) {
        msg.textContent = result.ok
          ? "Datos guardados en tu reserva. Revisa el resumen y confirma abajo."
          : result.reason;
      }
      this.render();
    });
    document.getElementById("clear-booking")?.addEventListener("click", () => {
      this.clearBooking();
      const msg = document.getElementById("form-message");
      if (msg) msg.textContent = "Reserva limpiada.";
    });
    document.getElementById("confirm-booking")?.addEventListener("click", () => {
      const check = this.checkConfirm({ expectedVersion: this.version });
      const msg = document.getElementById("form-message");
      if (!check.ok) {
        if (msg) msg.textContent = check.reason;
        return;
      }
      if (!window.confirm(`¿Confirmar esta reserva?\n\n${check.whatsappText}\n\nNo se cobra nada aquí. Se abrirá WhatsApp para que mandes el mensaje y Eder te confirme la fecha.`)) return;
      const result = this.confirmBooking({ expectedVersion: this.version });
      if (msg) msg.textContent = result.ok ? `Reserva preparada (${result.receipt.reference}). Mándala por WhatsApp.` : result.reason;
    });
    // Keep the price summary live while typing.
    form.addEventListener("input", () => this.render());
    this.render();
  }
}

export class App {
  static page = new TattooPage();
}

if (typeof document !== "undefined") {
  App.page.wireForm();
}
