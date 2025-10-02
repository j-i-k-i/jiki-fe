import { render, screen, waitFor } from "@testing-library/react";
import { useAuthStore } from "@/stores/authStore";
import Dashboard from "@/app/dashboard/page";

// Mock Next.js router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: "/dashboard",
      query: {},
      asPath: "/dashboard"
    };
  }
}));

// Mock the auth store
jest.mock("@/stores/authStore");

// Mock the levels API
jest.mock("@/lib/api/levels", () => ({
  fetchLevelsWithProgress: jest.fn().mockResolvedValue([
    {
      slug: "getting-started",
      status: "in_progress",
      lessons: [
        { id: "1", title: "Introduction", status: "completed" },
        { id: "2", title: "Variables", status: "in_progress" }
      ],
      userProgress: {
        user_lessons: [
          { id: "1", status: "completed" },
          { id: "2", status: "in_progress" }
        ]
      }
    }
  ])
}));

describe("Dashboard Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it("redirects to login when not authenticated", async () => {
    const mockCheckAuth = jest.fn().mockResolvedValue(undefined);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      checkAuth: mockCheckAuth
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("renders dashboard when authenticated", async () => {
    const mockCheckAuth = jest.fn().mockResolvedValue(undefined);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      checkAuth: mockCheckAuth
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });

  it("displays the navigation sidebar", async () => {
    const mockCheckAuth = jest.fn().mockResolvedValue(undefined);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      checkAuth: mockCheckAuth
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jiki Learn")).toBeInTheDocument();
      expect(screen.getByText("Exercises")).toBeInTheDocument();
    });
  });

  it("displays loading state while fetching levels", () => {
    const mockCheckAuth = jest.fn().mockResolvedValue(undefined);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      checkAuth: mockCheckAuth
    });

    render(<Dashboard />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
