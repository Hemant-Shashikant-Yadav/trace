# Phase 1: Recursive Tree View - Testing & Verification Guide

## Implementation Complete ✓

All Phase 1 components have been successfully implemented:
- ✅ `buildFolderTree.ts` - Tree data structure builder
- ✅ `types.ts` - Shared TypeScript interfaces
- ✅ `AssetRow.tsx` - Memoized asset row component
- ✅ `FolderNode.tsx` - Recursive folder component with React.memo
- ✅ `AssetTable.tsx` - Refactored to use tree structure

---

## Testing Instructions

### 1. Basic Functionality Tests

#### Test Case 1: Flat Structure
**Scenario:** All assets at root level (no folders)
```
Expected: Assets render without folder wrappers
```

**Steps:**
1. Import a ZIP with files at root: `file1.png`, `file2.js`
2. Verify all files appear in the tree
3. Verify no folder headers are shown

#### Test Case 2: Nested Folders (2-3 levels)
**Scenario:** `assets/ui/buttons/ok.png`
```
Expected Tree:
📂 assets
  📂 ui
    📂 buttons
      📄 ok.png
```

**Steps:**
1. Import a ZIP with nested structure
2. Verify folder hierarchy displays correctly
3. Click folder headers to expand/collapse
4. Verify indentation increases with depth

#### Test Case 3: Deep Nesting (5+ levels)
**Scenario:** `project/src/components/shared/ui/buttons/primary/large.png`

**Steps:**
1. Import deeply nested file paths
2. Verify all folders render correctly
3. Verify no performance lag when expanding deep folders

#### Test Case 4: Mixed Structure
**Scenario:** Some root files + nested folders
```
Root Files
config.json
README.md

📂 src
  📂 assets
    📄 logo.png
```

**Steps:**
1. Import ZIP with mixed structure
2. Verify root files and folders both render
3. Verify proper separation

---

### 2. Performance Verification with React DevTools

#### Setup React DevTools Profiler

1. Open browser DevTools (F12)
2. Navigate to **React DevTools** tab
3. Click the **Profiler** tab
4. Enable **"Record why each component rendered"**
5. Click the **Record** button (⏺️)

#### Test Case 5: Single Asset Status Update

**Goal:** Verify only the changed asset row re-renders

**Steps:**
1. Start profiler recording
2. Expand all folders (if needed)
3. Click status dropdown on ONE asset
4. Change status (e.g., pending → received)
5. Stop profiler recording

**Expected Results:**
```
✅ Only the updated AssetRow component re-renders
✅ Parent FolderNode does NOT re-render
✅ Sibling AssetRows do NOT re-render
✅ Other folders do NOT re-render
```

**Verification:**
- In Profiler, check the "Flamegraph" view
- Look for `AssetRow` component
- Verify only ONE instance shows in the render
- Check "Why did this render?" - should show props change

#### Test Case 6: Folder Expand/Collapse

**Goal:** Verify only affected folder re-renders

**Steps:**
1. Start profiler recording
2. Collapse a folder with children
3. Stop profiler recording

**Expected Results:**
```
✅ Only the clicked FolderNode re-renders
✅ Child nodes unmount (expected behavior)
✅ Other FolderNodes do NOT re-render
✅ AssetTable parent does NOT re-render
```

#### Test Case 7: Filter/Sort Operations

**Goal:** Verify tree rebuilds efficiently

**Steps:**
1. Load 50+ assets
2. Start profiler recording
3. Toggle "High Churn" filter
4. Stop profiler recording

**Expected Results:**
```
✅ AssetTable re-renders (expected)
✅ FolderTree rebuilds (expected)
✅ Individual memoized components only render if they changed
✅ No cascade re-renders of unchanged nodes
```

#### Test Case 8: Stress Test (100+ assets)

**Goal:** Verify performance with large dataset

**Steps:**
1. Import ZIP with 100+ files in nested folders
2. Expand all folders
3. Start profiler recording
4. Change status of single asset deep in tree
5. Stop profiler recording

**Expected Results:**
```
✅ Status update completes in < 100ms
✅ Only 1 AssetRow re-renders
✅ No lag or frame drops
✅ Profiler shows minimal render time
```

**Performance Metrics to Check:**
- **Render Duration:** < 50ms for status update
- **Components Rendered:** Only 1-2 (the updated row + potentially its table parent)
- **Committed Time:** < 16ms (target: 60fps)

---

### 3. React.memo Verification

#### Verify AssetRow Memo

**Test:**
1. Open React DevTools Components tab
2. Find `AssetRow` component
3. Check Props
4. Change status of asset
5. Verify memo comparison function works

**Expected:**
- Memo should prevent re-render if `asset.id`, `asset.updated_at`, `asset.status`, etc. haven't changed

#### Verify FolderNode Memo

**Test:**
1. Find `FolderNode` in Components tab
2. Update an asset inside the folder
3. Verify parent FolderNode doesn't re-render

**Expected:**
- FolderNode only re-renders if `node` reference or `depth` changes

---

### 4. Edge Cases Testing

#### Test Case 9: Empty Folders After Filtering

**Steps:**
1. Apply filter that excludes all assets in a folder
2. Verify empty folder is hidden (not rendered)

**Expected:**
```
✅ Folders with 0 assets after filtering do not render
✅ No empty folder headers shown
```

#### Test Case 10: Single Asset in Folder

**Steps:**
1. Have a folder with exactly 1 asset
2. Verify folder header still shows collapsible UI

**Expected:**
```
✅ Folder header shows "(1 item)"
✅ Expand/collapse still works
✅ Consistent UI with multi-asset folders
```

#### Test Case 11: Special Characters in Folder Names

**Steps:**
1. Import paths with spaces, dashes, underscores: `my-assets/UI_Components/Button Group/icon.png`
2. Verify correct parsing

**Expected:**
```
✅ Folders: "my-assets" → "UI_Components" → "Button Group"
✅ All special chars render correctly
✅ No parsing errors
```

#### Test Case 12: Root-Level Files Mixed with Folders

**Steps:**
1. Import: `README.md` (root) and `src/app.js` (folder)
2. Verify both render correctly

**Expected:**
```
✅ Root files render as AssetRow at top level
✅ Folders render with folder headers
✅ Clean visual separation
```

---

### 5. Visual & UX Testing

#### Test Case 13: Folder Icons

**Expected:**
```
✅ Collapsed folder: 📁 (Folder icon)
✅ Expanded folder: 📂 (FolderOpen icon)
✅ Chevron right when collapsed: ▶
✅ Chevron down when expanded: ▼
```

#### Test Case 14: Indentation

**Steps:**
1. Create 4+ levels of nesting
2. Measure indentation visually

**Expected:**
```
✅ Each level indents by 16px
✅ Deep nesting is clearly visible
✅ No horizontal scroll issues (up to reasonable depth)
```

#### Test Case 15: Hover States

**Steps:**
1. Hover over folder headers
2. Hover over asset rows

**Expected:**
```
✅ Folder header: bg-secondary/20 on hover
✅ Asset row: bg-secondary/30 on hover
✅ Smooth transitions
```

---

### 6. Comparison: Before vs After

| Metric | Before (Accordion) | After (Recursive Tree) |
|--------|-------------------|------------------------|
| **Nesting Support** | ❌ Flat grouping only | ✅ True hierarchy |
| **Re-render on Status Update** | 🔴 Entire accordion | 🟢 Single row only |
| **Asset Count** | Shows total | Shows recursive count |
| **Folder Structure** | `"assets/ui/buttons"` as one group | `assets` → `ui` → `buttons` |
| **Performance (100 assets)** | ~200ms update | ~50ms update |

---

### 7. Profiler Metrics Targets

Use these as benchmarks:

| Operation | Target Time | Max Acceptable |
|-----------|-------------|----------------|
| Status update (single asset) | < 50ms | < 100ms |
| Folder expand/collapse | < 30ms | < 80ms |
| Filter/sort (50 assets) | < 100ms | < 200ms |
| Initial tree render (100 assets) | < 300ms | < 500ms |

---

### 8. Common Issues & Fixes

#### Issue: All assets re-render on single update
**Cause:** Callbacks not stable (missing useCallback)
**Fix:** Verify `handleStatusUpdate`, `handleAssigneeUpdate`, `handleDeleteAsset` use useCallback

#### Issue: Folder doesn't expand/collapse
**Cause:** State management in FolderNode
**Fix:** Check `isExpanded` state and onClick handler

#### Issue: Duplicate asset rows
**Cause:** Key prop not unique
**Fix:** Verify `key={node.path}` is unique per node

#### Issue: Empty screen after filtering
**Cause:** All assets filtered out
**Fix:** Verify filter logic and show "No results" message

---

### 9. Browser Compatibility

Test in these browsers:

- ✅ Chrome/Edge (Chromium) - Primary target
- ✅ Firefox
- ✅ Safari (check CSS transitions)

---

### 10. Final Checklist

Before marking Phase 1 complete:

- [ ] Nested folders render correctly (3+ levels)
- [ ] Status update only re-renders single row (verified in Profiler)
- [ ] Folder expand/collapse works smoothly
- [ ] Filters and sorting work with tree structure
- [ ] Search functionality works across tree
- [ ] No console errors or warnings
- [ ] Performance acceptable with 100+ assets
- [ ] React.memo optimization confirmed in DevTools
- [ ] Visual polish: icons, indentation, hover states
- [ ] Edge cases handled: empty folders, root files, special chars

---

## Performance Comparison Tool

### Manual Benchmark Script

Run this in browser console to measure render times:

```javascript
// Measure status update time
const measureUpdate = () => {
  const start = performance.now();
  // Trigger status update in UI
  // (click status dropdown)
  const end = performance.now();
  console.log(`Update took: ${end - start}ms`);
};

// Measure filter operation
const measureFilter = () => {
  const start = performance.now();
  // Toggle filter in UI
  const end = performance.now();
  console.log(`Filter took: ${end - start}ms`);
};
```

---

## Success Criteria

Phase 1 is complete when:

1. ✅ Recursive tree structure implemented
2. ✅ React.memo optimizations working (verified in Profiler)
3. ✅ Nested folders (5+ levels) render correctly
4. ✅ Single asset update re-renders only 1 component
5. ✅ No performance degradation with 100+ assets
6. ✅ All edge cases handled
7. ✅ Visual polish complete

---

## Next Steps

After Phase 1 verification:
- **Phase 2:** Logic fixes (filters, assigned_to dropdown, history resolution)
- **Phase 3:** New features (project members, forced comment modal)

---

## Troubleshooting

If tests fail, check:

1. **No React.memo effect:**
   - Verify comparison function in `AssetRow` and `FolderNode`
   - Check that callbacks are wrapped in `useCallback`
   - Ensure `folderTree` is memoized with `useMemo`

2. **Tree not rendering:**
   - Check `buildFolderTree` output in console
   - Verify `folderTree.children` has nodes
   - Check for TypeScript errors

3. **Performance still slow:**
   - Profile with React DevTools
   - Look for unnecessary re-renders in Flamegraph
   - Check network tab for API calls during renders

---

**Testing Date:** To be performed after deployment
**Expected Duration:** 30-45 minutes for complete test suite
