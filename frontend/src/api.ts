import type { Garment } from "./types/Garment";

// While developing locally, this points at your Express server directly.
// We'll change this to an environment variable once we deploy.
const API_BASE_URL = "http://localhost:3001";

export async function createGarment(
  name: string,
  size: string | null,
  description: string | null,
  files: File[],
  password: string,
): Promise<void> {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("size", size || "");
  formData.append("description", description || "");
  formData.append("password", password);

  // Append each file with the field name "photos" (backend expects this)
  files.forEach((file) => {
    formData.append("photos", file);
  });

  const response = await fetch(`${API_BASE_URL}/api/garments`, {
    method: "POST",
    headers: {},
    body: formData,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Garment creation failed.");
  }
}

export async function verifyAdminPassword(password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/garments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Password verification failed.");
  }
}

export async function getGarments(): Promise<Garment[]> {
  const response = await fetch(`${API_BASE_URL}/api/garments`);
  if (!response.ok) {
    throw new Error("Failed to fetch garments.");
  }
  return response.json();
}

export async function claimGarment(
  id: number,
  claimantName: string,
  claimToken: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/garments/${id}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claimantName, claimToken }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to claim garment.");
  }
}

export async function unclaimGarment(
  id: number,
  claimantName: string,
  claimToken: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/garments/${id}/unclaim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claimantName, claimToken }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to unclaim garment.");
  }
}
