// =============================================================================
// Stress check-in section (FR-05 / UC-05) - Malika
// =============================================================================
// WHAT IT DOES
//   A 1-5 stress level, Yes/No answers to five short questions, and an optional note.
//
// HOW IT CONNECTS
//   - The questions come from the server (QUESTIONS in api/sections/stress.py, sent by
//     GET /api/days/options), so they're written in one place.
//   - LogPage.tsx renders it with value = { level, answers, note }.
//   - Saved by api/sections/stress.py; 3 high-stress days in a row shows SupportPanel.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the 1-5 stress level buttons. The questions and note are new.
// =============================================================================

import { FieldError } from '@/components/FieldError';
import { Panel } from '@/components/Panel';
import { SectionHeading } from '@/components/SectionHeading';
import type { DayForm, SectionProps } from './types';

export function StressSection({
  value,
  onChange,
  errors,
  questions,
}: SectionProps<DayForm['stress']> & { questions: string[] }) {
  // Set one question's answer: copy the list, changing only position `index`.
  const answer = (index: number, yes: boolean) =>
    onChange({ ...value, answers: value.answers.map((a, i) => (i === index ? yes : a)) });

  return (
    <Panel>
      <SectionHeading character="stress" title="Stress check-in" />
      <div className="field">
        <label>Stress, right now</label>
        <div className="segmented" role="group" aria-label="Stress level from one to five">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className={`segment ${value.level === n ? 'selected' : ''}`}
              onClick={() => onChange({ ...value, level: value.level === n ? null : n })}
              aria-pressed={value.level === n}
              data-testid={`button-stress-level-${n}`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="field-help">1 = light · 5 = a lot. Pick a level to save your check-in.</span>
        <FieldError id="stress-level-error" message={errors['stress.level']} />
      </div>
      <div className="question-list">
        {/* One row per question from the server; aria-labelledby ties the buttons to the question. */}
        {questions.map((question, index) => (
          <div className="question-row" key={question}>
            <span id={`stress-q-${index}`}>{question}</span>
            <div className="segmented" role="group" aria-labelledby={`stress-q-${index}`}>
              {[true, false].map((yes) => (
                <button
                  type="button"
                  key={String(yes)}
                  className={`segment ${value.answers[index] === yes ? 'selected' : ''}`}
                  aria-pressed={value.answers[index] === yes}
                  onClick={() => answer(index, yes)}
                  data-testid={`button-stress-q${index}-${yes ? 'yes' : 'no'}`}
                >
                  {yes ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <FieldError id="stress-answers-error" message={errors['stress.answers']} />
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="stress-note">Anything behind it? (optional)</label>
        <input
          id="stress-note"
          maxLength={500}
          value={value.note}
          placeholder="A deadline, a hard conversation…"
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          data-testid="input-stress-note"
        />
        <FieldError id="stress-note-error" message={errors['stress.note']} />
      </div>
    </Panel>
  );
}
