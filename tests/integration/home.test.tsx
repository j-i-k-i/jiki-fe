import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/"
    };
  }
}));

describe("Home Page", () => {
  it("renders without crashing", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("displays the navigation sidebar", () => {
    render(<Home />);
    expect(screen.getByText("Jiki Learn")).toBeInTheDocument();
    expect(screen.getByText("Exercises")).toBeInTheDocument();
  });

  it("displays exercise path", () => {
    render(<Home />);
    expect(screen.getByText("Getting Started with Python")).toBeInTheDocument();
  });
});
