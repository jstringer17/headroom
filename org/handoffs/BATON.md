# Baton: which handoff runs now (read by the hourly check-in; every builder updates its row before stopping)
| handoff file | status | started_at | last_commit |
|---|---|---|---|
| polish-round4.md | running | 2026-11-02T21:41Z (session_013FPdmxro5Sn2RKVFK4oLko) | - |
| test-baton.md | queued | - | - |
Rule for every builder: before you stop (done OR out of context), set your row to done, add a queued row for any follow-up handoff you wrote, commit and push. The check-in starts queued rows within the hour.
