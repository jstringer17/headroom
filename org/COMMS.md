# How the chief of staff talks to staff sessions (read first)
Problem found 2026-11-02: after the chief started a session on the CEO's Mac, the chief was limited to trusted devices, so send_message to cloud staff sessions can be refused ("untrusted device, nothing delivered"). Rules now:
1. Truth lives in the repo, not in chat: every staff session writes its result into its handoff file under 'Result' and commits+pushes to claude/inspiring-edison-6s7ude. The chief reads files and get_session (status_bucket, post_turn_summary), not long replies.
2. Chief -> staff: first try send_message. If refused or no reply in one cycle, append the request to org/handoffs/<name>.md under '## Requests from chief' and push; staff re-read that section at the start of every turn. Staff say so in their reply.
3. Staff -> chief: one short send_message with the commit sha; also update the row in org/TASKS.md. If send_message is refused (e.g. "elevated_session_untrusted_device"), write the message at the top of org/inbox/chief.md and push; the chief reads org/inbox/chief.md at every CEO message (added 2026-11-02 on the CEO's request).
4. One owner per row in TASKS.md; every row has pass/fail done-criteria; nobody reviews their own work (qa-reviewer does).
5. Sessions: cloud staff (host-core, owner-admin, billing-desk, cine-*) and the Mac session (env agency, bridge). The Mac session reaches the CEO's screen; secrets are typed by the CEO.
6. Check cadence: read org/inbox/chief.md, then get_session on each open row at every CEO message; a row 'working' with no commit for a day gets a ping.

## Models (CEO rule, 2026-11-02): cheapest that can do it, Opus 5.5 when it is hard
- Haiku (org:runner): lookups, file updates, status checks, small edits.
- Sonnet (org:researcher, org:analyst, most sessions): routine builds, tests, docs, pictures sorting.
- Opus 5.5 (org:planner, org:builder, org:qa-reviewer): plans, hard builds, security, money code, payments, final checks. Chief of staff may pick Opus without asking.
- Never Fable.
## Talking to the CEO
5th-grade words. Short. One next step. Do the work, do not hand it back. Test live before reporting.
