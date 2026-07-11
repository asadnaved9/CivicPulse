# Security Spec & Payload-First TDD

## Data Invariants
1. **User Ownership**: A user profile (`/users/{userId}`) can only be created or written to by the authenticated user whose `request.auth.uid` matches the document ID `{userId}`.
2. **Issue Ownership & Integrity**: An issue report (`/issues/{issueId}`) must have a `reportedBy` field that matches the creator's UID. The `upvotes` field can only be appended to by authenticated users.
3. **No Terminal State Bypass**: A resolved issue (`status: 'resolved'`) cannot have its status updated back or modified, unless done by an admin concept.
4. **Valid IDs**: Document IDs and relational keys must consist of alphanumeric characters and standard delimiters to prevent directory traversal and injection attacks.
5. **System-Only Fields**: Fields like `createdAt` and `updatedAt` must be populated with official server-side timestamps (`request.time`).

---

## The "Dirty Dozen" Payloads
These payloads attempt to bypass authorization, inject malformed data, or spoof identities:

1. **User Profile Spoofing**
   - **Path**: `/users/legit_user_123`
   - **Payload**: `{ "uid": "legit_user_123", "displayName": "Attacker", "points": 99999 }`
   - **Context**: Sent by `attacker_456` trying to edit someone else's profile.

2. **Self-Awarding points during Registration**
   - **Path**: `/users/attacker_456`
   - **Payload**: `{ "uid": "attacker_456", "displayName": "Attacker", "points": 1000000, "badges": ["Community Guardian"] }`
   - **Context**: Creating profile with pre-loaded high points.

3. **Anonymous User Privilege Escalation**
   - **Path**: `/users/anon_789`
   - **Payload**: `{ "uid": "anon_789", "displayName": "Admin", "points": 1000, "role": "admin" }`
   - **Context**: Trying to register with administrative fields.

4. **Issue Report - Identity Spoofing**
   - **Path**: `/issues/issue_abc`
   - **Payload**: `{ "title": "Pothole", "category": "pothole", "reportedBy": "other_user", "lat": 12.97, "lng": 77.59, "address": "Indiranagar", "createdAt": "2026-06-25T10:50:20Z" }`
   - **Context**: Submitting an issue but claiming it was reported by another citizen.

5. **Issue Report - Giant Payload Injection**
   - **Path**: `/issues/issue_huge`
   - **Payload**: `{ "title": "A".repeat(1000000), "category": "pothole", "reportedBy": "attacker", "lat": 12.97, "lng": 77.59 }`
   - **Context**: Denial of Wallet/exhausting storage limits with 1MB title.

6. **Issue Report - Client-Forced Created Timestamp**
   - **Path**: `/issues/issue_xyz`
   - **Payload**: `{ "title": "Water Leak", "category": "water", "reportedBy": "attacker", "createdAt": "1999-01-01T00:00:00Z" }`
   - **Context**: Setting artificial historic creation times to skew SLAs or bypass escalation checks.

7. **Issue Status - Skipping Workflow (Directly Setting 'resolved')**
   - **Path**: `/issues/issue_xyz`
   - **Payload**: `{ "title": "New Issue", "category": "water", "reportedBy": "attacker", "status": "resolved" }`
   - **Context**: Citizens creating an issue already marked as "resolved" to cheat resolution points.

8. **Issue Upvote - Unauthorized Modification**
   - **Path**: `/issues/issue_xyz`
   - **Payload**: `{ "upvotes": ["attacker_456", "victim_789", "friend_111"] }`
   - **Context**: A single attacker adding multiple user IDs to the upvotes array in one write to fake community prioritization.

9. **Zone Prediction - Arbitrary Modification**
   - **Path**: `/zonePredictions/grid_123`
   - **Payload**: `{ "totalRiskScore": 999, "potholeRisk": "CRITICAL" }`
   - **Context**: Citizen or attacker attempting to write directly to machine-learning generated risk maps.

10. **Notification Spamming**
    - **Path**: `/notifications/notif_1`
    - **Payload**: `{ "userId": "victim_789", "message": "You win!", "read": false }`
    - **Context**: An attacker writing to another user's private notification collection.

11. **Activity Log Forgery**
    - **Path**: `/activities/act_1`
    - **Payload**: `{ "userId": "attacker", "pointsAwarded": 1000, "type": "forged" }`
    - **Context**: Directly logging high-point actions to trigger badges.

12. **Analytics Override**
    - **Path**: `/analytics/healthScore`
    - **Payload**: `{ "score": 100, "summaryText": "Everything is perfect." }`
    - **Context**: Overwriting ward health scores directly from client-side SDK.

---

## The Test Runner Definition (`firestore.rules.test.ts`)
This mock test suite defines the expectations for each negative scenario:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('CivicPulse Firebase Security Rules', () => {
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'strategic-condition-sr3lf',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('1. should deny user profile modification by a different user', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.doc('users/legit_user_123').update({ displayName: 'Attacker' }));
  });

  it('2. should deny self-awarding points during registration', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.doc('users/attacker_456').set({
      uid: 'attacker_456',
      displayName: 'Attacker',
      points: 1000000,
      badges: ['Community Guardian']
    }));
  });

  it('3. should block anonymous user profile privilege escalation', async () => {
    const context = testEnv.authenticatedContext('anon_789');
    const db = context.firestore();
    await assertFails(db.doc('users/anon_789').set({
      uid: 'anon_789',
      displayName: 'Admin',
      points: 1000,
      role: 'admin'
    }));
  });

  it('4. should deny reporting issues under a spoofed identity', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.collection('issues').add({
      title: 'Pothole',
      category: 'pothole',
      reportedBy: 'other_user',
      lat: 12.97,
      lng: 77.59,
      address: 'Indiranagar'
    }));
  });

  it('5. should deny giant payload fields (Denial of Wallet)', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.collection('issues').add({
      title: 'A'.repeat(100000),
      category: 'pothole',
      reportedBy: 'attacker_456',
      lat: 12.97,
      lng: 77.59,
      address: 'Indiranagar'
    }));
  });

  it('6. should reject client-forced creation timestamps', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.collection('issues').add({
      title: 'Pothole',
      category: 'pothole',
      reportedBy: 'attacker_456',
      lat: 12.97,
      lng: 77.59,
      address: 'Indiranagar',
      createdAt: new Date('1999-01-01')
    }));
  });

  it('7. should reject direct setting of status to resolved on creation', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.collection('issues').add({
      title: 'New Issue',
      category: 'water',
      reportedBy: 'attacker_456',
      status: 'resolved',
      lat: 12.97,
      lng: 77.59,
      address: 'Indiranagar'
    }));
  });

  it('8. should prevent arbitrary upvote bulk modification', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.doc('issues/issue_xyz').update({
      upvotes: ['attacker_456', 'victim_789']
    }));
  });

  it('9. should deny direct writing to zone predictions', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.doc('zonePredictions/grid_123').set({
      totalRiskScore: 999
    }));
  });

  it('10. should deny notification writes by standard users', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.doc('notifications/notif_1').set({
      userId: 'victim_789',
      message: 'Spam'
    }));
  });

  it('11. should deny direct activity log forgery', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.doc('activities/act_1').set({
      userId: 'attacker_456',
      pointsAwarded: 1000
    }));
  });

  it('12. should block direct client-side analytics overwriting', async () => {
    const context = testEnv.authenticatedContext('attacker_456');
    const db = context.firestore();
    await assertFails(db.doc('analytics/healthScore').set({
      score: 100
    }));
  });
});
```
