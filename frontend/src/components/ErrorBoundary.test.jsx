import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

let shouldThrow;
function FragilePage() {
  if (shouldThrow) throw new Error("Intentional render failure");
  return <h1>Recovered page</h1>;
}
function TestApp() {
  const location = useLocation();
  return <><header>Site header</header><ErrorBoundary resetKey={location.key}><Routes>
    <Route path="/broken" element={<FragilePage />} />
    <Route path="/" element={<h1>Property listings</h1>} />
  </Routes></ErrorBoundary><footer>Site footer</footer></>;
}
beforeEach(() => {
  shouldThrow = true;
  // React reports deliberately thrown errors even when a boundary catches them.
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());
function mount() {
  return render(<MemoryRouter initialEntries={["/broken"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TestApp /></MemoryRouter>);
}
test("catches render failures, preserves the shell, and retries successfully", () => {
  mount();
  expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  expect(screen.getByText("Site header")).toBeInTheDocument();
  expect(screen.getByText("Site footer")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  shouldThrow = false;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.getByRole("heading", { name: "Recovered page" })).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
test("returning to listings clears the boundary after navigation", () => {
  mount();
  fireEvent.click(screen.getByRole("link", { name: "Back to listings" }));
  expect(screen.getByRole("heading", { name: "Property listings" })).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
