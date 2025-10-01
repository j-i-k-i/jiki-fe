# Authentication System

## Overview

The Jiki frontend implements JWT-based authentication to securely communicate with the Rails API backend. The system uses Bearer tokens in Authorization headers and provides a complete authentication flow including login, signup, logout, and password reset.

## Architecture

The authentication system consists of several layers:

1. **Token Storage** (`/lib/auth/storage.ts`) - Secure client-side JWT storage
2. **API Client** (`/lib/api/client.ts`) - Automatic token attachment to requests
3. **Auth Service** (`/lib/auth/service.ts`) - API endpoint integration
4. **Auth Store** (`/stores/authStore.ts`) - Global state management with Zustand
5. **Type Definitions** (`/types/auth.ts`) - TypeScript interfaces

## Token Management

### Storage Strategy

Tokens are stored in `sessionStorage` for security:

- Cleared when browser tab closes
- Not accessible across tabs (prevents CSRF)
- Not persisted to disk

For cross-tab persistence, change to `localStorage` in `/lib/auth/storage.ts`.

### Token Flow

1. User logs in → API returns JWT in Authorization header
2. Frontend extracts token and stores it securely
3. All subsequent API calls include token automatically
4. On 401 response, token is cleared and user redirected to login

## Usage

### Authentication Actions

```typescript
import { useAuthStore } from "@/stores/authStore";

function LoginComponent() {
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
      // Redirect on success
      router.push("/dashboard");
    } catch (error) {
      // Error is also available in store.error
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
      <button disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

### Protected Routes

```typescript
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### Using Auth State

```typescript
import { useAuthStore } from "@/stores/authStore";

export function UserMenu() {
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Link href="/auth/login">Login</Link>;
  }

  return (
    <div>
      <span>Welcome, {user?.name || user?.email}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## API Endpoints

The auth service integrates with these Rails API endpoints:

- **POST /v1/auth/login** - User login
  - Body: `{ user: { email, password } }`
  - Returns: User data + JWT in Authorization header

- **POST /v1/auth/signup** - User registration
  - Body: `{ user: { email, password, password_confirmation, name? } }`
  - Returns: User data + JWT in Authorization header

- **DELETE /v1/auth/logout** - User logout
  - Headers: Authorization token
  - Effect: Revokes JWT on server

- **POST /v1/auth/password** - Request password reset
  - Body: `{ user: { email } }`
  - Effect: Sends reset email

- **PATCH /v1/auth/password** - Complete password reset
  - Body: `{ user: { token, password, password_confirmation } }`
  - Effect: Updates password

## Store Actions

The `useAuthStore` provides these actions:

```typescript
interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login(credentials: LoginCredentials): Promise<void>;
  signup(userData: SignupData): Promise<void>;
  logout(): Promise<void>;
  checkAuth(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(data: PasswordReset): Promise<void>;
  clearError(): void;
}
```

## Security Considerations

### Token Security

- Tokens stored in sessionStorage (not localStorage)
- Automatically cleared on 401 responses
- Token expiry checked before use
- Bearer tokens in Authorization headers

### Best Practices

1. **Never log tokens** - Avoid console.log of sensitive data
2. **HTTPS only** in production - Tokens should only be sent over secure connections
3. **Token rotation** - Backend should rotate tokens periodically
4. **Logout everywhere** - Clear tokens on logout across all storage

### Error Handling

The system handles various error scenarios:

```typescript
try {
  await login(credentials);
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        // Invalid credentials
        break;
      case 422:
        // Validation errors
        break;
      case 429:
        // Rate limited
        break;
    }
  }
}
```

## Testing

### Mocking Auth Store

```typescript
import { useAuthStore } from "@/stores/authStore";

jest.mock("@/stores/authStore");

const mockAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

beforeEach(() => {
  mockAuthStore.mockReturnValue({
    user: { id: "1", email: "test@example.com", name: "Test User", created_at: "2024-01-01" },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn()
    // ... other methods
  });
});
```

### Testing Protected Routes

```typescript
import { render, screen } from "@testing-library/react";
import { useAuthStore } from "@/stores/authStore";

test("redirects when not authenticated", () => {
  useAuthStore.setState({ isAuthenticated: false });

  render(<ProtectedRoute>Protected Content</ProtectedRoute>);

  expect(mockRouter.push).toHaveBeenCalledWith("/auth/login");
});
```

## Environment Configuration

Required environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:3061
NEXT_PUBLIC_API_VERSION=v1
```

## Implementation Checklist

### Phase 1: Core Infrastructure ✅

- [x] Token storage utilities
- [x] API client with JWT support
- [x] Auth service layer
- [x] Zustand auth store
- [x] TypeScript types
- [x] Environment configuration

### Phase 2: UI Components (To Do)

- [ ] Login form component
- [ ] Signup form component
- [ ] Password reset forms
- [ ] Protected route wrapper
- [ ] User menu component

### Phase 3: Pages (To Do)

- [ ] /auth/login page
- [ ] /auth/signup page
- [ ] /auth/forgot-password page
- [ ] /auth/reset-password page

### Phase 4: Integration (To Do)

- [ ] Middleware for route protection
- [ ] Auto-refresh token logic
- [ ] Session persistence
- [ ] Logout across tabs

## Common Patterns

### Auto-login on App Start

```typescript
// app/layout.tsx
import { useAuthStore } from "@/stores/authStore";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth(); // Check if user has valid token on app load
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Form with Validation

```typescript
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { login, isLoading, error } = useAuthStore();

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (error) {
      // Handle API errors
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Troubleshooting

### Token Not Being Sent

- Check sessionStorage has token: `sessionStorage.getItem("jiki_auth_token")`
- Verify API client imports: `import { api } from "@/lib/api"`
- Ensure using the api client, not raw fetch

### 401 Errors After Login

- Token might be expired - check expiry
- API version mismatch - verify NEXT_PUBLIC_API_VERSION
- CORS issues - check backend CORS settings

### State Not Persisting

- Using sessionStorage (closes with tab)
- For persistence, modify `/lib/auth/storage.ts` to use localStorage
- Check Zustand persist middleware configuration

## Related Documentation

- [API Client](./api.md) - HTTP client configuration
- [Architecture](./architecture.md) - Overall frontend architecture
- [Testing](./testing.md) - Testing patterns
