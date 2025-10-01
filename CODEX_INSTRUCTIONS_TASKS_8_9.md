# Codex Instructions for Tasks 8 & 9

## 🎯 Current Status
- **Completed**: Tasks 1-7 (64% complete)
- **Next Priority**: Task 8 (Authentication) + Task 9 (Email Sequencing)
- **Goal**: Enable user accounts and multi-touch campaign scheduling

---

## 📋 Task 8: API Authentication & User Management

### Context
Currently, the platform is anonymous - anyone can discover contacts without login. We need user accounts for:
- Rate limiting (prevent abuse)
- Usage tracking (for billing)
- Data persistence (save discoveries per user)
- Multi-user support (teams)

### Your Mission
Build a lightweight JWT-based authentication system with rate limiting.

### Implementation Checklist

#### Backend Changes

**New File: `backend/src/types/user.ts`**
```typescript
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  plan: 'free' | 'starter' | 'pro' | 'team';
  discoveryLimit: number;
  discoveryCount: number; // resets monthly
  createdAt: string;
  lastResetAt: string;
}

export interface AuthToken {
  userId: string;
  email: string;
  plan: string;
  exp: number; // expiration timestamp
}

export interface RateLimitStatus {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
}
```

**New File: `backend/src/services/auth.ts`**
- [ ] Function `hashPassword(password: string): Promise<string>` using bcrypt
- [ ] Function `verifyPassword(password: string, hash: string): Promise<boolean>`
- [ ] Function `generateJWT(user: User): string` - signs with secret, 7-day expiry
- [ ] Function `verifyJWT(token: string): AuthToken | null` - validates and decodes
- [ ] Function `createUser(email, password, plan): Promise<User>` - creates in DB
- [ ] Function `getUserByEmail(email): Promise<User | null>` - fetches from DB
- [ ] Function `incrementUsage(userId): Promise<void>` - increments discoveryCount
- [ ] Function `checkRateLimit(userId): Promise<RateLimitStatus>` - check limits

**New File: `backend/src/middleware/auth.ts`**
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT } from '../services/auth';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyJWT(token);

  if (!decoded) {
    reply.status(401).send({ success: false, error: 'Invalid or expired token' });
    return;
  }

  // Attach user info to request
  (request as any).user = decoded;
}

export async function checkRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) {
    reply.status(401).send({ success: false, error: 'User not authenticated' });
    return;
  }

  const status = await getRateLimitStatus(user.userId);
  if (status.remaining <= 0) {
    reply.status(429).send({
      success: false,
      error: 'Rate limit exceeded',
      limit: status.limit,
      resetsAt: status.resetsAt
    });
    return;
  }
}
```

**New File: `backend/src/routes/auth.ts`**
- [ ] POST `/api/auth/register` - Create new user account
  - Body: `{ email, password, plan? }`
  - Validation: Email format, password min 8 chars
  - Return: `{ success: true, token: string, user: User }`

- [ ] POST `/api/auth/login` - Login existing user
  - Body: `{ email, password }`
  - Verify password hash
  - Return: `{ success: true, token: string, user: User }`

- [ ] GET `/api/auth/me` - Get current user info (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Return: `{ success: true, user: User, rateLimit: RateLimitStatus }`

- [ ] POST `/api/auth/logout` - Invalidate token (optional, JWT is stateless)
  - Return: `{ success: true }`

**Update File: `backend/src/routes/contacts.ts`**
- [ ] Add `requireAuth` middleware to `/discover` route
- [ ] Add `checkRateLimit` middleware to `/discover` route
- [ ] Call `incrementUsage(userId)` after successful discovery
- [ ] Associate discovery jobId with userId in storage

**Update File: `backend/src/index.ts`**
- [ ] Register auth routes: `server.register(authRoutes, { prefix: '/api/auth' })`
- [ ] Add JWT_SECRET to environment variables

**Database Schema (Postgres)**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  discovery_limit INTEGER DEFAULT 10,
  discovery_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_reset_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Migration script to add userId to discovery jobs (extend existing table)
ALTER TABLE discovery_jobs ADD COLUMN user_id UUID REFERENCES users(id);
```

**Environment Variables (.env.example)**
```bash
# Add to existing .env.example
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_EXPIRY=7d
```

#### Frontend Changes

**New File: `frontend/src/contexts/AuthContext.tsx`**
```typescript
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  plan: string;
  discoveryLimit: number;
  discoveryCount: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, plan?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load token from localStorage on mount
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(authToken);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Login failed');

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);
  };

  const register = async (email: string, password: string, plan = 'free') => {
    const res = await fetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, plan })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Registration failed');

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Update File: `frontend/src/app/layout.tsx`**
- [ ] Wrap children with `<AuthProvider>`

**New File: `frontend/src/app/login/page.tsx`**
- [ ] Login form with email/password fields
- [ ] Call `login()` from AuthContext
- [ ] Show errors for invalid credentials
- [ ] Link to `/register` page
- [ ] Redirect to `/start` on success

**New File: `frontend/src/app/register/page.tsx`**
- [ ] Registration form with email/password/confirm fields
- [ ] Password strength indicator
- [ ] Plan selector (Free/Starter/Pro)
- [ ] Call `register()` from AuthContext
- [ ] Show errors for duplicate email
- [ ] Redirect to `/start` on success

**Update File: `frontend/src/app/start/page.tsx`**
- [ ] Check `useAuth()` - redirect to `/login` if not authenticated
- [ ] Display user's discovery limit: "X/Y discoveries used this month"
- [ ] Show warning if near limit

**Update File: `frontend/src/app/contacts/page.tsx`**
- [ ] Include `Authorization: Bearer <token>` header in all API calls
- [ ] Handle 401 errors → redirect to `/login`
- [ ] Handle 429 errors → show "Rate limit exceeded" modal

**New Component: `frontend/src/components/UsageWidget.tsx`**
```typescript
'use client';
import { useAuth } from '@/contexts/AuthContext';

export function UsageWidget() {
  const { user } = useAuth();
  if (!user) return null;

  const percentage = (user.discoveryCount / user.discoveryLimit) * 100;
  const remaining = user.discoveryLimit - user.discoveryCount;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Discoveries</span>
        <span className="text-sm text-gray-500">
          {user.discoveryCount} / {user.discoveryLimit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${percentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {remaining} discoveries remaining this month
      </p>
    </div>
  );
}
```

### Testing Requirements

1. **Test Case 1: Registration Flow**
   - Register new user with `test@example.com`
   - Verify JWT token returned
   - Verify user stored in Postgres
   - Verify password is hashed (not plaintext)

2. **Test Case 2: Login Flow**
   - Login with registered user
   - Verify JWT token matches user
   - Verify token expires after 7 days
   - Verify invalid password rejected

3. **Test Case 3: Rate Limiting**
   - Register free user (10 discoveries/month)
   - Run 10 discoveries
   - Attempt 11th discovery → expect 429 error
   - Verify error message shows reset date

4. **Test Case 4: Protected Routes**
   - Call `/api/contacts/discover` without token → 401
   - Call with valid token → 200
   - Call with expired token → 401

### Expected Output

**API Response Example (Register):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@example.com",
    "plan": "free",
    "discoveryLimit": 10,
    "discoveryCount": 0,
    "createdAt": "2025-09-30T12:00:00Z"
  }
}
```

**API Response Example (Rate Limit):**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "limit": 10,
  "used": 10,
  "remaining": 0,
  "resetsAt": "2025-10-01T00:00:00Z"
}
```

---

## 📋 Task 9: Email Sequence Scheduling

### Context
Currently, users can generate drafts but must manually send them. We need automated multi-touch sequences:
- Opener → wait 3 days → Follow-up 1 → wait 3 days → Follow-up 2
- Users schedule sequences, system sends at intervals
- Track delivery, opens, replies

### Your Mission
Build a scheduled email sequence system with delivery tracking.

### Implementation Checklist

#### Backend Changes

**New File: `backend/src/types/sequence.ts`**
```typescript
export interface EmailSequence {
  id: string;
  userId: string;
  contactId: string;
  name: string; // e.g., "Stripe Outreach Sequence"
  emails: SequenceEmail[];
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'stopped';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface SequenceEmail {
  id: string;
  sequenceId: string;
  stepNumber: 1 | 2 | 3; // opener, follow-up 1, follow-up 2
  subject: string;
  bodyText: string;
  delayDays: number; // 0 for opener, 3 for follow-ups
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  repliedAt?: string;
  status: 'pending' | 'scheduled' | 'sent' | 'delivered' | 'opened' | 'replied' | 'failed';
  errorMessage?: string;
}

export interface SequenceStats {
  total: number;
  active: number;
  completed: number;
  sentEmails: number;
  deliveredEmails: number;
  openedEmails: number;
  repliedEmails: number;
  openRate: number;
  replyRate: number;
}
```

**New File: `backend/src/services/sequencer.ts`**
- [ ] Function `createSequence(userId, contactId, drafts, tone): Promise<EmailSequence>`
  - Creates sequence with 3 emails (opener, +3d, +6d)
  - Status: 'scheduled'
  - Calculates scheduledAt timestamps

- [ ] Function `startSequence(sequenceId): Promise<void>`
  - Sets status to 'active'
  - Triggers first email send
  - Schedules follow-ups via BullMQ delayed jobs

- [ ] Function `pauseSequence(sequenceId): Promise<void>`
  - Sets status to 'paused'
  - Cancels pending BullMQ jobs

- [ ] Function `stopSequence(sequenceId, reason): Promise<void>`
  - Sets status to 'stopped'
  - Reason: 'user_requested' | 'replied' | 'bounced'

- [ ] Function `sendSequenceEmail(emailId): Promise<void>`
  - Mock SMTP send (log to console for now)
  - Update email status to 'sent'
  - Schedule next email in sequence if not last

**New File: `backend/src/services/emailSender.ts`**
```typescript
// Mock email sender (replace with real SMTP later)
export async function sendEmail(params: {
  to: string;
  from: string;
  subject: string;
  bodyText: string;
  listUnsubscribe: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // For MVP, just log to console
  console.log('[MOCK EMAIL SEND]', {
    to: params.to,
    from: params.from,
    subject: params.subject,
    preview: params.bodyText.substring(0, 100) + '...',
    listUnsubscribe: params.listUnsubscribe
  });

  // Simulate 95% success rate
  const success = Math.random() > 0.05;

  if (success) {
    return {
      success: true,
      messageId: `<${Date.now()}@signalrunner.com>`
    };
  } else {
    return {
      success: false,
      error: 'Mock failure: Simulated bounce'
    };
  }
}
```

**Update File: `backend/src/config/jobs.ts`**
- [ ] Add new queue: `sequence-email`
- [ ] Job payload: `{ emailId: string }`
- [ ] Function `addSequenceEmailJob(emailId, delayMs): Promise<Job>`

**New File: `backend/src/workers/sequence.ts`**
```typescript
import { sequenceEmailQueue } from '../config/jobs';
import { sendSequenceEmail } from '../services/sequencer';

sequenceEmailQueue.process(async (job) => {
  const { emailId } = job.data;

  console.log(`[Sequence Worker] Processing email ${emailId}`);

  try {
    await sendSequenceEmail(emailId);
    console.log(`[Sequence Worker] Email ${emailId} sent successfully`);
  } catch (err) {
    console.error(`[Sequence Worker] Email ${emailId} failed:`, err);
    throw err; // BullMQ will retry
  }
});
```

**Update File: `backend/src/workers/index.ts`**
- [ ] Import and register sequence worker

**New File: `backend/src/routes/sequences.ts`**
- [ ] POST `/api/sequences/create` - Create sequence from drafts
  - Body: `{ contactId, drafts: { opener, followUp1, followUp2 }, tone, fromEmail }`
  - Requires auth
  - Return: `{ success: true, sequence: EmailSequence }`

- [ ] POST `/api/sequences/:id/start` - Start scheduled sequence
  - Requires auth + ownership check
  - Return: `{ success: true, sequence: EmailSequence }`

- [ ] POST `/api/sequences/:id/pause` - Pause active sequence
  - Requires auth + ownership check
  - Return: `{ success: true, sequence: EmailSequence }`

- [ ] POST `/api/sequences/:id/stop` - Stop sequence permanently
  - Requires auth + ownership check
  - Return: `{ success: true, sequence: EmailSequence }`

- [ ] GET `/api/sequences` - List user's sequences
  - Query params: `?status=active` (optional filter)
  - Requires auth
  - Return: `{ success: true, sequences: EmailSequence[], stats: SequenceStats }`

- [ ] GET `/api/sequences/:id` - Get sequence details
  - Includes all emails with status
  - Requires auth + ownership check
  - Return: `{ success: true, sequence: EmailSequence }`

**Update File: `backend/src/index.ts`**
- [ ] Register sequences routes: `server.register(sequencesRoutes, { prefix: '/api/sequences' })`

**Database Schema (Postgres)**
```sql
CREATE TABLE sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  contact_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE sequence_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_text TEXT NOT NULL,
  delay_days INTEGER NOT NULL,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  replied_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT
);

CREATE INDEX idx_sequences_user ON sequences(user_id);
CREATE INDEX idx_sequences_status ON sequences(status);
CREATE INDEX idx_sequence_emails_sequence ON sequence_emails(sequence_id);
CREATE INDEX idx_sequence_emails_scheduled ON sequence_emails(scheduled_at);
```

#### Frontend Changes

**New File: `frontend/src/app/sequences/page.tsx`**
- [ ] List all user's sequences in table
- [ ] Columns: Contact, Name, Status, Sent/Delivered/Opened/Replied, Actions
- [ ] Filter by status (Active/Paused/Completed)
- [ ] Action buttons: Start/Pause/Stop
- [ ] Click row → navigate to `/sequences/:id`

**New File: `frontend/src/app/sequences/[id]/page.tsx`**
- [ ] Show sequence timeline with 3 emails
- [ ] Visual progress indicator (step 1 → 2 → 3)
- [ ] Each email shows:
  - Subject line
  - Preview of body text
  - Status badge (Pending/Scheduled/Sent/Delivered/Opened/Replied)
  - Timestamp (scheduled, sent, opened)
- [ ] Action buttons: Start/Pause/Stop based on current status

**Update File: `frontend/src/app/contacts/page.tsx`**
- [ ] After generating drafts, add "Schedule Sequence" button
- [ ] Modal to configure:
  - From email address
  - Sequence name
  - Preview 3-email timeline
  - Delay between emails (default 3 days)
- [ ] Call `/api/sequences/create` on submit
- [ ] Show success → link to `/sequences/:id`

**New Component: `frontend/src/components/SequenceTimeline.tsx`**
```typescript
export function SequenceTimeline({ sequence }: { sequence: EmailSequence }) {
  return (
    <div className="space-y-8">
      {sequence.emails.map((email, idx) => (
        <div key={email.id} className="flex gap-4">
          {/* Step indicator */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              email.status === 'sent' ? 'bg-green-500' :
              email.status === 'scheduled' ? 'bg-blue-500' :
              'bg-gray-300'
            } text-white font-semibold`}>
              {idx + 1}
            </div>
            {idx < sequence.emails.length - 1 && (
              <div className="w-0.5 h-16 bg-gray-300 my-2" />
            )}
          </div>

          {/* Email details */}
          <div className="flex-1 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{email.subject}</h3>
              <span className={`px-2 py-1 text-xs rounded ${
                email.status === 'sent' ? 'bg-green-100 text-green-800' :
                email.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {email.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {email.bodyText.substring(0, 150)}...
            </p>
            <div className="text-xs text-gray-500">
              {email.scheduledAt && `Scheduled: ${new Date(email.scheduledAt).toLocaleString()}`}
              {email.sentAt && ` • Sent: ${new Date(email.sentAt).toLocaleString()}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Testing Requirements

1. **Test Case 1: Create Sequence**
   - Generate drafts for a contact
   - Create sequence with 3 emails
   - Verify scheduledAt timestamps: now, +3d, +6d
   - Verify sequence stored in Postgres

2. **Test Case 2: Send Sequence**
   - Start sequence
   - Verify opener sent immediately (mock logged)
   - Verify BullMQ job scheduled for follow-up 1 (+3 days)
   - Verify BullMQ job scheduled for follow-up 2 (+6 days)

3. **Test Case 3: Pause/Resume**
   - Start sequence
   - Pause after opener sent
   - Verify pending jobs cancelled
   - Resume → verify jobs rescheduled

4. **Test Case 4: Auto-Stop on Reply**
   - Start sequence
   - Simulate reply received (manual DB update for testing)
   - Verify sequence auto-stopped
   - Verify remaining emails cancelled

### Expected Output

**API Response Example (Create Sequence):**
```json
{
  "success": true,
  "sequence": {
    "id": "seq-123",
    "userId": "user-456",
    "contactId": "drew.lee@stripe.com:2",
    "name": "Stripe Outreach - Drew Lee",
    "status": "scheduled",
    "emails": [
      {
        "id": "email-1",
        "stepNumber": 1,
        "subject": "Quick idea for Stripe",
        "bodyText": "Hi Drew, noticed activity...",
        "delayDays": 0,
        "scheduledAt": "2025-09-30T18:00:00Z",
        "status": "pending"
      },
      {
        "id": "email-2",
        "stepNumber": 2,
        "subject": "Following up on my message",
        "bodyText": "Hi Drew, just following up...",
        "delayDays": 3,
        "scheduledAt": "2025-10-03T18:00:00Z",
        "status": "pending"
      },
      {
        "id": "email-3",
        "stepNumber": 3,
        "subject": "Final note about Stripe",
        "bodyText": "Hi Drew, one last note...",
        "delayDays": 6,
        "scheduledAt": "2025-10-06T18:00:00Z",
        "status": "pending"
      }
    ],
    "createdAt": "2025-09-30T18:00:00Z"
  }
}
```

---

## 🚨 Important Notes for Codex

### Code Quality Standards
1. **TypeScript everywhere** - No `any` types, use proper interfaces
2. **Error handling** - Wrap all async operations in try-catch
3. **Validation** - Use Fastify schema validation on all routes
4. **Security** - Hash passwords with bcrypt (min cost factor 10)
5. **Logging** - Use `fastify.log.info/error` for all operations

### Testing Protocol
1. Run TypeScript compilation: `cd backend && npx tsc --noEmit`
2. Test auth flow with curl:
   ```bash
   # Register
   curl -X POST http://localhost:8000/api/auth/register \
     -H 'Content-Type: application/json' \
     -d '{"email":"test@example.com","password":"password123"}'

   # Login
   curl -X POST http://localhost:8000/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"test@example.com","password":"password123"}'

   # Create sequence (use token from login)
   curl -X POST http://localhost:8000/api/sequences/create \
     -H 'Authorization: Bearer <token>' \
     -H 'Content-Type: application/json' \
     -d '{"contactId":"c1","drafts":{...},"tone":"direct","fromEmail":"me@example.com"}'
   ```
3. Check frontend compiles: `cd frontend && npm run build`
4. Verify end-to-end: Register → Login → Discover → Schedule sequence

### Git Workflow
1. Complete Task 8 first, commit separately
2. Then complete Task 9, commit separately
3. Commit message format:
   ```
   feat: Complete Task 8 - Authentication & Rate Limiting

   Backend:
   • [bullet points of changes]

   Frontend:
   • [bullet points of changes]

   Testing:
   • [what you tested]

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

### When You're Stuck
- Check existing services for patterns (e.g., `contactDiscovery.ts`)
- Look at types in `backend/src/types/` for interfaces
- Grep for similar functionality: `grep -r "verifyPassword" backend/src`
- **ASK** if you need clarification on requirements

---

## 📊 Success Criteria

### Task 8 Complete When:
- [ ] Users can register with email/password
- [ ] JWT tokens generated and validated correctly
- [ ] Rate limits enforced (free users: 10 discoveries/month)
- [ ] Protected routes require authentication
- [ ] Frontend shows login/register pages
- [ ] Usage widget displays remaining discoveries
- [ ] TypeScript compiles cleanly
- [ ] Manual testing passes (register → login → discover with limit)

### Task 9 Complete When:
- [ ] Users can create 3-email sequences from drafts
- [ ] Sequences schedule with correct delays (0d, +3d, +6d)
- [ ] Opener sends immediately on start
- [ ] Follow-ups send after delays (via BullMQ)
- [ ] Pause/resume works correctly
- [ ] Frontend shows sequence list + timeline
- [ ] Mock email sender logs to console
- [ ] TypeScript compiles cleanly
- [ ] Manual testing passes (create → start → verify logs)

---

**Good luck, Codex! Claude Code will review and fix any issues after you're done.**
