import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fetchProperties } from "../api/client";
import ListingsPage from "./ListingsPage";

jest.mock("../api/client");

beforeEach(() => {
  fetchProperties.mockReset();
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
  expect(fetchProperties).toHaveBeenCalledWith({ limit: 20, offset: 0 }, { signal: expect.any(AbortSignal) });
  await act(async () => resolveRequest(payload));
  expect(screen.getByRole("heading", { name: "123 Main Street" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Showing 1 of 487 properties");
  expect(screen.queryByText("Loading properties...")).not.toBeInTheDocument();
});

test("shows a useful empty result state", async () => {
  fetchProperties.mockResolvedValue({ total: 0, results: [] });
  render(<ListingsPage />);
  expect(await screen.findByText("No properties found")).toBeInTheDocument();
  expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 0 of 0 properties");
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
