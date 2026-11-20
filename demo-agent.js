// DEMO ONLY — rule-based local demo, NOT the hackathon agent.
// Answers the demo buttons using the same App.page functions as the real agent
// (getState / fillBooking), without calling any LLM or sending anything anywhere.
// Labelled as demo on the page. Delete this file and its <script> tag in
// index.html if you do not want the demo box.
import { App, TATTOO, formatMXN } from "./script.js";

function answer(prompt) {
  const p = prompt.toLowerCase();
  const state = App.page.getState();
  if (p.includes("cuánto cuesta") || p.includes("precio") || p.includes("cuesta")) {
    return `Demo: un tatuaje pequeño de hasta 5 cm cuesta ${formatMXN(state.price.totalMXN)}. Anticipo para apartar: ${formatMXN(state.price.depositMXN)}. Resto el día de la cita: ${formatMXN(state.price.restMXN)}.`;
  }
  if (p.includes("estilos") || p.includes("qué hacen") || p.includes("que hacen")) {
    return `Demo: estilos de Eder Tattoos: ${state.catalog[0].styles.map((s) => s.name).join(", ")}. Todos al mismo precio: tatuaje pequeño hasta 5 cm, ${formatMXN(state.price.totalMXN)}.`;
  }
  if (p.includes("llenar") || p.includes("reserva de ejemplo") || p.includes("letras")) {
    const result = App.page.fillBooking({
      idea: "Fecha 12-05-2020 en letras",
      style: "letras",
      sizeCm: 4,
      placement: "muñeca",
      preferredDate: "2027-01-20",
      name: "Ana",
    });
    if (!result.ok) return `Demo: no pude llenar la reserva: ${result.reason}`;
    return `Demo: reserva llenada en el formulario — letras, 4 cm, muñeca, 20 de enero de 2027, Ana. Total ${formatMXN(state.price.totalMXN)}, anticipo ${formatMXN(state.price.depositMXN)}. Revisa el formulario arriba y confirma ahí; el enlace de WhatsApp ya se activó.`;
  }
  return "Demo: puedo contarte el precio, los estilos, o llenar una reserva de ejemplo con los botones de arriba.";
}

if (typeof document !== "undefined") {
  document.querySelectorAll("#demo-box [data-demo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const out = document.getElementById("demo-answer");
      if (out) out.textContent = answer(btn.getAttribute("data-demo") || "");
    });
  });
}
