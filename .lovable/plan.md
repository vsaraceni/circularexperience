

## Fix: Sidebar taking 90% of the screen in ProposalView

The bug is in `src/pages/ProposalView.tsx` around lines 131-148:

1. The sidebar `div` (line 131) has inline `width: "100%"` and `maxWidth: "100%"` — this makes it fill the entire row on desktop.
2. The `.proposal-sidebar` CSS class (lines 140-148) that limits width to 320px is applied to the **main content area** (line 207: `className="flex-1 flex flex-col p-8 md:p-14 proposal-sidebar"`), not the sidebar.

### Fix

- **Sidebar div**: Remove `width: "100%"` and `maxWidth: "100%"` from inline styles. Add the `proposal-sidebar` class to the sidebar instead.
- **Main content div**: Remove the `proposal-sidebar` class from it.
- **CSS media query**: Keep `.proposal-sidebar` targeting `width: 320px` for the sidebar on desktop.

This is a class assignment swap — no layout or content changes.

