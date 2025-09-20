import { describeError } from "@/components/complex-exercise/ui/codemirror/extensions/end-line-information/describeError";
import type { StaticError } from "@/components/complex-exercise/lib/stubs";
import { marked } from "marked";

// Mock marked module
jest.mock("marked", () => ({
  marked: {
    parse: jest.fn((text: string) => `<p>${text}</p>`),
    setOptions: jest.fn(),
    use: jest.fn(),
    Renderer: jest.fn().mockImplementation(() => ({
      code: null
    }))
  }
}));

describe("describeError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("error heading generation", () => {
    it("should display syntax error heading for SyntaxError type", () => {
      const error: StaticError = {
        type: "SyntaxError",
        message: "Unexpected token"
      };

      const result = describeError(error, "jikiscript");

      expect(result).toContain("<h2>Jiki couldn't understand your code</h2>");
    });

    it("should display syntax error heading with 'We' for javascript", () => {
      const error: StaticError = {
        type: "SyntaxError",
        message: "Unexpected token"
      };

      const result = describeError(error, "javascript");

      expect(result).toContain("<h2>We couldn't understand your code</h2>");
    });

    it("should display logic error heading for LogicError type", () => {
      const error: StaticError = {
        type: "LogicError",
        message: "Division by zero"
      };

      const result = describeError(error, "jikiscript");

      expect(result).toContain("<h2>Something didn't go as expected!</h2>");
    });

    it("should display generic error heading for other error types", () => {
      const error: StaticError = {
        type: "RuntimeError",
        message: "Variable not defined"
      };

      const result = describeError(error, "jikiscript");

      expect(result).toContain("<h2>Jiki hit a problem running your code.</h2>");
    });

    it("should display generic error heading with 'We' for javascript", () => {
      const error: StaticError = {
        type: "RuntimeError",
        message: "Variable not defined"
      };

      const result = describeError(error, "javascript");

      expect(result).toContain("<h2>We hit a problem running your code.</h2>");
    });

    it("should prepend context to error heading when provided", () => {
      const error: StaticError = {
        type: "SyntaxError",
        message: "Unexpected token"
      };

      const result = describeError(error, "jikiscript", "Test 1");

      expect(result).toContain("<h2>Test 1: Jiki couldn't understand your code</h2>");
    });
  });

  describe("marked integration", () => {
    it("should parse error message with marked", () => {
      const error: StaticError = {
        type: "SyntaxError",
        message: "This is **bold** text"
      };

      describeError(error, "jikiscript");

      expect(marked.parse).toHaveBeenCalledWith("This is **bold** text");
    });

    it("should configure marked with custom renderer for code blocks", () => {
      const error: StaticError = {
        type: "SyntaxError",
        message: "Some error"
      };

      describeError(error, "jikiscript");

      expect(marked.setOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          renderer: expect.any(Object)
        })
      );
    });
  });

  describe("HTML structure", () => {
    it("should wrap parsed message in content div", () => {
      const error: StaticError = {
        type: "SyntaxError",
        message: "Error message"
      };
      (marked.parse as jest.Mock).mockReturnValue("<p>Parsed message</p>");

      const result = describeError(error, "jikiscript");

      expect(result).toContain('<div class="content"><p>Parsed message</p>');
      expect(result).toContain("</div>");
    });

    it("should return complete HTML structure", () => {
      const error: StaticError = {
        type: "RuntimeError",
        message: "Test error"
      };
      (marked.parse as jest.Mock).mockReturnValue("<p>Test error</p>");

      const result = describeError(error, "jikiscript");

      expect(result).toMatch(/<h2>.*<\/h2>/);
      expect(result).toMatch(/<div class="content">.*<\/div>/);
    });
  });

  describe("edge cases", () => {
    it("should handle empty error message", () => {
      const error: StaticError = {
        type: "SyntaxError",
        message: ""
      };

      const result = describeError(error, "jikiscript");

      expect(result).toBeDefined();
      expect(marked.parse).toHaveBeenCalledWith("");
    });

    it("should handle error with unknown type", () => {
      const error: StaticError = {
        type: "UnknownError",
        message: "Something went wrong"
      };

      const result = describeError(error, "jikiscript");

      expect(result).toContain("<h2>Jiki hit a problem running your code.</h2>");
    });
  });

  describe("regression tests", () => {
    it("should not use instanceof SyntaxError (would always be false)", () => {
      // This test ensures we're checking error.type === "SyntaxError"
      // not error instanceof SyntaxError which would never work
      // since error is a StaticError type, not a JavaScript Error
      const error: StaticError = {
        type: "SyntaxError",
        message: "Syntax issue"
      };

      const result = describeError(error, "jikiscript");

      // If the check was using instanceof, this would show the generic error
      expect(result).toContain("couldn't understand your code");
      expect(result).not.toContain("hit a problem running your code");
    });
  });
});
