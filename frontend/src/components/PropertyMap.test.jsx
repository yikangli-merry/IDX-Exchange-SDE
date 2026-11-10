import { render, screen } from "@testing-library/react";
import PropertyMap from "./PropertyMap";

const originalKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
beforeEach(() => { process.env.REACT_APP_GOOGLE_MAPS_API_KEY = "test-key"; });
afterEach(() => {
  if (originalKey === undefined) delete process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  else process.env.REACT_APP_GOOGLE_MAPS_API_KEY = originalKey;
});

test("embeds the exact coordinates and supplies a directions link in a new tab", () => {
  render(<PropertyMap latitude="34.099106" longitude="-118.418132" address="123 Main Street" />);
  const iframe = screen.getByTitle("Map of 123 Main Street");
  const url = new URL(iframe.src);
  expect(url.pathname).toBe("/maps/embed/v1/place");
  expect(Object.fromEntries(url.searchParams)).toEqual({ key: "test-key", q: "34.099106,-118.418132", zoom: "15" });
  expect(iframe).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  const link = screen.getByRole("link", { name: /Get Directions/ });
  expect(link).toHaveAttribute("target", "_blank");
  expect(new URL(link.href).searchParams.get("destination")).toBe("34.099106,-118.418132");
});

test.each([[null, -118], [34, undefined], ["", -118], [" ", -118], ["bad", -118], [91, 0], [0, -181], [Infinity, 0]])("does not render a map or directions for invalid coordinates %p, %p", (latitude, longitude) => {
  const { container } = render(<PropertyMap latitude={latitude} longitude={longitude} />);
  expect(container.querySelector("iframe")).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByText("Location unavailable for this property.")).toBeInTheDocument();
});

test("zero coordinates remain valid", () => {
  render(<PropertyMap latitude={0} longitude="0" address="Equator" />);
  expect(screen.getByTitle("Map of Equator")).toBeInTheDocument();
});

test("a missing key hides the iframe while directions still work", () => {
  delete process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const { container } = render(<PropertyMap latitude={34} longitude={-118} />);
  expect(container.querySelector("iframe")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Get Directions/ })).toBeInTheDocument();
  expect(screen.getByText(/Map preview is unavailable/)).toBeInTheDocument();
});
