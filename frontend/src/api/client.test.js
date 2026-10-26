import { fetchProperties, fetchPropertyDetail } from "./client";

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

const listPayload = { total: 1, limit: 20, offset: 0, results: [{ L_ListingID: "123" }] };

test("fetches the list using a relative API URL", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => listPayload });
  await expect(fetchProperties()).resolves.toEqual(listPayload);
  expect(fetch).toHaveBeenCalledWith("/api/properties", { signal: undefined });
});

test("encodes search parameters, keeps offset zero, and passes the abort signal", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => listPayload });
  const controller = new AbortController();
  await fetchProperties({ city: "Beverly Hills", limit: 20, offset: 0, beds: undefined, zipcode: "" }, { signal: controller.signal });
  expect(fetch).toHaveBeenCalledWith("/api/properties?city=Beverly+Hills&limit=20&offset=0", { signal: controller.signal });
});

test("fetches property detail with an encoded listing ID", async () => {
  const property = { L_ListingID: "123" };
  fetch.mockResolvedValue({ ok: true, json: async () => property });
  await expect(fetchPropertyDetail("123")).resolves.toEqual(property);
  expect(fetch).toHaveBeenCalledWith("/api/properties/123", { signal: undefined });
});

test("combines all six filters and trims text before encoding the URL", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => listPayload });
  await fetchProperties({ city: "  Beverly Hills  ", zipcode: " 09261 ", minPrice: "300000", maxPrice: "1500000", beds: "3", baths: "2.5", limit: 20, offset: 0 });
  const url = new URL(fetch.mock.calls[0][0], "http://localhost");
  expect(Object.fromEntries(url.searchParams)).toEqual({ city: "Beverly Hills", zipcode: "09261", minPrice: "300000", maxPrice: "1500000", beds: "3", baths: "2.5", limit: "20", offset: "0" });
});

test("omits empty, whitespace-only, null, and undefined filter values", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => listPayload });
  await fetchProperties({ city: " \t ", zipcode: "", minPrice: null, maxPrice: undefined, beds: " ", baths: "\n", limit: 20, offset: 0 });
  expect(fetch).toHaveBeenCalledWith("/api/properties?limit=20&offset=0", { signal: undefined });
});

test("preserves both numeric and string zero values", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => listPayload });
  await fetchProperties({ minPrice: 0, maxPrice: " 0 ", beds: "0", baths: 0, offset: 0 });
  expect(fetch).toHaveBeenCalledWith("/api/properties?minPrice=0&maxPrice=0&beds=0&baths=0&offset=0", { signal: undefined });
});

test("preserves the backend validation message for an invalid filter request", async () => {
  fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: '"minPrice" must be less than or equal to "maxPrice".' }) });
  await expect(fetchProperties({ minPrice: 900000, maxPrice: 300000 })).rejects.toThrow('"minPrice" must be less than or equal to "maxPrice". (HTTP 400)');
});

test("includes the backend message and HTTP status in errors", async () => {
  fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "Failed to search properties." }) });
  await expect(fetchProperties()).rejects.toThrow("Failed to search properties. (HTTP 500)");
});

test("handles a non-JSON development proxy error", async () => {
  fetch.mockResolvedValue({ ok: false, status: 504, json: async () => { throw new SyntaxError("HTML"); } });
  await expect(fetchProperties()).rejects.toThrow("Request failed (HTTP 504)");
});

test("handles network failure", async () => {
  fetch.mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(fetchProperties()).rejects.toThrow("Unable to reach the server");
});

test("preserves cancellation errors", async () => {
  const error = new DOMException("Aborted", "AbortError");
  fetch.mockRejectedValue(error);
  await expect(fetchProperties()).rejects.toBe(error);
});

test("rejects invalid JSON in a successful response", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError("Bad JSON"); } });
  await expect(fetchProperties()).rejects.toThrow("invalid response");
});

test.each([null, {}, { total: 1, results: null }, { total: "1", results: [] }])("rejects an invalid list response: %p", async (payload) => {
  fetch.mockResolvedValue({ ok: true, json: async () => payload });
  await expect(fetchProperties()).rejects.toThrow("invalid property list");
});
