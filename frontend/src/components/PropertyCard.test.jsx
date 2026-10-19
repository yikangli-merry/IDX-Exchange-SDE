import { fireEvent, render, screen } from "@testing-library/react";
import PropertyCard from "./PropertyCard";

const property = {
  L_Address: "123 Main Street",
  L_City: "Irvine",
  L_State: "CA",
  L_SystemPrice: "850000",
  L_Keyword2: 3,
  LM_Dec_3: "2.5",
  LM_Int2_3: 1800,
  L_Photos: '["https://example.com/home.jpg"]',
};

test("renders real field names, formatted price, location, and all three stats", () => {
  render(<PropertyCard property={property} />);
  expect(screen.getByRole("heading", { name: "123 Main Street" })).toBeInTheDocument();
  expect(screen.getByText("$850,000")).toBeInTheDocument();
  expect(screen.getByText("Irvine, CA")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.getByText("2.5")).toBeInTheDocument();
  expect(screen.getByText("1,800")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Exterior of 123 Main Street" })).toHaveAttribute("src", "https://example.com/home.jpg");
});

test("shows a placeholder for malformed photos", () => {
  render(<PropertyCard property={{ ...property, L_Photos: "broken JSON" }} />);
  expect(screen.getByText("Photo unavailable")).toBeInTheDocument();
});

test("replaces a failed remote image with a placeholder", () => {
  render(<PropertyCard property={property} />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByText("Photo unavailable")).toBeInTheDocument();
  expect(screen.getByRole("img")).not.toHaveAttribute("src");
});

test("tries a new photo when the property photo changes", () => {
  const { rerender } = render(<PropertyCard property={property} />);
  fireEvent.error(screen.getByRole("img"));
  rerender(<PropertyCard property={{ ...property, L_Photos: '["https://example.com/new.jpg"]' }} />);
  expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/new.jpg");
});

test("handles missing fields without displaying null or NaN", () => {
  const { container } = render(<PropertyCard property={{ L_SystemPrice: null, L_Keyword2: null, LM_Dec_3: null }} />);
  expect(screen.getByText("Address unavailable")).toBeInTheDocument();
  expect(screen.getByText("Location unavailable")).toBeInTheDocument();
  expect(screen.getByText("Price unavailable")).toBeInTheDocument();
  expect(screen.getAllByText("\u2014")).toHaveLength(3);
  expect(container).not.toHaveTextContent(/null|NaN/);
});

test("preserves zero bedrooms and handles a zero listing price", () => {
  render(<PropertyCard property={{ ...property, L_SystemPrice: 0, L_Keyword2: 0 }} />);
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.getByText("Price unavailable")).toBeInTheDocument();
});
