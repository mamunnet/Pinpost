# Modal Tab Fix - Blog Article vs Quick Post

## Problem
When clicking on "Blog Article" or "Quick Post" buttons, the create modal was always opening with the default tab (Quick Post), regardless of which button was clicked.

## Solution Applied

### 1. Added State to Track Initial Tab
**File:** `frontend/src/App.js` - HomePage component

```javascript
// Added new state
const [initialTab, setInitialTab] = useState('post');
```

### 2. Updated Button Click Handlers

#### "What's on your mind" Input
```javascript
onClick={() => {
  setInitialTab('post');
  setShowCreateModal(true);
}}
```

#### "Blog Article" Button
```javascript
onClick={() => {
  setInitialTab('blog');
  setShowCreateModal(true);
}}
```

#### "Quick Post" Button
```javascript
onClick={() => {
  setInitialTab('post');
  setShowCreateModal(true);
}}
```

### 3. Pass Initial Tab to Modal
```javascript
<EnhancedPostModal 
  onClose={() => setShowCreateModal(false)} 
  currentUser={user} 
  initialTab={initialTab}  // ← New prop
/>
```

### 4. Updated Modal Component
**File:** `frontend/src/components/EnhancedPostModal.js`

```javascript
// Added initialTab prop with default value
export const EnhancedPostModal = ({ onClose, currentUser, initialTab = 'post' }) => {
  // Use initialTab to set the default contentType
  const [contentType, setContentType] = useState(initialTab);
  // ...rest of code
}
```

## How It Works

1. User clicks "Blog Article" button
2. `setInitialTab('blog')` is called
3. Modal opens with `initialTab='blog'`
4. EnhancedPostModal sets `contentType` to 'blog'
5. **Blog Article tab is shown by default** ✅

Similarly:
- Clicking "Quick Post" or "What's on your mind" → Opens with Quick Post tab
- User can still switch tabs manually in the modal

## Result

✅ **Blog Article** button → Opens modal with **Blog Article tab active**
✅ **Quick Post** button → Opens modal with **Quick Post tab active**
✅ **What's on your mind** input → Opens modal with **Quick Post tab active**
✅ User can still switch tabs manually if needed

## Files Modified
1. `frontend/src/App.js` - Added initialTab state and click handlers
2. `frontend/src/components/EnhancedPostModal.js` - Accept and use initialTab prop

The fix is complete and the app should hot-reload automatically! 🎉
