# JWT Authentication Implementation Plan - Frontend

## Overview

This plan details the implementation of JWT authentication in the Jiki frontend to integrate with the Rails API's Devise + JWT authentication system.

## API Endpoints Reference

- **POST /v1/auth/signup** - User registration
- **POST /v1/auth/login** - User login (returns JWT in Authorization header)
- **DELETE /v1/auth/logout** - User logout (revokes JWT)
- **POST /v1/auth/password** - Request password reset
- **PATCH /v1/auth/password** - Complete password reset

## Phase 1: Core Infrastructure Setup

### 1.1 Environment Configuration

- [ ] Add API URL environment variables to `.env.local`
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3061
  NEXT_PUBLIC_API_VERSION=v1
  ```
- [ ] Create `.env.production` with production API URL
- [ ] Update `.env.example` with required variables

### 1.2 HTTP Client Setup

- [ ] Create `/utils/api/client.ts` - Axios/Fetch wrapper with:
  - [ ] Automatic JWT token attachment from storage
  - [ ] Response interceptors for 401 handling
  - [ ] Request/response error handling
  - [ ] Automatic token refresh logic (if implemented)
- [ ] Create `/utils/api/endpoints.ts` - API endpoint constants
- [ ] Add type definitions in `/types/api.ts`

### 1.3 Token Storage Strategy

- [ ] Create `/utils/auth/storage.ts` for secure token management
  - [ ] Use httpOnly cookies for SSR compatibility (preferred)
  - [ ] Or use sessionStorage for SPA-only approach
  - [ ] Implement token getter/setter/remover functions
  - [ ] Add token expiry checking utilities

## Phase 2: Authentication State Management

### 2.1 Zustand Store Setup

- [ ] Create `/stores/authStore.ts` with:

  ```typescript
  interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginCredentials) => Promise<void>;
    signup: (userData: SignupData) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
  }
  ```

- [ ] Implement persistence middleware for auth state
- [ ] Add devtools integration for debugging

### 2.2 User Types

- [ ] Create `/types/auth.ts` with:

  ```typescript
  interface User {
    id: string;
    email: string;
    name: string | null;
    created_at: string;
  }

  interface LoginCredentials {
    email: string;
    password: string;
  }

  interface SignupData {
    email: string;
    password: string;
    password_confirmation: string;
    name?: string;
  }

  interface ApiError {
    error: {
      type: string;
      message: string;
      errors?: Record<string, string[]>;
    };
  }
  ```

## Phase 3: Authentication Services

### 3.1 Auth Service Layer

- [ ] Create `/services/auth.service.ts` with:
  - [ ] `login(credentials)` - POST to /v1/auth/login
  - [ ] `signup(userData)` - POST to /v1/auth/signup
  - [ ] `logout()` - DELETE to /v1/auth/logout
  - [ ] `requestPasswordReset(email)` - POST to /v1/auth/password
  - [ ] `resetPassword(token, password)` - PATCH to /v1/auth/password
  - [ ] `validateToken()` - Check token validity
  - [ ] Extract and store JWT from Authorization header

### 3.2 Error Handling

- [ ] Create `/utils/auth/errors.ts` for:
  - [ ] Parsing API error responses
  - [ ] User-friendly error messages
  - [ ] Form validation error mapping
  - [ ] Network error handling

## Phase 4: UI Components

### 4.1 Authentication Forms

- [ ] Create `/components/auth/LoginForm.tsx`
  - [ ] Email/password fields with validation
  - [ ] Remember me checkbox (optional)
  - [ ] Submit with loading state
  - [ ] Error display
  - [ ] Link to signup and forgot password

- [ ] Create `/components/auth/SignupForm.tsx`
  - [ ] Email, password, password confirmation fields
  - [ ] Name field (optional)
  - [ ] Terms acceptance checkbox
  - [ ] Submit with loading state
  - [ ] Validation error display
  - [ ] Link to login

- [ ] Create `/components/auth/ForgotPasswordForm.tsx`
  - [ ] Email field
  - [ ] Success message display
  - [ ] Link back to login

- [ ] Create `/components/auth/ResetPasswordForm.tsx`
  - [ ] Password and confirmation fields
  - [ ] Token from URL params
  - [ ] Success redirect to login

### 4.2 Protected Route Components

- [ ] Create `/components/auth/ProtectedRoute.tsx`
  - [ ] Check authentication status
  - [ ] Redirect to login if not authenticated
  - [ ] Show loading state during auth check
  - [ ] Optional role-based access control

- [ ] Create `/components/auth/AuthGuard.tsx`
  - [ ] Wrapper component for auth checks
  - [ ] Handle token refresh
  - [ ] Redirect logic

### 4.3 User Menu Component

- [ ] Create `/components/auth/UserMenu.tsx`
  - [ ] Display user name/email
  - [ ] Logout button
  - [ ] Link to profile/settings
  - [ ] Dropdown or slide-out menu

## Phase 5: Next.js Integration

### 5.1 App Router Pages

- [ ] Create `/app/auth/login/page.tsx`
- [ ] Create `/app/auth/signup/page.tsx`
- [ ] Create `/app/auth/forgot-password/page.tsx`
- [ ] Create `/app/auth/reset-password/page.tsx`
- [ ] Create `/app/auth/layout.tsx` - Shared auth layout

### 5.2 Middleware Setup

- [ ] Update `/middleware.ts` to:
  - [ ] Check JWT on protected routes
  - [ ] Redirect unauthenticated users
  - [ ] Handle token refresh
  - [ ] Set security headers

### 5.3 Root Layout Integration

- [ ] Update `/app/layout.tsx` to:
  - [ ] Initialize auth check on app load
  - [ ] Provide auth context/store
  - [ ] Handle global auth state

## Phase 6: SSR/SSG Considerations

### 6.1 Server Components

- [ ] Create server-side auth utilities
- [ ] Handle cookies in Server Components
- [ ] Implement auth checks in layouts

### 6.2 Client Components

- [ ] Add 'use client' directives where needed
- [ ] Handle hydration mismatches
- [ ] Implement loading states

## Phase 7: Integration with Existing Features

### 7.1 Exercise System Integration

- [ ] Update exercise submission to include auth token
- [ ] Protect exercise routes
- [ ] Track user progress with authenticated requests

### 7.2 API Integration Updates

- [ ] Update all API calls to include auth headers
- [ ] Handle 401 responses globally
- [ ] Implement retry logic with token refresh

### 7.3 Toast Notifications

- [ ] Add auth-specific toasts:
  - [ ] Login success
  - [ ] Logout success
  - [ ] Session expired
  - [ ] Password reset sent

## Phase 8: Testing

### 8.1 Unit Tests

- [ ] Test auth store actions
- [ ] Test token storage utilities
- [ ] Test API client interceptors
- [ ] Test error handling

### 8.2 Integration Tests

- [ ] Test login flow
- [ ] Test signup flow
- [ ] Test logout flow
- [ ] Test protected route access
- [ ] Test token expiry handling

### 8.3 E2E Tests

- [ ] Complete auth flow test
- [ ] Test persistence across page refreshes
- [ ] Test logout from multiple tabs
- [ ] Test password reset flow

## Phase 9: Security Considerations

### 9.1 Token Security

- [ ] Implement secure token storage (httpOnly cookies preferred)
- [ ] Add CSRF protection if using cookies
- [ ] Implement token rotation on sensitive operations
- [ ] Add rate limiting for auth endpoints

### 9.2 Form Security

- [ ] Add client-side validation
- [ ] Implement CAPTCHA for signup (optional)
- [ ] Sanitize all inputs
- [ ] Prevent timing attacks on login

### 9.3 Content Security

- [ ] Update CSP headers for auth endpoints
- [ ] Implement proper CORS handling
- [ ] Add security headers in middleware

## Phase 10: Error Handling & UX

### 10.1 Error States

- [ ] Network error handling
- [ ] Invalid credentials message
- [ ] Email already taken message
- [ ] Token expired handling
- [ ] Rate limit exceeded message

### 10.2 Loading States

- [ ] Form submission loading
- [ ] Initial auth check loading
- [ ] Route transition loading
- [ ] Token refresh loading

### 10.3 Success Feedback

- [ ] Login success redirect
- [ ] Signup success flow
- [ ] Password reset confirmation
- [ ] Logout confirmation

## Phase 11: Deployment Preparation

### 11.1 Environment Variables

- [ ] Set production API URL
- [ ] Configure CORS origins
- [ ] Set secure cookie settings
- [ ] Enable HTTPS-only in production

### 11.2 Build Optimization

- [ ] Tree-shake unused auth code
- [ ] Optimize bundle size
- [ ] Add auth monitoring
- [ ] Set up error tracking

## Phase 12: Documentation

### 12.1 Developer Documentation

- [ ] Document auth flow
- [ ] API integration guide
- [ ] Testing instructions
- [ ] Deployment guide

### 12.2 Context Files

- [ ] Create `.context/auth.md`
- [ ] Update architecture.md
- [ ] Add auth examples to coding-style.md

## Implementation Order

1. **Week 1**: Infrastructure (Phases 1-3)
   - Set up API client, token storage, auth store
   - Implement core auth services

2. **Week 2**: UI Components (Phase 4-5)
   - Build auth forms and pages
   - Implement protected routes

3. **Week 3**: Integration (Phases 6-7)
   - SSR/SSG handling
   - Integrate with existing features

4. **Week 4**: Testing & Security (Phases 8-9)
   - Comprehensive testing
   - Security hardening

5. **Week 5**: Polish & Deploy (Phases 10-12)
   - Error handling, UX improvements
   - Documentation and deployment

## Success Criteria

- [ ] Users can sign up with email/password
- [ ] Users can log in and receive JWT token
- [ ] Token persists across page refreshes
- [ ] Protected routes redirect unauthenticated users
- [ ] Users can log out and token is revoked
- [ ] Password reset flow works end-to-end
- [ ] All API calls include auth token
- [ ] 401 responses trigger re-authentication
- [ ] Tests achieve >80% coverage
- [ ] No security vulnerabilities in auth flow

## Notes

- Start with client-side only implementation, add SSR support later
- Use Zustand for state management (already in the project)
- Follow existing coding patterns from `.context/coding-style.md`
- Integrate with existing toast system for notifications
- Consider mobile-first design for auth forms
- API runs on port 3061, frontend on 3060
- JWT tokens expire after 30 days (configured in API)

## Testing Commands

### Local Development Testing

```bash
# Start frontend (port 3060)
pnpm dev

# Test login
curl -X POST http://localhost:3061/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"test@example.com","password":"password123"}}'

# Use the returned JWT in frontend requests
```

## References

- API Auth Documentation: `../api/.context/auth.md`
- API Routes: `../api/config/routes.rb`
- Frontend Architecture: `.context/architecture.md`
- Coding Style: `.context/coding-style.md`
- Testing Guide: `.context/testing.md`
