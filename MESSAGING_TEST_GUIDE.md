# Messaging System Test Guide

## Database Schema Verification

### Collections Used:
1. **users** - User profiles
2. **follows** - Follow relationships
3. **conversations** - Message conversations
4. **messages** - Individual messages

### Follow Relationship Structure:
```json
{
  "id": "uuid",
  "follower_id": "user_who_follows",
  "following_id": "user_being_followed",
  "created_at": "timestamp"
}
```

### Mutual Follow Logic:
For User A to message User B, BOTH conditions must be true:
1. `follows` document exists: `{follower_id: A, following_id: B}`
2. `follows` document exists: `{follower_id: B, following_id: A}`

## Test Scenarios

### Scenario 1: Mutual Follow ✅
**Setup:**
- User A follows User B
- User B follows User A back

**Expected Behavior:**
1. ✅ "Message" button appears on User A's profile page (when viewed by User B)
2. ✅ "Message" button appears on User B's profile page (when viewed by User A)
3. ✅ Clicking "Message" creates conversation
4. ✅ Both users can send messages
5. ✅ Messages appear in real-time via WebSocket

**Test Steps:**
1. Login as User A
2. Go to User B's profile
3. Click "Follow" button
4. Login as User B (different browser/incognito)
5. Go to User A's profile
6. Click "Follow" button
7. Verify "Message" button appears on both profiles
8. Click "Message" button
9. Send a test message
10. Check if message appears on other user's MessagesPage

### Scenario 2: One-Way Follow ❌
**Setup:**
- User A follows User B
- User B does NOT follow User A

**Expected Behavior:**
1. ❌ NO "Message" button on User B's profile (when viewed by User A)
2. ❌ Attempting to create conversation via API returns 403 error
3. ✅ Error message: "You can only message users who mutually follow each other"

**Test Steps:**
1. Login as User A
2. Go to User B's profile
3. Click "Follow" button
4. Verify NO "Message" button appears
5. Try API call: `POST /api/conversations` with User B's ID
6. Verify 403 error response

### Scenario 3: No Follow Relationship ❌
**Setup:**
- User A does NOT follow User B
- User B does NOT follow User A

**Expected Behavior:**
1. ❌ NO "Message" button on either profile
2. ❌ API call returns 403 error

### Scenario 4: Self-Messaging ❌
**Setup:**
- User tries to message themselves

**Expected Behavior:**
1. ❌ API returns 400 error: "Cannot message yourself"

## API Endpoints Reference

### Check Eligibility
```bash
GET /api/conversations/check-eligibility/{user_id}
Authorization: Bearer <token>

Response:
{
  "can_message": true/false,
  "reason": "You must mutually follow each other" | null
}
```

### Create Conversation
```bash
POST /api/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_id": "user_id_here"
}

Success Response (200):
{
  "id": "conversation_id",
  "participants": ["user1_id", "user2_id"],
  "participant_details": [...],
  "last_message": null,
  "last_message_at": null,
  "unread_count": {},
  "created_at": "timestamp"
}

Error Response (403):
{
  "detail": "You can only message users who mutually follow each other"
}
```

### Send Message
```bash
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello!",
  "conversation_id": "conversation_id_here"
}
```

## Frontend Components

### Header.js
- **Messages Icon**: MessageCircle with unread badge
- **Unread Count**: Fetched from `GET /api/conversations/unread-count`
- **WebSocket**: Listens for "new_message" events, increments badge

### ProfilePage.js
- **Message Button**: Only visible when `canMessage === true`
- **Eligibility Check**: Calls `GET /api/conversations/check-eligibility/{user_id}` on mount
- **Handle Message**: Creates conversation and navigates to `/messages`

### MessagesPage.js
- **Conversations List**: Sorted by `last_message_at`
- **Real-time Updates**: WebSocket connection for instant delivery
- **Read Receipts**: Check (delivered) / CheckCheck (read)
- **Auto-mark Read**: Marks messages as read when viewing conversation

## MongoDB Query Examples

### Check Mutual Follow
```javascript
// User A follows User B
db.follows.findOne({
  follower_id: "user_a_id",
  following_id: "user_b_id"
})

// User B follows User A
db.follows.findOne({
  follower_id: "user_b_id",
  following_id: "user_a_id"
})

// Both must exist for mutual follow
```

### Create Follow Relationship
```javascript
// User A follows User B
db.follows.insertOne({
  id: "uuid",
  follower_id: "user_a_id",
  following_id: "user_b_id",
  created_at: new Date().toISOString()
})
```

### Find All Mutual Followers
```javascript
// Get all users that User A mutually follows
const userFollows = await db.follows.find({ follower_id: "user_a_id" }).toArray()
const followingIds = userFollows.map(f => f.following_id)

const mutualFollows = await db.follows.find({
  follower_id: { $in: followingIds },
  following_id: "user_a_id"
}).toArray()
```

## Common Issues & Solutions

### Issue 1: Message button not appearing
**Cause**: Mutual follow not established
**Solution**: 
1. Check `db.follows` collection for BOTH follow documents
2. Verify `checkMessagingEligibility` returns `can_message: true`

### Issue 2: 403 Error when creating conversation
**Cause**: One-way follow or no follow relationship
**Solution**:
1. Ensure both users follow each other
2. Check API response for specific error message

### Issue 3: Messages not appearing in real-time
**Cause**: WebSocket connection issue
**Solution**:
1. Check browser console for WebSocket errors
2. Verify backend WebSocket endpoint is accessible
3. Check `ConnectionManager` in backend logs

### Issue 4: Unread count not updating
**Cause**: WebSocket not listening for "new_message" events
**Solution**:
1. Verify Header.js WebSocket connection is established
2. Check if `data.type === 'new_message'` handler is working
3. Ensure `setUnreadMessages(prev => prev + 1)` is called

## Testing Checklist

- [ ] Install backend dependencies: `pip install -r requirements.txt`
- [ ] Install frontend dependencies: `cd frontend && npm install`
- [ ] Start backend: `uvicorn server:app --reload --host 0.0.0.0 --port 8000`
- [ ] Start frontend: `npm start`
- [ ] Create two test users (User A, User B)
- [ ] Test Scenario 1: Mutual follow → Message button appears
- [ ] Test Scenario 2: One-way follow → No message button
- [ ] Test Scenario 3: Send message and verify real-time delivery
- [ ] Test Scenario 4: Check unread count in Header badge
- [ ] Test Scenario 5: Open conversation and verify read receipts
- [ ] Test Scenario 6: Mobile responsive layout
- [ ] Test Scenario 7: Search conversations
- [ ] Test Scenario 8: Multiple conversations switching

## Success Criteria

✅ **Mutual Follow Detection Works**: Message button only appears for mutual followers
✅ **Real-time Delivery Works**: Messages appear instantly via WebSocket
✅ **Read Receipts Work**: Check → CheckCheck when message is read
✅ **Unread Count Works**: Header badge shows correct unread count
✅ **Mobile Responsive**: UI adapts to mobile screens
✅ **Error Handling**: Proper error messages for invalid scenarios
✅ **Performance**: Instant updates without page reloads

## Database Indexes (Recommended for Production)

```javascript
// follows collection
db.follows.createIndex({ follower_id: 1, following_id: 1 }, { unique: true })
db.follows.createIndex({ following_id: 1 })

// conversations collection
db.conversations.createIndex({ participants: 1 })
db.conversations.createIndex({ updated_at: -1 })

// messages collection
db.messages.createIndex({ conversation_id: 1, created_at: -1 })
db.messages.createIndex({ read_by: 1 })
```
