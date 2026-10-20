/**
 * Sample notes, so the tree has something to fold on first load.
 *
 * They read like the log an agent would actually accumulate working with one
 * person over a couple of months: decisions, preferences, small facts picked
 * up sideways. Thirty-two of them is exactly four levels of merges, which
 * fills the tree to a single root.
 */

export type SeedNote = { date: string; text: string }

export const SEED_NOTES: SeedNote[] = [
  { date: '2026-08-04', text: 'Aya runs the platform team at Hollowpine and asked me to keep notes across sessions instead of re-asking.' },
  { date: '2026-08-04', text: 'House rule: one line per note, no paragraphs, and never a note that only restates the previous one.' },
  { date: '2026-08-05', text: 'Hollowpine ships a scheduling tool for dental clinics; 430 clinics on it, 11 of them above 20 chairs.' },
  { date: '2026-08-06', text: 'Their stack is Bun plus Postgres 17; the team rejected a Kafka proposal twice as too heavy for the volume.' },
  { date: '2026-08-07', text: 'Aya reviews PRs in the morning only, so anything opened after 16:00 waits a day regardless of size.' },
  { date: '2026-08-11', text: 'Decided: no new service without an owner named in the README, after the unowned billing cron rotted for a year.' },
  { date: '2026-08-12', text: 'The staging database is restored from production nightly, so test fixtures written by hand vanish by morning.' },
  { date: '2026-08-13', text: 'Aya prefers plain SQL migrations over an ORM layer and will reject a PR that adds one.' },
  { date: '2026-08-18', text: 'Incident: appointment reminders double-sent to 1,900 patients when the retry queue lost its idempotency key.' },
  { date: '2026-08-19', text: 'Root cause of the double-send was a cache key built from the clinic id alone, dropping the reminder window.' },
  { date: '2026-08-20', text: 'Fix shipped: idempotency keys now include the reminder window, and the queue refuses a write without one.' },
  { date: '2026-08-21', text: 'Aya wants every incident to end with one test that would have failed before the fix, not a doc.' },
  { date: '2026-08-25', text: 'Postmortems live in the repo under docs/incidents and are named by date, never by a ticket number.' },
  { date: '2026-08-26', text: 'The on-call rotation is two people and Aya refuses to grow it until alert volume drops below ten a week.' },
  { date: '2026-08-27', text: 'Alert volume was 34 a week in August; two thirds came from a disk check that fires on the backup volume.' },
  { date: '2026-08-28', text: 'Muted the backup-volume disk alert and replaced it with a weekly report, which cut pages to nine a week.' },
  { date: '2026-09-02', text: 'New project: clinics want a waitlist that auto-fills cancellations, which Aya calls the only 2026 feature that matters.' },
  { date: '2026-09-03', text: 'Waitlist rule from the clinics: never offer a slot to two patients at once, even if that wastes the slot.' },
  { date: '2026-09-04', text: 'Aya vetoed SMS for waitlist offers; push and email only, because SMS costs per clinic broke the pricing model.' },
  { date: '2026-09-08', text: 'Prototype of the waitlist filled 61% of cancellations in a one-clinic trial over two weeks.' },
  { date: '2026-09-09', text: 'The trial clinic, Rowan Dental, is the design partner and gets features a week early in exchange for feedback calls.' },
  { date: '2026-09-10', text: 'Rowan Dental asked for a 15-minute grace period before an offer passes to the next patient on the waitlist.' },
  { date: '2026-09-11', text: 'Grace period shipped at 15 minutes and is configurable per clinic, defaulting off for clinics under five chairs.' },
  { date: '2026-09-15', text: 'Aya is out the first week of October and wants nothing merged to the waitlist path while she is away.' },
  { date: '2026-09-16', text: 'Learned that Aya reads the changelog aloud at the Friday all-hands, so entries have to be one plain sentence.' },
  { date: '2026-09-22', text: 'Pricing changed: waitlist is bundled into the base plan rather than an add-on, after two clinics balked at the upsell.' },
  { date: '2026-09-23', text: 'Support load dropped a quarter after the waitlist shipped, because cancellation calls were most of the queue.' },
  { date: '2026-09-29', text: 'The clinics board asked for an audit trail of who saw which offer, which is now the top compliance request.' },
  { date: '2026-10-05', text: 'Audit trail designed as an append-only table with no deletes, so a clinic can prove an offer sequence later.' },
  { date: '2026-10-06', text: 'Aya approved the audit trail design in one sitting and asked for retention to be seven years, not ninety days.' },
  { date: '2026-10-13', text: 'Hollowpine renewed Rowan Dental for two years and credited the waitlist as the reason in the renewal note.' },
  { date: '2026-10-14', text: 'Next quarter is one thing only: the audit trail, with the waitlist frozen except for bugs that lose a slot.' },
]
