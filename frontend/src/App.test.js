import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import App from "./App";
import { fetchProperties, fetchPropertyDetail, fetchPropertyOpenHouses } from "./api/client";

jest.mock("./api/client");
const photos = '["https://example.com/one.jpg","https://example.com/two.jpg"]';
const property = { L_ListingID: "121", L_Address: "Home 21", L_City: "Irvine", L_State: "CA", L_SystemPrice: 850000, L_Photos: photos };

function NavigationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="route">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Browser back</button><button onClick={() => navigate(1)}>Browser forward</button></>;
}
function mount(entry = "/") {
  return render(<MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /><NavigationProbe /></MemoryRouter>);
}
beforeEach(() => {
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  fetchProperties.mockReset().mockImplementation(({ offset = 0 }) => Promise.resolve({ total: 45, results: [{ ...property, L_ListingID: String(offset + 101), L_Address: `Home ${offset + 1}` }] }));
  fetchPropertyDetail.mockReset().mockResolvedValue(property);
  fetchPropertyOpenHouses.mockReset().mockResolvedValue([]);
});
afterEach(() => { jest.restoreAllMocks(); });

test("search, pagination, detail and Back to listings preserve submitted filters and page", async () => {
  mount();
  await screen.findByRole("heading", { name: "Home 1" });
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "Irvine" } });
  fireEvent.change(screen.getByLabelText("Beds"), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await screen.findByRole("heading", { name: "Home 1" });
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "Unsaved draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByRole("heading", { name: "Home 21" });
  expect(screen.getByTestId("route")).toHaveTextContent("/?city=Irvine&beds=3&page=2");
  fireEvent.click(screen.getByRole("link", { name: "Home 21" }));
  await screen.findByRole("heading", { name: "Home 21" });
  expect(screen.getByTestId("route")).toHaveTextContent("/property/121");
  fireEvent.click(screen.getByRole("link", { name: /Back to listings/ }));
  await screen.findByRole("link", { name: "Home 21" });
  expect(screen.getByLabelText("City")).toHaveValue("Irvine");
  expect(screen.getByLabelText("Beds")).toHaveValue("3");
  expect(screen.getByRole("button", { name: "Page 2", current: "page" })).toBeInTheDocument();
  expect(fetchProperties.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ city: "Irvine", beds: "3", limit: 20, offset: 20 }));
});

test("browser back and forward restore a deep-linked listing page and detail", async () => {
  mount("/?city=Irvine&page=2");
  await screen.findByRole("link", { name: "Home 21" });
  fireEvent.click(screen.getByRole("link", { name: "Home 21" }));
  await screen.findByRole("link", { name: /Back to listings/ });
  fireEvent.click(screen.getByRole("button", { name: "Browser back" }));
  await screen.findByRole("link", { name: "Home 21" });
  expect(screen.getByLabelText("City")).toHaveValue("Irvine");
  expect(screen.getByRole("button", { name: "Page 2", current: "page" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Browser forward" }));
  await screen.findByRole("link", { name: /Back to listings/ });
  expect(screen.getByTestId("route")).toHaveTextContent("/property/121");
});

test("carousel arrows change photos while the card link navigates with L_ListingID", async () => {
  mount();
  await screen.findByRole("link", { name: "Home 1" });
  fireEvent.click(screen.getByRole("button", { name: "Next photo of Home 1" }));
  expect(screen.getByText("2 / 2")).toBeInTheDocument();
  expect(screen.getByTestId("route").textContent).toBe("/");
  expect(fetchPropertyDetail).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("link", { name: "Home 1" }));
  await waitFor(() => expect(fetchPropertyDetail).toHaveBeenCalledWith("101", { signal: expect.any(AbortSignal) }));
});

test("direct property visits load without list data and return to the default listing", async () => {
  mount("/property/121");
  await screen.findByRole("heading", { name: "Home 21" });
  expect(fetchProperties).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("link", { name: /Back to listings/ }));
  await screen.findByRole("link", { name: "Home 1" });
  expect(screen.getByTestId("route").textContent).toBe("/");
});

test.each(["0", "-2", "abc", "1.5", "Infinity", "9007199254740992"])("invalid page query %s falls back to page one", async (page) => {
  mount(`/?page=${page}`);
  await screen.findByRole("link", { name: "Home 1" });
  expect(fetchProperties.mock.calls[0][0]).toEqual({ limit: 20, offset: 0 });
});

test("unknown paths render a recoverable page-not-found screen", () => {
  mount("/unknown");
  expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to listings" })).toHaveAttribute("href", "/");
});
