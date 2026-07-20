const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  is_active: boolean;
  is_verified: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

class ApiClient {
  private getHeaders(authRequired = true): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authRequired) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async post<T>(path: string, body: unknown, authRequired = true): Promise<T> {
    const headers = this.getHeaders(authRequired) as Record<string, string>;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    
    if (isFormData) {
      delete headers["Content-Type"];
    }

    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: headers,
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Something went wrong");
    }

    return response.json() as Promise<T>;
  }

  async get<T>(path: string, authRequired = true): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: "GET",
      headers: this.getHeaders(authRequired),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Something went wrong");
    }

    return response.json() as Promise<T>;
  }
}

export const api = new ApiClient();
