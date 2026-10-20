// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// Error message under a form field (NFR 6.3) - Shared (integration: Bobby)
// =============================================================================
// WHAT IT DOES
//   Shows the server's message right under the field it belongs to, e.g. "Enter whole
//   minutes from 1 to 600." Shows nothing when there's no message.
//
// HOW IT CONNECTS
//   - Every form uses it. The messages come from the server's validate() functions,
//     keyed by field (see api/days.py), so the wording is written in one place.
//   - role="alert" makes screen readers announce the message when it appears.
// =============================================================================

/** An error message shown right under a form field (NFR 6.3). Renders nothing when there's no message. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span className="field-error" id={id} role="alert">
      {message}
    </span>
  );
}
