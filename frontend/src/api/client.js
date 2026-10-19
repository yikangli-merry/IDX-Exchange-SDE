async function requestJSON(path, { signal } = {}) {
  let response;

  try {
    response = await fetch(path, { signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new Error("Unable to reach the server. Please check your connection and try again.");
  }

  if (!response.ok) {
    let message = "Request failed";

    try {
      const body = await response.json();
      if (typeof body.error === "string" && body.error.trim()) {
        message = body.error;
      }
    } catch {
      // A development proxy can return an HTML or empty error response.
    }

    throw new Error(`${message} (HTTP ${response.status})`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }
}

export async function fetchProperties(params = {}, options = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(name, String(value));
    }
  });

  const queryString = query.toString();
  const payload = await requestJSON(`/api/properties${queryString ? `?${queryString}` : ""}`, options);

  if (!payload || !Array.isArray(payload.results) || !Number.isFinite(payload.total) || payload.total < 0) {
    throw new Error("The server returned an invalid property list. Please try again.");
  }

  return payload;
}

export function fetchPropertyDetail(id, options = {}) {
  return requestJSON(`/api/properties/${encodeURIComponent(id)}`, options);
}
