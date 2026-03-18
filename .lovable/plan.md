

## Problem

The Leads tab in the CRM only shows leads with `status = 'new'`. External leads likely have a different status value (or no status set), so they are filtered out.

## Solution

Remove the `.eq("status", "new")` filter from the `fetchLeads` query in `Proposals.tsx` so ALL leads are displayed. Then add a visual indicator for the lead status so the user can distinguish between new, converted, and other statuses.

### Changes

1. **`src/pages/admin/Proposals.tsx`** -- In `fetchLeads`, remove the `.eq("status", "new")` filter so all leads are fetched regardless of status. Optionally exclude only `converted` leads if the user prefers not to see those.

2. **`src/components/admin/LeadList.tsx`** -- Add a badge or visual tag showing the lead's `status` value (e.g., "new", "contacted", etc.) so leads from different sources/statuses are distinguishable.

### Technical Detail

Current query:
```typescript
supabase.from("leads").select("*").eq("status", "new").order(...)
```

Updated query (show all non-converted leads):
```typescript
supabase.from("leads").select("*").neq("status", "converted").order(...)
```

This ensures external leads with any status other than "converted" will appear in the tab.

