"use server";

interface ReceiptScanResponse {
  success: boolean;
  data?: {
    items: Array<{ name: string; qty: string; price: string }>;
    subtotal: string;
    tax: string;
    service_charge: string;
    total: string;
  };
  error?: string;
}

export async function scanReceipt(
  formData: FormData
): Promise<ReceiptScanResponse> {
  try {
    const apiUrl = process.env.HF_API_URL;
    const apiToken = process.env.HF_API_TOKEN;

    console.log("[Server Action] Scanning receipt...");
    console.log("[Server Action] API URL configured:", !!apiUrl);
    console.log("[Server Action] API Token configured:", !!apiToken);

    if (!apiUrl || !apiToken) {
      console.error("[Server Action] Missing environment variables");
      return {
        success: false,
        error: "API configuration missing. Please check environment variables and restart the server.",
      };
    }

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      console.error("[Server Action] No valid file in formData");
      return {
        success: false,
        error: "No file provided or invalid file format",
      };
    }

    console.log("[Server Action] File received:", file.name, file.type, file.size);

    // Create a new FormData for the backend request
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    console.log("[Server Action] Sending request to:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: backendFormData,
      // Add timeout and other fetch options
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    console.log("[Server Action] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Server Action] Backend error:", response.status, errorText);
      
      // Provide more user-friendly error messages
      if (response.status === 503) {
        return {
          success: false,
          error: "AI service is currently sleeping or unavailable. Please try again in a moment.",
        };
      }
      
      return {
        success: false,
        error: `Service error (${response.status}). The AI model may be loading. Please wait a moment and try again.`,
      };
    }

    const result = await response.json();
    console.log("[Server Action] Response data:", result);

    if (result.status === "success" && result.data) {
      console.log("[Server Action] Scan successful!");
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: result.error || "Unknown error from backend",
    };
  } catch (err) {
    console.error("[Server Action] Exception caught:", err);
    
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    
    // Provide specific error messages for common issues
    if (errorMessage.includes("fetch failed")) {
      return {
        success: false,
        error: "Network error: Unable to reach AI service. Please check your internet connection and try again.",
      };
    }
    
    if (errorMessage.includes("timeout") || errorMessage.includes("aborted")) {
      return {
        success: false,
        error: "Request timeout: The AI model is taking too long to respond. Please try with a smaller image or try again later.",
      };
    }
    
    return {
      success: false,
      error: `Error: ${errorMessage}`,
    };
  }
}   