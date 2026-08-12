# CampusResolve — E2E test checklist

Password for all demo users: `demo1234`

## Normal path

1. Login as `student@demo.edu`
2. Create a new complaint (medium urgency)
3. Confirm unique ticket ID appears
4. Login as `warden@demo.edu` → Mark under review → Assign `worker@demo.edu`
5. Login as `worker@demo.edu` → Accept → Resolve with notes
6. Login as student → Accept resolution → status Closed

## Rejected path

1. Resolve a ticket as worker
2. Student rejects → ticket reopens under review and is escalated
3. Admin dashboard shows the escalated case

## Emergency path

1. Student submits urgency = Emergency (or category Safety)
2. Ticket flagged escalated immediately
3. Visible on Admin escalations

## Delayed / overdue path

1. Assign a ticket (sets deadlines)
2. Manually edit `.data/store.json` deadlines to a past ISO time
3. Reload warden/admin views → escalation reason recorded in activity trail

## Help Assistant

1. Open chat bubble on any role page
2. Ask “How do I submit a complaint?”
3. Without `OPENAI_API_KEY`, FAQ fallback answers; with key, LangChain answers

## Form suggest

1. On New Request, enter a plumbing description
2. Click “AI suggest category & urgency”
3. Confirm fields update; submit still works if suggest fails
