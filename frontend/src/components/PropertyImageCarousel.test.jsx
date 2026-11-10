import { fireEvent, render, screen } from "@testing-library/react";
import PropertyImageCarousel from "./PropertyImageCarousel";

const photos = '["https://example.com/one.jpg","https://example.com/two.jpg","https://example.com/three.jpg"]';
const address = "123 Main Street";

test("cycles forward and backward, wraps at both ends, and updates the counter", () => {
  render(<PropertyImageCarousel photos={photos} address={address} />);
  expect(screen.getByText("1 / 3")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Previous/ }));
  expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/three.jpg");
  expect(screen.getByText("3 / 3")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  expect(screen.getByText("1 / 3")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  expect(screen.getByText("2 / 3")).toBeInTheDocument();
});

test("arrow clicks do not bubble to a parent navigation handler", () => {
  const onClick = jest.fn();
  render(<div onClick={onClick}><PropertyImageCarousel photos={photos} address={address} /></div>);
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  fireEvent.click(screen.getByRole("button", { name: /Previous/ }));
  expect(onClick).not.toHaveBeenCalled();
});

test("a single photo has a counter and no arrows", () => {
  render(<PropertyImageCarousel photos='["https://example.com/one.jpg"]' address={address} />);
  expect(screen.getByText("1 / 1")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test.each([null, "broken", "[]", '["javascript:alert(1)"]'])("handles unusable photos %p", (value) => {
  render(<PropertyImageCarousel photos={value} address={address} />);
  expect(screen.getByText("Photo unavailable")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("recovers from a failed image when navigating and resets on new photo data", () => {
  const { rerender } = render(<PropertyImageCarousel photos={photos} address={address} />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByText("Photo unavailable")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/two.jpg");
  rerender(<PropertyImageCarousel photos='["https://example.com/new.jpg"]' address={address} />);
  expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/new.jpg");
  expect(screen.getByText("1 / 1")).toBeInTheDocument();
});
