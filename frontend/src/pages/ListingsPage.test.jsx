import { act, fireEvent, render as renderUI, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StrictMode } from "react";
import { fetchProperties } from "../api/client";
import ListingsPage from "./ListingsPage";

function render(ui) {
  return renderUI(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>);
}

jest.mock("../api/client");
jest.mock("../components/PropertyCard", () => function MockPropertyCard({ property }) {
  return <article><h3>{property.L_Address}</h3></article>;
});

beforeEach(() => {
  fetchProperties.mockReset();
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const payload = {
  total: 487,
  limit: 20,
  offset: 0,
  results: [{ id: 1, L_ListingID: "123", L_Address: "123 Main Street", L_SystemPrice: 850000 }],
};

test("shows loading until the request finishes, then shows actual count and cards", async () => {
  let resolveRequest;
  fetchProperties.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
  render(<ListingsPage />);
  expect(screen.getByText("Loading properties...")).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Property pagination" })).not.toBeInTheDocument();
  expect(fetchProperties).toHaveBeenCalledWith({ limit: 20, offset: 0 }, { signal: expect.any(AbortSignal) });
  await act(async () => resolveRequest(payload));
  expect(screen.getByRole("heading", { name: "123 Main Street" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Showing 1–1 of 487 properties");
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(screen.queryByText("Loading properties...")).not.toBeInTheDocument();
});

test("shows a useful empty result state", async () => {
  fetchProperties.mockResolvedValue({ total: 0, results: [] });
  render(<ListingsPage />);
  expect(await screen.findByText("No properties found")).toBeInTheDocument();
  expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 0–0 of 0 properties");
  expect(screen.queryByRole("navigation", { name: "Property pagination" })).not.toBeInTheDocument();
  expect(screen.getByText("Try adjusting your filters or clearing them to see more properties.")).toBeInTheDocument();
});

const emptyFilters = { city: "", zipcode: "", minPrice: "", maxPrice: "", beds: "", baths: "" };

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function searchCity(city) {
  fireEvent.change(screen.getByLabelText("City"), { target: { value: city } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
}

test("submits all six filters only after Search and replaces the list and count", async () => {
  const filtered = { total: 2, results: [{ id: 2, L_Address: "Filtered home" }] };
  fetchProperties.mockResolvedValueOnce(payload).mockResolvedValueOnce(filtered);
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "123 Main Street" });
  const values = { City: "Irvine", "ZIP Code": "09261", "Min Price": "300000", "Max Price": "1500000", Beds: "3", Baths: "2.5" };
  Object.entries(values).forEach(([label, value]) => fireEvent.change(screen.getByLabelText(label), { target: { value } }));
  expect(fetchProperties).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(fetchProperties).toHaveBeenLastCalledWith({ city: "Irvine", zipcode: "09261", minPrice: "300000", maxPrice: "1500000", beds: "3", baths: "2.5", limit: 20, offset: 0 }, { signal: expect.any(AbortSignal) });
  await screen.findByRole("heading", { name: "Filtered home" });
  expect(screen.queryByRole("heading", { name: "123 Main Street" })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Showing 1–1 of 2 properties");
});

test("clears the form and reloads the unfiltered first page even when already empty", async () => {
  fetchProperties.mockResolvedValue(payload);
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "123 Main Street" });
  searchCity("Irvine");
  await screen.findByRole("heading", { name: "123 Main Street" });
  fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
  expect(screen.getByLabelText("City")).toHaveValue("");
  expect(fetchProperties).toHaveBeenLastCalledWith({ limit: 20, offset: 0 }, { signal: expect.any(AbortSignal) });
  await screen.findByRole("heading", { name: "123 Main Street" });
  fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
  await screen.findByRole("heading", { name: "123 Main Street" });
  expect(fetchProperties).toHaveBeenCalledTimes(4);
});

test("searches again when the same filters are submitted repeatedly", async () => {
  fetchProperties.mockResolvedValue(payload);
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "123 Main Street" });
  searchCity("Irvine");
  await screen.findByRole("heading", { name: "123 Main Street" });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await screen.findByRole("heading", { name: "123 Main Street" });
  expect(fetchProperties).toHaveBeenCalledTimes(3);
});

test("retries the last submitted filters even after the user edits the draft", async () => {
  fetchProperties.mockResolvedValueOnce(payload).mockRejectedValueOnce(new Error("Search unavailable")).mockResolvedValueOnce(payload);
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "123 Main Street" });
  searchCity("Irvine");
  expect(await screen.findByRole("alert")).toHaveTextContent("Search unavailable");
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "Pasadena" } });
  fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
  expect(fetchProperties).toHaveBeenLastCalledWith({ ...emptyFilters, city: "Irvine", limit: 20, offset: 0 }, { signal: expect.any(AbortSignal) });
  await screen.findByRole("heading", { name: "123 Main Street" });
});

test.each([
  ["success", "before"], ["error", "before"], ["success", "after"], ["error", "after"],
])("ignores stale %s and loading updates when old requests finish %s the latest search", async (outcome, timing) => {
  const oldSearch = deferred();
  const clearSearch = deferred();
  const latestSearch = deferred();
  fetchProperties.mockResolvedValueOnce(payload)
    .mockReturnValueOnce(oldSearch.promise)
    .mockReturnValueOnce(clearSearch.promise)
    .mockReturnValueOnce(latestSearch.promise);
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "123 Main Street" });
  searchCity("Irvine");
  const oldSignal = fetchProperties.mock.calls[1][1].signal;
  fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
  const clearSignal = fetchProperties.mock.calls[2][1].signal;
  searchCity("Pasadena");
  expect(oldSignal.aborted).toBe(true);
  expect(clearSignal.aborted).toBe(true);
  expect(fetchProperties).toHaveBeenLastCalledWith({ ...emptyFilters, city: "Pasadena", limit: 20, offset: 0 }, { signal: expect.any(AbortSignal) });
  expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Clear Filters" })).toBeEnabled();

  async function settleOldRequests() {
    await act(async () => {
      if (outcome === "success") {
        oldSearch.resolve({ total: 999, results: [{ id: 9, L_Address: "Outdated home" }] });
        clearSearch.resolve(payload);
      } else {
        oldSearch.reject(new Error("Outdated search error"));
        clearSearch.reject(new Error("Outdated clear error"));
      }
    });
  }

  if (timing === "before") {
    await settleOldRequests();
    expect(screen.getByText("Loading properties...")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Outdated home" })).not.toBeInTheDocument();
  }
  await act(async () => latestSearch.resolve({ total: 7, results: [{ id: 3, L_Address: "Latest Pasadena home" }] }));
  if (timing === "after") {
    await settleOldRequests();
  }
  expect(screen.getByRole("heading", { name: "Latest Pasadena home" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Showing 1–1 of 7 properties");
  expect(screen.queryByRole("heading", { name: "Outdated home" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "123 Main Street" })).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByText("Loading properties...")).not.toBeInTheDocument();
});

test("ignores a late initial request during React StrictMode effect replay", async () => {
  const firstMount = deferred();
  fetchProperties.mockReturnValueOnce(firstMount.promise).mockResolvedValueOnce(payload);
  render(<StrictMode><ListingsPage /></StrictMode>);
  await screen.findByRole("heading", { name: "123 Main Street" });
  expect(fetchProperties.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => firstMount.resolve({ total: 999, results: [{ id: 9, L_Address: "Old initial home" }] }));
  expect(screen.getByRole("heading", { name: "123 Main Street" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Old initial home" })).not.toBeInTheDocument();
});

test("displays an API error and allows retrying successfully", async () => {
  fetchProperties.mockRejectedValueOnce(new Error("Unable to reach the server."));
  fetchProperties.mockResolvedValueOnce(payload);
  render(<ListingsPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to reach the server.");
  fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
  expect(await screen.findByRole("heading", { name: "123 Main Street" })).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(fetchProperties).toHaveBeenCalledTimes(2);
});

test("aborts the request when the page unmounts", async () => {
  fetchProperties.mockImplementation((_params, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  }));
  const { unmount } = render(<ListingsPage />);
  const signal = fetchProperties.mock.calls[0][1].signal;
  unmount();
  await waitFor(() => expect(signal.aborted).toBe(true));
});

function pagePayload(page, total = 487) {
  const offset = (page - 1) * 20;
  return {
    total,
    limit: 20,
    offset,
    results: Array.from({ length: Math.min(20, Math.max(0, total - offset)) }, (_, index) => ({
      id: offset + index + 1,
      L_Address: `Home ${offset + index + 1}`,
    })),
  };
}

test("navigates with Next, Previous, and page numbers and counts a partial last page", async () => {
  fetchProperties.mockImplementation(({ offset }) => Promise.resolve(pagePayload(offset / 20 + 1)));
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "Home 1", exact: true });
  expect(screen.getByRole("status")).toHaveTextContent("Showing 1–20 of 487 properties");
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

  for (const [button, page, first, last] of [["Next", 2, 21, 40], ["Previous", 1, 1, 20], ["Page 5", 5, 81, 100], ["Page 25", 25, 481, 487]]) {
    fireEvent.click(screen.getByRole("button", { name: button, exact: true }));
    expect(fetchProperties).toHaveBeenLastCalledWith({ limit: 20, offset: (page - 1) * 20 }, { signal: expect.any(AbortSignal) });
    expect(screen.queryByRole("navigation", { name: "Property pagination" })).not.toBeInTheDocument();
    await screen.findByRole("heading", { name: `Home ${first}`, exact: true });
    expect(screen.getByRole("status")).toHaveTextContent(`Showing ${first}–${last} of 487 properties`);
    expect(screen.getByRole("button", { name: `Page ${page}`, current: "page" })).toBeInTheDocument();
  }

  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  expect(window.scrollTo.mock.calls).toEqual([[0, 0], [0, 0], [0, 0], [0, 0]]);
});

test.each([1, 20])("hides pagination when all %s results fit on one page", async (total) => {
  fetchProperties.mockResolvedValue(pagePayload(1, total));
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "Home 1", exact: true });
  expect(screen.getByRole("status")).toHaveTextContent(`Showing 1–${total} of ${total} properties`);
  expect(screen.queryByRole("navigation", { name: "Property pagination" })).not.toBeInTheDocument();
});

test("does not fetch or scroll when the current page or disabled Previous is clicked", async () => {
  fetchProperties.mockResolvedValue(pagePayload(1));
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "Home 1", exact: true });
  fireEvent.click(screen.getByRole("button", { name: "Page 1", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  expect(fetchProperties).toHaveBeenCalledTimes(1);
  expect(window.scrollTo).not.toHaveBeenCalled();
});

test("preserves all submitted filters on the next page while ignoring draft edits", async () => {
  fetchProperties.mockImplementation(({ offset }) => Promise.resolve(pagePayload(offset / 20 + 1, 60)));
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "Home 1", exact: true });
  const filters = { city: "Irvine", zipcode: "09261", minPrice: "300000", maxPrice: "1500000", beds: "3", baths: "2.5" };
  const labels = { city: "City", zipcode: "ZIP Code", minPrice: "Min Price", maxPrice: "Max Price", beds: "Beds", baths: "Baths" };
  Object.entries(filters).forEach(([key, value]) => fireEvent.change(screen.getByLabelText(labels[key]), { target: { value } }));
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await screen.findByRole("heading", { name: "Home 1", exact: true });
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "Pasadena" } });
  expect(fetchProperties).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(fetchProperties).toHaveBeenLastCalledWith({ ...filters, limit: 20, offset: 20 }, { signal: expect.any(AbortSignal) });
  await screen.findByRole("heading", { name: "Home 21", exact: true });
  expect(screen.getByLabelText("City")).toHaveValue("Pasadena");
  expect(screen.getByRole("status")).toHaveTextContent("Showing 21–40 of 60 properties");
});

test.each(["Search", "Clear Filters"])("%s resets a filtered later page to page one", async (action) => {
  fetchProperties.mockImplementation(({ offset, city }) => Promise.resolve(pagePayload(offset / 20 + 1, city ? 60 : 487)));
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "Home 1", exact: true });
  searchCity("Irvine");
  await screen.findByRole("heading", { name: "Home 1", exact: true });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByRole("heading", { name: "Home 21", exact: true });
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "Pasadena" } });
  fireEvent.click(screen.getByRole("button", { name: action }));
  const filters = action === "Search" ? { ...emptyFilters, city: "Pasadena" } : {};
  expect(fetchProperties).toHaveBeenLastCalledWith({ ...filters, limit: 20, offset: 0 }, { signal: expect.any(AbortSignal) });
  await screen.findByRole("heading", { name: "Home 1", exact: true });
  expect(screen.getByRole("button", { name: "Page 1", current: "page" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(`Showing 1–20 of ${action === "Search" ? 60 : 487} properties`);
  expect(screen.getByLabelText("City")).toHaveValue(action === "Search" ? "Pasadena" : "");
  expect(window.scrollTo.mock.calls).toEqual([[0, 0], [0, 0]]);
});

test("retries the failed page with its submitted filters and hides stale pagination and counts", async () => {
  const retry = deferred();
  fetchProperties.mockResolvedValueOnce(pagePayload(1))
    .mockResolvedValueOnce(pagePayload(1, 60))
    .mockRejectedValueOnce(new Error("Page unavailable"))
    .mockReturnValueOnce(retry.promise);
  render(<ListingsPage />);
  await screen.findByRole("heading", { name: "Home 1", exact: true });
  searchCity("Irvine");
  await screen.findByRole("heading", { name: "Home 1", exact: true });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Page unavailable");
  expect(screen.queryByRole("navigation", { name: "Property pagination" })).not.toBeInTheDocument();
  expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "Pasadena" } });
  fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
  expect(fetchProperties).toHaveBeenLastCalledWith({ ...emptyFilters, city: "Irvine", limit: 20, offset: 20 }, { signal: expect.any(AbortSignal) });
  expect(screen.getByText("Loading properties...")).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Property pagination" })).not.toBeInTheDocument();
  await act(async () => retry.resolve(pagePayload(2, 60)));
  expect(screen.getByRole("status")).toHaveTextContent("Showing 21–40 of 60 properties");
  expect(screen.getByRole("button", { name: "Page 2", current: "page" })).toBeInTheDocument();
  expect(window.scrollTo).toHaveBeenCalledTimes(1);
});

test.each([["success", "before"], ["error", "before"], ["success", "after"], ["error", "after"]])(
  "ignores an old page request's %s %s a new filter search completes",
  async (outcome, timing) => {
    const oldPage = deferred();
    const newSearch = deferred();
    fetchProperties.mockResolvedValueOnce(pagePayload(1))
      .mockReturnValueOnce(oldPage.promise)
      .mockReturnValueOnce(newSearch.promise);
    render(<ListingsPage />);
    await screen.findByRole("heading", { name: "Home 1", exact: true });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    const oldSignal = fetchProperties.mock.calls[1][1].signal;
    searchCity("Irvine");
    expect(oldSignal.aborted).toBe(true);
    expect(fetchProperties).toHaveBeenLastCalledWith({ ...emptyFilters, city: "Irvine", limit: 20, offset: 0 }, { signal: expect.any(AbortSignal) });

    async function settleOldPage() {
      await act(async () => {
        if (outcome === "success") {
          oldPage.resolve(pagePayload(2));
        } else {
          oldPage.reject(new Error("Outdated page error"));
        }
      });
    }

    if (timing === "before") {
      await settleOldPage();
      expect(screen.getByText("Loading properties...")).toBeInTheDocument();
      expect(screen.queryByRole("navigation", { name: "Property pagination" })).not.toBeInTheDocument();
    }
    await act(async () => newSearch.resolve(pagePayload(1, 3)));
    if (timing === "after") {
      await settleOldPage();
    }
    expect(screen.getByRole("status")).toHaveTextContent("Showing 1–3 of 3 properties");
    expect(screen.queryByRole("heading", { name: "Home 21", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Property pagination" })).not.toBeInTheDocument();
  },
);
