import { GoogleAuth } from "google-auth-library";

/**
 * Get ID token for authenticating with Cloud Run services.
 * 
 * This function generates an ID token using the service account credentials
 * stored in the GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.
 * 
 * The ID token is required when calling Cloud Run services that have
 * "Require authentication" enabled.
 * 
 * @param targetAudience - The URL of the Cloud Run service (e.g., https://service-xxx.run.app)
 * @returns ID token string to be used in Authorization header
 * 
 * @example
 * ```typescript
 * const token = await getCloudRunIdToken("https://ml-service.run.app");
 * 
 * fetch("https://ml-service.run.app/score", {
 *   headers: {
 *     "Authorization": `Bearer ${token}`
 *   }
 * });
 * ```
 */
export async function getCloudRunIdToken(
  targetAudience: string
): Promise<string> {
  // Check if running locally (development)
  if (
    process.env.NODE_ENV === "development" &&
    targetAudience.includes("localhost")
  ) {
    // No authentication needed for localhost
    return "";
  }

  // Load service account credentials from environment variable
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!credentials) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not found. " +
        "Please add your service account JSON to environment variables."
    );
  }

  try {
    // Parse credentials JSON
    const credentialsObj = JSON.parse(credentials);

    // Create GoogleAuth client with service account
    const auth = new GoogleAuth({
      credentials: credentialsObj,
    });

    // Get ID token client for the target audience (Cloud Run URL)
    const client = await auth.getIdTokenClient(targetAudience);

    // Fetch ID token
    const idToken = await client.idTokenProvider.fetchIdToken(targetAudience);

    return idToken;
  } catch (error) {
    console.error("Error getting Cloud Run ID token:", error);
    throw new Error(
      `Failed to generate Cloud Run authentication token: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get headers with authentication for Cloud Run requests.
 * 
 * Convenience function that returns headers object with Authorization token
 * and Content-Type already set.
 * 
 * @param targetAudience - The URL of the Cloud Run service
 * @param contentType - Content-Type header value (default: "application/json")
 * @returns Headers object with Authorization and Content-Type
 * 
 * @example
 * ```typescript
 * const headers = await getCloudRunHeaders("https://ml-service.run.app");
 * 
 * fetch("https://ml-service.run.app/score", {
 *   method: "POST",
 *   headers,
 *   body: JSON.stringify(data)
 * });
 * ```
 */
export async function getCloudRunHeaders(
  targetAudience: string,
  contentType: string = "application/json"
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };

  // Add Authorization header if not localhost
  if (
    !(
      process.env.NODE_ENV === "development" &&
      targetAudience.includes("localhost")
    )
  ) {
    const idToken = await getCloudRunIdToken(targetAudience);
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  return headers;
}
