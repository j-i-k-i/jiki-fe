import { interpret, compile, jikiscript } from "interpreters";

describe("interpreters package import", () => {
  it("should successfully import interpret function", () => {
    expect(typeof interpret).toBe("function");
  });

  it("should successfully import compile function", () => {
    expect(typeof compile).toBe("function");
  });

  it("should be able to call interpret without errors", () => {
    // Just test that calling the function doesn't throw
    // The result may vary based on the code syntax
    expect(() => {
      interpret('print("Hello")');
    }).not.toThrow();
  });

  it("should be able to call compile without errors", () => {
    // Just test that calling the function doesn't throw
    expect(() => {
      compile('print("Hello")');
    }).not.toThrow();
  });

  it("should export jikiscript namespace", () => {
    expect(jikiscript).toBeDefined();
    expect(typeof jikiscript.interpret).toBe("function");
    expect(typeof jikiscript.compile).toBe("function");
  });
});
