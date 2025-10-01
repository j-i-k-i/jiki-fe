# Migration to Allowlist JWT Strategy

## Why We're Migrating

### Current Problem: JTIMatcher Strategy (Single Device Only)

Our current authentication system uses the **JTIMatcher** revocation strategy from devise-jwt, which has a critical limitation:

**Only ONE active session per user.**

#### How JTIMatcher Works:

1. User table has a single `jti` (JWT ID) column
2. When user logs in, a JWT token is issued containing that user's `jti`
3. When user logs in again (on another device), the `jti` column changes
4. The previous token becomes invalid because its `jti` no longer matches

#### The Problem:

```
Day 1: User logs in on Laptop → jti="laptop-abc"
  ✅ Laptop token works

Day 2: User logs in on Phone → jti changes to "phone-xyz"
  ❌ Laptop token now invalid (jti mismatch)
  ✅ Phone token works
```

This is unacceptable for a modern web application where users expect to stay logged in across multiple devices simultaneously.

---

## The Solution: Allowlist Strategy (Multi-Device)

### What is the Allowlist Strategy?

Instead of storing ONE `jti` per user, we store **ALL valid tokens** in a separate `user_jwt_tokens` table.

#### How Allowlist Works:

1. New table: `user_jwt_tokens` with columns: `user_id`, `jti`, `aud`, `exp`
2. When user logs in Device A, insert a row: `{user_id: 1, jti: "laptop-abc", exp: ...}`
3. When user logs in Device B, insert another row: `{user_id: 1, jti: "phone-xyz", exp: ...}`
4. Both tokens remain valid (both exist in the allowlist)
5. On logout from Device A, delete the "laptop-abc" row
6. Device B remains logged in

#### Multi-Device Flow:

```
Day 1: User logs in on Laptop
  → INSERT user_jwt_tokens (jti="laptop-abc")
  ✅ Laptop token works

Day 2: User logs in on Phone
  → INSERT user_jwt_tokens (jti="phone-xyz")
  ✅ Laptop token still works
  ✅ Phone token works

Day 3: User logs out from Laptop
  → DELETE user_jwt_tokens WHERE jti="laptop-abc"
  ❌ Laptop token invalid (not in allowlist)
  ✅ Phone token still works
```

---

## Current Implementation (Before Migration)

### Frontend (This Repo)

Our frontend implementation is in the `add-backend` branch:

#### Token Storage (`lib/auth/storage.ts`)

- JWT stored in `sessionStorage` (doesn't persist across browser restarts)
- Token key: `jiki_auth_token`
- Expiry tracked in: `jiki_auth_expiry`
- Functions: `setToken()`, `getToken()`, `removeToken()`, `hasValidToken()`

#### Authentication Service (`lib/auth/service.ts`)

- `login()`: POST to `/v1/auth/login`, extracts JWT from `Authorization` header
- `signup()`: POST to `/v1/auth/signup`, extracts JWT from `Authorization` header
- `logout()`: DELETE to `/v1/auth/logout`, clears local token
- Token extraction: Checks response headers first (`Authorization: Bearer <token>`)

#### Auth Store (`stores/authStore.ts`)

- Zustand store with user state and auth methods
- Persists `user` and `isAuthenticated` to localStorage
- Manages loading/error states
- Methods: `login()`, `signup()`, `logout()`, `checkAuth()`

#### API Client (`lib/api/client.ts`)

- Automatically adds `Authorization: Bearer <token>` header to all requests
- On 401 Unauthorized: Calls `removeToken()` to clear invalid token
- Generic request handler with type safety

#### Test Page (`app/test-auth-v2/page.tsx`)

- Interactive testing UI
- Test workflow: Signup → Login → Fetch protected resource → Logout
- Shows auth status, user data, token preview
- Direct fetch test for debugging

### Backend (API Repo)

Current implementation uses:

- **Strategy**: `JTIMatcher`
- **User model**: Single `jti` column in `users` table
- **Token dispatch**: On login/signup, JWT issued with user's `jti`
- **Token revocation**: On logout, user's `jti` is regenerated (invalidates all tokens)

---

## What Changes with Allowlist Migration

### Backend Changes (API Repo)

#### 1. Database Schema

**Remove**:

```ruby
# users table
t.string :jti, null: false  # ← DELETE this column
t.datetime :remember_created_at  # ← DELETE (unused with JWT)
```

**Add**:

```ruby
# New table: user_jwt_tokens
create_table :user_jwt_tokens do |t|
  t.references :user, null: false, foreign_key: true
  t.string :jti, null: false          # Unique per token (not per user)
  t.string :aud                       # Optional: device identifier
  t.datetime :exp, null: false        # Token expiration
  t.timestamps
end

add_index :user_jwt_tokens, :jti, unique: true
```

#### 2. User Model

**Before**:

```ruby
class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  before_create do
    self.jti = SecureRandom.uuid
  end
end
```

**After**:

```ruby
class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Allowlist

  devise :database_authenticatable, :registerable,
         :recoverable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  has_many :jwt_tokens, class_name: "User::JwtToken", dependent: :destroy
end
```

#### 3. New Model

```ruby
# app/models/user/jwt_token.rb
class User::JwtToken < ApplicationRecord
  self.table_name = "user_jwt_tokens"
  belongs_to :user

  # Optional: Add device info
  def device_name
    case aud
    when /iPhone/ then "iPhone"
    when /Android/ then "Android"
    when /Chrome/ then "Chrome Browser"
    else "Unknown Device"
    end
  end
end
```

#### 4. Devise Initializer Override

Need to patch `Devise::JWT::RevocationStrategies::Allowlist` to use `:jwt_tokens` instead of `:allowlisted_jwts`:

```ruby
# config/initializers/devise_jwt_allowlist_override.rb
module Devise
  module JWT
    module RevocationStrategies
      module Allowlist
        def self.included(base)
          base.class_eval do
            has_many :allowlisted_jwts, -> { order(exp: :desc) },
                     class_name: "#{base.name}::JwtToken",
                     foreign_key: :user_id,
                     dependent: :destroy

            # Make jwt_tokens an alias for allowlisted_jwts
            alias_method :jwt_tokens, :allowlisted_jwts unless method_defined?(:jwt_tokens)
          end
        end

        # ... rest of module methods unchanged
      end
    end
  end
end
```

### Frontend Changes

**✅ NO CHANGES NEEDED!**

The frontend implementation is completely unaware of the backend's revocation strategy. From the frontend's perspective:

1. Login → Receive JWT token in `Authorization` header → Store in sessionStorage
2. API requests → Send JWT in `Authorization: Bearer <token>` header
3. Logout → Send DELETE request → Clear sessionStorage

The fact that the backend now stores multiple valid tokens instead of one doesn't affect the frontend at all.

---

## Multi-Device Behavior After Migration

### Scenario 1: Multiple Browser Tabs (Same Device)

**Before (JTIMatcher)**:

- Open Tab 1 → Login → Works ✅
- Open Tab 2 → Login → Works ✅
- Tab 1's token is now invalid ❌ (jti changed)

**After (Allowlist)**:

- Open Tab 1 → Login → Works ✅ (token1 in allowlist)
- Open Tab 2 → Login → Works ✅ (token2 in allowlist)
- Both tabs work simultaneously ✅

### Scenario 2: Multiple Devices

**Before (JTIMatcher)**:

- Login on Laptop → Works ✅
- Login on Phone → Works ✅
- Laptop is logged out ❌ (jti changed)

**After (Allowlist)**:

- Login on Laptop → Works ✅ (token_laptop in allowlist)
- Login on Phone → Works ✅ (token_phone in allowlist)
- Both devices stay logged in ✅

### Scenario 3: Selective Logout

**Before (JTIMatcher)**:

- Can't log out just one device
- Logout → Changes jti → All tokens invalid

**After (Allowlist)**:

- Logout from Phone → DELETE token_phone from allowlist
- Laptop stays logged in ✅
- Future: "Log out all other devices" button

---

## Security Implications

### Allowlist vs Denylist vs JTIMatcher

| Feature                  | JTIMatcher                 | Denylist                      | Allowlist                        |
| ------------------------ | -------------------------- | ----------------------------- | -------------------------------- |
| **Multi-device support** | ❌ No                      | ✅ Yes                        | ✅ Yes                           |
| **What's stored**        | One jti per user           | Revoked tokens                | Valid tokens                     |
| **Default assumption**   | Token valid if jti matches | Token valid unless denylisted | Token invalid unless allowlisted |
| **Security posture**     | Medium                     | Optimistic (fail-open)        | Pessimistic (fail-secure)        |
| **Session visibility**   | ❌ No                      | ❌ No                         | ✅ Yes                           |
| **Selective logout**     | ❌ No                      | ✅ Yes                        | ✅ Yes                           |

### Why Allowlist > Denylist

**Security**:

- Allowlist is **fail-secure**: If the database query fails, all tokens are rejected
- Denylist is **fail-open**: If the database query fails, all tokens are accepted

**Visibility**:

- Allowlist lets you see active sessions: `user.jwt_tokens` → Shows all logged-in devices
- Denylist only shows revoked tokens, not active ones

**User Experience**:

- Future feature: "Your active sessions" page showing all logged-in devices
- Future feature: "Log out all other devices" button

---

## Testing Strategy

### Backend Tests (API Repo)

#### Test Coverage Needed:

1. **Multi-device login**
   - User logs in from Device A → jwt_token created
   - User logs in from Device B → 2nd jwt_token created
   - Both tokens remain valid

2. **Selective logout**
   - User logs out from Device A → That jwt_token deleted
   - Device B token still exists and works

3. **Token expiration**
   - Expired tokens are rejected
   - Cleanup job removes expired tokens from allowlist

4. **Edge cases**
   - User with 10+ devices (performance)
   - Concurrent login/logout (race conditions)
   - Database query failures (security)

### Frontend Testing (This Repo)

**Manual Testing with `test-auth-v2` Page**:

1. **Multi-tab test**:
   - Open `/test-auth-v2` in Tab 1
   - Login with test credentials
   - Open `/test-auth-v2` in Tab 2 (separate tab, not duplicate)
   - Login again with same credentials
   - Both tabs should fetch levels successfully

2. **Cross-device test** (if possible):
   - Login on Desktop browser
   - Login on Phone browser
   - Both should work simultaneously

3. **Logout test**:
   - Login in Tab 1
   - Login in Tab 2
   - Logout in Tab 1
   - Tab 2 should still fetch levels successfully

---

## Migration Steps (For Reference)

This is handled in the API repo, but for completeness:

### 1. Create migrations

```bash
# In api repo
bin/rails g migration RemoveRememberableFromUsers
bin/rails g migration CreateUserJwtTokens
bin/rails g migration RemoveJtiFromUsers
```

### 2. Update models

- Remove `:rememberable` from User
- Switch to `Allowlist` strategy
- Create `User::JwtToken` model

### 3. Create initializer

- Override Allowlist module to use `jwt_tokens` association

### 4. Run migrations

```bash
bin/rails db:migrate
bin/rails db:migrate RAILS_ENV=test
```

### 5. Update tests

- Modify existing auth tests
- Add multi-device test scenarios

### 6. Test with frontend

- Use `test-auth-v2` page
- Verify multi-tab login works

---

## Future Enhancements

Once Allowlist is implemented, we can add:

### 1. Active Sessions Management

```typescript
// New API endpoint
GET /v1/auth/sessions
→ Returns list of active devices with:
  - Device name (from aud header)
  - Last activity timestamp
  - "Revoke" button for each session
```

### 2. Device Identification

```typescript
// Frontend sends device info
headers: {
  'Authorization': `Bearer ${token}`,
  'X-Device-ID': navigator.userAgent  // Or custom device name
}

// Backend stores in aud column
user_jwt_tokens.aud = request.headers['X-Device-ID']
```

### 3. Security Features

- "Log out all other devices" button
- Email notifications on new device login
- Limit maximum concurrent sessions (e.g., 5 devices max)
- Auto-cleanup of expired tokens

### 4. Refresh Tokens (Future)

For even better security, implement short-lived access tokens (1 hour) + long-lived refresh tokens (30 days):

- Access token stored in memory (more secure)
- Refresh token in httpOnly cookie (XSS protection)
- Auto-refresh on expiration (seamless UX)

---

## Summary

### What's Changing

- ✅ Backend strategy: JTIMatcher → Allowlist
- ✅ Database: Single `jti` column → `user_jwt_tokens` table
- ✅ Multi-device support enabled
- ❌ Frontend: No changes needed!

### Why It Matters

- Users can stay logged in on multiple devices
- Better security (fail-secure vs fail-open)
- Foundation for session management features
- Better user experience

### Breaking Changes

- **None!** Existing tokens will be invalidated after migration (users need to log in again), but that's it.
- Frontend code requires zero changes
- API endpoints remain the same

---

## Questions?

If you need to understand more about:

- JWT structure and validation → See `lib/auth/storage.ts` function `parseJwtPayload()`
- How tokens are sent to API → See `lib/api/client.ts` request handler
- Current login flow → See `lib/auth/service.ts` and test it on `/test-auth-v2`
- Backend implementation → Check API repo's `.context/auth.md`
