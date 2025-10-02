"use client";

import { api } from "@/lib/api";
import { getToken } from "@/lib/auth/storage";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";

export default function TestApiInspectPage() {
  const { isAuthenticated } = useAuthStore();
  const [levelsData, setLevelsData] = useState<any>(null);
  const [userLevelsData, setUserLevelsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    const token = getToken();
    if (!token) {
      setError("No token found. Please login first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch /levels
      console.debug("Fetching /levels...");
      const levelsResponse = await api.get("/levels");
      console.debug("Raw /levels response:", levelsResponse);
      setLevelsData(levelsResponse.data);

      // Fetch /user_levels
      console.debug("Fetching /user_levels...");
      const userLevelsResponse = await api.get("/user_levels");
      console.debug("Raw /user_levels response:", userLevelsResponse);
      setUserLevelsData(userLevelsResponse.data);
    } catch (err: any) {
      console.error("Error fetching endpoints:", err);
      setError(err.message || "Failed to fetch endpoints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void fetchEndpoints();
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Endpoint Inspector</h1>

        <div className="mb-4 flex gap-4">
          <button
            onClick={fetchEndpoints}
            disabled={loading || !isAuthenticated}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Fetching..." : "Fetch Endpoints"}
          </button>
          {!isAuthenticated && <p className="text-red-600">Please login first to fetch endpoints</p>}
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">Error: {error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* /levels endpoint */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">/levels Response</h2>
            <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {levelsData ? JSON.stringify(levelsData, null, 2) : "No data yet"}
              </pre>
            </div>
            {levelsData && (
              <div className="mt-4 text-sm">
                <p className="font-medium">Structure Analysis:</p>
                <ul className="mt-2 space-y-1">
                  <li>Type: {Array.isArray(levelsData) ? "Array" : typeof levelsData}</li>
                  {Array.isArray(levelsData) && <li>Length: {levelsData.length}</li>}
                  {typeof levelsData === "object" && !Array.isArray(levelsData) && (
                    <li>Keys: {Object.keys(levelsData).join(", ")}</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* /user_levels endpoint */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">/user_levels Response</h2>
            <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {userLevelsData ? JSON.stringify(userLevelsData, null, 2) : "No data yet"}
              </pre>
            </div>
            {userLevelsData && (
              <div className="mt-4 text-sm">
                <p className="font-medium">Structure Analysis:</p>
                <ul className="mt-2 space-y-1">
                  <li>Type: {Array.isArray(userLevelsData) ? "Array" : typeof userLevelsData}</li>
                  {Array.isArray(userLevelsData) && <li>Length: {userLevelsData.length}</li>}
                  {typeof userLevelsData === "object" && !Array.isArray(userLevelsData) && (
                    <li>Keys: {Object.keys(userLevelsData).join(", ")}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* TypeScript Types Preview */}
        {(levelsData || userLevelsData) && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Generated TypeScript Types (Preview)</h2>
            <pre className="bg-gray-50 rounded p-4 text-xs font-mono overflow-x-auto">
              {`// Based on the actual API responses:

${
  levelsData
    ? `// /levels endpoint
${
  Array.isArray(levelsData)
    ? levelsData.length > 0
      ? `interface Level {
${Object.entries(levelsData[0])
  .map(
    ([key, value]) =>
      `  ${key}: ${
        typeof value === "object" && value !== null ? (Array.isArray(value) ? "string[]" : "unknown") : typeof value
      };`
  )
  .join("\n")}
}`
      : "interface Level {}"
    : `// Response is not an array but: ${typeof levelsData}`
}`
    : ""
}

${
  userLevelsData
    ? `
// /user_levels endpoint
${
  Array.isArray(userLevelsData)
    ? userLevelsData.length > 0
      ? `interface UserLevel {
${Object.entries(userLevelsData[0])
  .map(
    ([key, value]) =>
      `  ${key}: ${
        typeof value === "object" && value !== null
          ? Array.isArray(value)
            ? "string[]"
            : "unknown"
          : typeof value === "string" && value.includes("T") && value.includes(":")
            ? "string // datetime"
            : typeof value
      };`
  )
  .join("\n")}
}`
      : "interface UserLevel {}"
    : typeof userLevelsData === "object" && userLevelsData !== null
      ? `// Response is an object with keys: ${Object.keys(userLevelsData).join(", ")}
interface UserLevelsResponse {
${Object.entries(userLevelsData)
  .map(([key, value]) => `  ${key}: ${Array.isArray(value) ? "UserLevel[]" : typeof value};`)
  .join("\n")}
}`
      : `// Response is not an array but: ${typeof userLevelsData}`
}`
    : ""
}`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
