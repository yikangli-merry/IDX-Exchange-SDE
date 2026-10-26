import { fireEvent, render, screen, within } from "@testing-library/react";
import PropertyFilters from "./PropertyFilters";

function setup() {
  const onSearch = jest.fn();
  const onClear = jest.fn();
  render(<PropertyFilters onSearch={onSearch} onClear={onClear} />);
  return { onSearch, onClear };
}

const sampleFilters = { city: "Irvine", zipcode: "09261", minPrice: "300000", maxPrice: "1500000", beds: "3", baths: "2.5" };
const labels = { city: "City", zipcode: "ZIP Code", minPrice: "Min Price", maxPrice: "Max Price", beds: "Beds", baths: "Baths" };

function fillForm(values = sampleFilters) {
  Object.entries(values).forEach(([name, value]) => {
    fireEvent.change(screen.getByLabelText(labels[name]), { target: { value } });
  });
}

test("renders all six labelled controls and both buttons with empty defaults", () => {
  setup();
  expect(screen.getAllByRole("textbox")).toHaveLength(2);
  expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
  expect(screen.getAllByRole("combobox")).toHaveLength(2);
  expect(screen.getByLabelText("City")).toHaveValue("");
  expect(screen.getByLabelText("ZIP Code")).toHaveAttribute("type", "text");
  expect(screen.getByLabelText("Min Price")).toHaveValue(null);
  expect(screen.getByLabelText("Max Price")).toHaveValue(null);
  expect(screen.getByLabelText("Beds")).toHaveValue("");
  expect(screen.getByLabelText("Baths")).toHaveValue("");
  expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Clear Filters" })).toBeEnabled();
});

test("updates controlled inputs without searching and submits a snapshot of all values", () => {
  const { onSearch, onClear } = setup();
  fillForm();
  expect(onSearch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(onSearch).toHaveBeenCalledWith(sampleFilters);
  expect(onClear).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "Pasadena" } });
  expect(onSearch.mock.calls[0][0].city).toBe("Irvine");
});

test("clears all six controls and invokes onClear without submitting stale values", () => {
  const { onSearch, onClear } = setup();
  fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
  expect(screen.getByLabelText("City")).toHaveValue("");
  expect(screen.getByLabelText("ZIP Code")).toHaveValue("");
  expect(screen.getByLabelText("Min Price")).toHaveValue(null);
  expect(screen.getByLabelText("Max Price")).toHaveValue(null);
  expect(screen.getByLabelText("Beds")).toHaveValue("");
  expect(screen.getByLabelText("Baths")).toHaveValue("");
  expect(onClear).toHaveBeenCalledTimes(1);
  expect(onSearch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(onSearch).toHaveBeenCalledWith({ city: "", zipcode: "", minPrice: "", maxPrice: "", beds: "", baths: "" });
});

test("blocks reversed price ranges and clears the message when corrected", () => {
  const { onSearch } = setup();
  fillForm({ minPrice: "900000", maxPrice: "300000" });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Min Price must be less than or equal to Max Price.");
  expect(onSearch).not.toHaveBeenCalled();
  fillForm({ maxPrice: "900000" });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ minPrice: "900000", maxPrice: "900000" }));
});

test("clears validation errors and supports repeated clears", () => {
  const { onClear } = setup();
  fillForm({ minPrice: "2", maxPrice: "1" });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
  fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(onClear).toHaveBeenCalledTimes(2);
});

test("offers exact bed counts and half-bath counts including zero and ten", () => {
  const { onSearch } = setup();
  const beds = screen.getByLabelText("Beds");
  const baths = screen.getByLabelText("Baths");
  expect(within(beds).getAllByRole("option")).toHaveLength(12);
  expect(within(baths).getAllByRole("option")).toHaveLength(22);
  expect(within(beds).getByRole("option", { name: "10" })).toHaveValue("10");
  expect(within(baths).getByRole("option", { name: "10" })).toHaveValue("10");
  fillForm({ beds: "0", baths: "0.5", minPrice: "0" });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ beds: "0", baths: "0.5", minPrice: "0" }));
});

test("uses native non-negative price validation and allows decimal prices", () => {
  setup();
  const minPrice = screen.getByLabelText("Min Price");
  const maxPrice = screen.getByLabelText("Max Price");
  fireEvent.change(minPrice, { target: { value: "-1" } });
  fireEvent.change(maxPrice, { target: { value: "-1" } });
  expect(minPrice).toBeInvalid();
  expect(maxPrice).toBeInvalid();
  fireEvent.change(minPrice, { target: { value: "0.5" } });
  fireEvent.change(maxPrice, { target: { value: "1.5" } });
  expect(minPrice).toBeValid();
  expect(maxPrice).toBeValid();
});
