import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { fetchPropertyDetail, fetchPropertyOpenHouses } from "../api/client";
import PropertyDetailPage from "./PropertyDetailPage";

jest.mock("../api/client");

const property = {
  L_ListingID: "123", L_DisplayId: "MLS123", L_Address: "123 Main Street", L_City: "Irvine", L_State: "CA", L_Zip: "92618",
  L_SystemPrice: "850000", L_Keyword2: 3, LM_Dec_3: "2.5", LM_Int2_3: 1800, YearBuilt: 1998,
  L_Remarks: "A bright home with a garden.", L_Type_: "SingleFamilyResidence", L_Status: "Active", LotSizeSquareFeet: 5200, L_Keyword5: 2,
  L_Photos: "[]", LMD_MP_Latitude: "33.6", LMD_MP_Longitude: "-117.8",
};
const event = { id: 1, OpenHouseDate: "2026-11-10", OH_StartTime: "13:00:00", OH_EndTime: "16:00:00", all_data: '{"OpenHouseRemarks":"Please ring the bell."}' };

beforeEach(() => {
  fetchPropertyDetail.mockReset().mockResolvedValue(property);
  fetchPropertyOpenHouses.mockReset().mockResolvedValue([event]);
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); });

function mount(entry = "/property/123", strict = false) {
  const ui = <MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Link to="/property/456">Another property</Link>
    <Routes><Route path="/property/:id" element={<PropertyDetailPage />} /><Route path="/" element={<h1>Listings</h1>} /></Routes>
  </MemoryRouter>;
  return render(strict ? <StrictMode>{ui}</StrictMode> : ui);
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("loads property and open houses independently and renders real RETS fields", async () => {
  const houses = deferred();
  fetchPropertyOpenHouses.mockReturnValueOnce(houses.promise);
  mount();
  expect(screen.getByRole("status")).toHaveTextContent("Loading property...");
  await screen.findByRole("heading", { name: "123 Main Street" });
  expect(screen.getByText("$850,000")).toBeInTheDocument();
  expect(screen.getByText("Irvine, CA, 92618")).toBeInTheDocument();
  for (const value of ["1,800", "1998", "SingleFamilyResidence", "Active", "5,200", "MLS123", "A bright home with a garden."]) expect(screen.getByText(value)).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Loading open houses...");
  await act(async () => houses.resolve([event]));
  expect(screen.getByText("Please ring the bell.")).toBeInTheDocument();
  expect(fetchPropertyDetail).toHaveBeenCalledWith("123", { signal: expect.any(AbortSignal) });
  expect(fetchPropertyOpenHouses).toHaveBeenCalledWith("123", { signal: expect.any(AbortSignal) });
});

test("missing values show useful placeholders and preserve zero bedrooms", async () => {
  fetchPropertyDetail.mockResolvedValue({ L_ListingID: "123", L_Keyword2: 0 });
  fetchPropertyOpenHouses.mockResolvedValue([]);
  const { container } = mount();
  await screen.findByRole("heading", { name: "Address unavailable" });
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.getByText("Price unavailable")).toBeInTheDocument();
  expect(screen.getByText("No description available.")).toBeInTheDocument();
  expect(screen.getByText("No open houses scheduled")).toBeInTheDocument();
  expect(container).not.toHaveTextContent(/NaN|undefined|null/);
});

test("invalid route IDs show an error without making API requests", () => {
  mount("/property/invalid-id");
  expect(screen.getByRole("alert")).toHaveTextContent("Invalid property ID");
  expect(fetchPropertyDetail).not.toHaveBeenCalled();
  expect(fetchPropertyOpenHouses).not.toHaveBeenCalled();
});

test.each(["Property not found (HTTP 404)", "Unable to reach the server."])("handles %s and retries the property independently", async (message) => {
  fetchPropertyDetail.mockRejectedValueOnce(new Error(message));
  mount();
  expect(await screen.findByRole("alert")).toHaveTextContent(message);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("heading", { name: "123 Main Street" });
  expect(fetchPropertyDetail).toHaveBeenCalledTimes(2);
  expect(fetchPropertyOpenHouses).toHaveBeenCalledTimes(1);
});

test("an open house failure does not hide property details and retries only that request", async () => {
  fetchPropertyOpenHouses.mockRejectedValueOnce(new Error("Schedule unavailable"));
  mount();
  await screen.findByRole("heading", { name: "123 Main Street" });
  expect(await screen.findByRole("alert")).toHaveTextContent("Schedule unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Retry open houses" }));
  expect(await screen.findByText("Please ring the bell.")).toBeInTheDocument();
  expect(fetchPropertyDetail).toHaveBeenCalledTimes(1);
  expect(fetchPropertyOpenHouses).toHaveBeenCalledTimes(2);
});

test.each(["success", "error"])("ignores old %s responses after navigating to another property", async (outcome) => {
  const oldDetail = deferred();
  const oldHouses = deferred();
  fetchPropertyDetail.mockReturnValueOnce(oldDetail.promise).mockResolvedValueOnce({ ...property, L_ListingID: "456", L_Address: "456 New Street" });
  fetchPropertyOpenHouses.mockReturnValueOnce(oldHouses.promise).mockResolvedValueOnce([]);
  mount();
  const detailSignal = fetchPropertyDetail.mock.calls[0][1].signal;
  const houseSignal = fetchPropertyOpenHouses.mock.calls[0][1].signal;
  fireEvent.click(screen.getByRole("link", { name: "Another property" }));
  await screen.findByRole("heading", { name: "456 New Street" });
  expect(detailSignal.aborted).toBe(true);
  expect(houseSignal.aborted).toBe(true);
  await act(async () => {
    if (outcome === "success") { oldDetail.resolve(property); oldHouses.resolve([event]); }
    else { oldDetail.reject(new Error("Old detail error")); oldHouses.reject(new Error("Old schedule error")); }
  });
  expect(screen.getByRole("heading", { name: "456 New Street" })).toBeInTheDocument();
  expect(screen.queryByText("Please ring the bell.")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("immediately hides the previous property while the next property loads", async () => {
  const next = deferred();
  fetchPropertyDetail.mockResolvedValueOnce(property).mockReturnValueOnce(next.promise);
  mount();
  await screen.findByRole("heading", { name: "123 Main Street" });
  fireEvent.click(screen.getByRole("link", { name: "Another property" }));
  expect(screen.queryByRole("heading", { name: "123 Main Street" })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Loading property...");
  await act(async () => next.resolve({ ...property, L_ListingID: "456", L_Address: "456 New Street" }));
  expect(screen.getByRole("heading", { name: "456 New Street" })).toBeInTheDocument();
});

test("aborts both requests on unmount", async () => {
  fetchPropertyDetail.mockReturnValue(new Promise(() => {}));
  fetchPropertyOpenHouses.mockReturnValue(new Promise(() => {}));
  const { unmount } = mount();
  const signals = [fetchPropertyDetail.mock.calls[0][1].signal, fetchPropertyOpenHouses.mock.calls[0][1].signal];
  unmount();
  await waitFor(() => signals.forEach((signal) => expect(signal.aborted).toBe(true)));
});

test("StrictMode replay cancels and ignores the first mount's requests", async () => {
  const firstDetail = deferred();
  const firstHouses = deferred();
  fetchPropertyDetail.mockReturnValueOnce(firstDetail.promise);
  fetchPropertyOpenHouses.mockReturnValueOnce(firstHouses.promise);
  mount("/property/123", true);
  await screen.findByRole("heading", { name: "123 Main Street" });
  expect(fetchPropertyDetail.mock.calls[0][1].signal.aborted).toBe(true);
  expect(fetchPropertyOpenHouses.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => { firstDetail.resolve({ ...property, L_Address: "Old home" }); firstHouses.reject(new Error("Old error")); });
  expect(screen.queryByRole("heading", { name: "Old home" })).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test.each([undefined, { from: "https://example.com" }, { from: "//example.com" }])("direct visits and invalid return locations fall back to listings", async (state) => {
  mount({ pathname: "/property/123", state });
  await screen.findByRole("heading", { name: "123 Main Street" });
  expect(screen.getByRole("link", { name: /Back to listings/ })).toHaveAttribute("href", "/");
});
