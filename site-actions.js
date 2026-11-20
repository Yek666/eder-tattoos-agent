// Registers Eder Tattoos' operations with the agent runtime.
// agent-manifest.json loads this module through "actions.module". Only the names in
// "actions.agentTools" become model tools, called website_<name>.
//
// Each action wraps an operation of the running booking page (App.page). The
// business rules stay in script.js. Operations return {ok: false, reason, field}
// when they refuse input, before changing anything. A throw is reported as "unknown".
// script.js is imported by the same URL the page uses, so there is one page state.
import { App } from "./script.js";

/**
 * Describes the site's operations as actions the agents can call.
 * Each action wraps a function the page already uses, so the assistant and the
 * manual UI share one set of rules. The runtime validates arguments against
 * inputSchema before execute runs, and asks the visitor to confirm
 * "irreversible" actions first.
 */
class SiteActions {
  static registerActions(actions) {
    actions.register(SiteActions.readStateAction());
    actions.register(SiteActions.fillBookingAction());
    actions.register(SiteActions.confirmBookingAction());
    actions.register(SiteActions.clearBookingAction());
  }

  static readStateAction() {
    return {
      name: "get_tattoo_state",
      description: "Read the real tattoo catalog, the fixed price ($1,000 MXN, $200 deposit), the booking draft, its version, the WhatsApp contact and what this site cannot do.",
      effect: "read",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: () => App.page.getState(),
    };
  }

  static fillBookingAction() {
    return {
      name: "fill_booking",
      description: "Fill or update the visible booking form with the visitor's idea, style, size in cm, placement, preferred date and name. Reversible: the visitor can edit or clear it. Returns the updated state. Does not confirm anything.",
      effect: "write",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          idea: { type: "string", minLength: 3, maxLength: 200, description: "What the tattoo should be, in the visitor's words." },
          style: { type: "string", enum: App.page.styleIds(), description: "Style id from website_get_tattoo_state: linea-fina, letras, fechas or simbolos." },
          sizeCm: { type: "number", minimum: 1, maximum: 5, description: "Size in cm, 1 to 5. This service is only up to 5 cm." },
          placement: { type: "string", minLength: 2, maxLength: 60, description: "Where on the body, e.g. muñeca, antebrazo." },
          preferredDate: { type: "string", format: "date", description: "Preferred date, YYYY-MM-DD, today or later." },
          name: { type: "string", minLength: 2, maxLength: 80, description: "Visitor's first name." },
        },
      },
      execute: (args) => App.page.fillBooking(args),
    };
  }

  static confirmBookingAction() {
    return {
      name: "confirm_booking",
      description: "Confirm the current booking draft. The browser asks the visitor to confirm first. Prepares the WhatsApp message with the booking details and returns a local receipt with its WhatsApp link. No payment is collected and no real appointment is stored; Eder confirms the date on WhatsApp. The site refuses a stale expectedVersion.",
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["expectedVersion"],
        properties: {
          expectedVersion: { type: "integer", minimum: 0, description: "The latest version in this turn, from website_get_tattoo_state or from a fill_booking made after that read." },
        },
      },
      execute: (args) => App.page.confirmBooking(args),
    };
  }

  static clearBookingAction() {
    return {
      name: "clear_booking",
      description: "Clear the booking draft and any prepared receipt. Reversible: the visitor can fill it again.",
      effect: "write",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: () => App.page.clearBooking(),
    };
  }
}

// The runtime calls the module's registerActions export.
export const registerActions = SiteActions.registerActions;
