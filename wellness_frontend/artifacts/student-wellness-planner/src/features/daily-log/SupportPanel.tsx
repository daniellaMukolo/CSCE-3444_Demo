// AI ASSISTANCE: Drafted with Claude (Anthropic) from Malika Ray's Replit AI prototype, and reviewed by Malika Ray.
// =============================================================================
// Campus support message (UC-05 5a) - Malika
// =============================================================================
// WHAT IT DOES
//   Shown after 3 days in a row with stress at 4 or higher. Points to campus support
//   without giving medical advice.
//
// HOW IT CONNECTS
//   - The server decides when (needs_support in api/sections/stress.py) and sends
//     supportMessage: true with the day; LogPage.tsx then shows this panel.
// =============================================================================

import { SectionHeading } from '@/components/SectionHeading';

export function SupportPanel() {
  return (
    <section className="panel support-panel" role="status" data-testid="panel-support">
      <SectionHeading character="stress" title="You’ve been carrying a lot" />
      <p>
        Your stress has been 4 or higher for three days in a row. That’s worth paying attention to, and you
        don’t have to handle it alone. UNT Counseling and Testing Services offers counseling for students; you
        can find their contact details on the UNT website or ask your academic advisor.
      </p>
      <p className="subtle">This app is a self-tracking tool, not medical advice.</p>
    </section>
  );
}
