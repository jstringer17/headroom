# How the chief of staff talks to staff sessions (read first)
Problem found 2026-11-02: after the chief started a session on the CEO's Mac, the chief was limited to trusted devices, so send_message to cloud staff sessions can be refused ("untrusted device, nothing delivered"). Rules now:
1. Truth lives in the repo, not in chat: every staff session writes its result into its handoff file under 'Result' and commits+pushes to claude/inspiring-edison-6s7ude. The chief reads files and get_session (status_bucket, post_turn_summary), not long replies.
2. Chief -> staff: first try send_message. If refused or no reply in one cycle, append the request to org/handoffs/<name>.md under '## Requests from chief' and push; staff re-read that section at the start of every turn. Staff say so in their reply.
3. Staff -> chief: one short send_message with the commit sha; also update the row in org/TASKS.md.
4. One owner per row in TASKS.md; every row has pass/fail done-criteria; nobody reviews their own work (qa-reviewer does).
5. Sessions: cloud staff (host-core, owner-admin, billing-desk, cine-*) and the Mac session (env agency, bridge). The Mac session reaches the CEO's screen; secrets are typed by the CEO.
6. Check cadence: get_session on each open row at every CEO message; a row 'working' with no commit for a day gets a ping.
