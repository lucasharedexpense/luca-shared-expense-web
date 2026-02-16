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

    if (!apiUrl || !apiToken) {
      return {
        success: false,
        error: "Missing environment variables: HF_API_URL or HF_API_TOKEN",
      };
    }

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return {
        success: false,
        error: "No file provided or invalid file format",
      };
    }

    // Create a new FormData for the backend request
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Backend returned ${response.status}: ${errorText}`,
      };
    }

    const result = await response.json();

    if (result.status === "success" && result.data) {
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
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return {
      success: false,
      error: errorMessage,
    };
  }
}   