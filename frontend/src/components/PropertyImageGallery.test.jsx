import { fireEvent, render, screen, within } from "@testing-library/react";
import PropertyImageGallery from "./PropertyImageGallery";

const photos = '["https://example.com/one.jpg","https://example.com/two.jpg"]';
const address = "123 Main Street";

function openGallery() {
  const trigger = screen.getByRole("button", { name: /Open photo/ });
  trigger.focus();
  fireEvent.click(trigger);
  return { trigger, dialog: screen.getByRole("dialog") };
}

test("selecting a thumbnail changes the main image and selected state", () => {
  render(<PropertyImageGallery photos={photos} address={address} />);
  fireEvent.click(screen.getByRole("button", { name: "Show photo 2" }));
  expect(screen.getByRole("img", { name: `Photo 2 of ${address}` })).toHaveAttribute("src", "https://example.com/two.jpg");
  expect(screen.getByRole("button", { name: "Show photo 2" })).toHaveAttribute("aria-pressed", "true");
});

test("opens with focus, navigates by keyboard, closes on Escape and restores focus and scrolling", () => {
  document.body.style.overflow = "auto";
  render(<PropertyImageGallery photos={photos} address={address} />);
  const { trigger, dialog } = openGallery();
  expect(dialog).toHaveFocus();
  expect(dialog).toHaveAttribute("tabindex", "-1");
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  expect(within(dialog).getByText("2 / 2")).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  expect(within(dialog).getByText("1 / 2")).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "ArrowLeft" });
  expect(within(dialog).getByText("2 / 2")).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe("auto");
  document.body.style.overflow = "";
});

test("navigates with buttons, ignores image clicks and closes only on backdrop or close button", () => {
  render(<PropertyImageGallery photos={photos} address={address} />);
  const { dialog } = openGallery();
  fireEvent.click(within(dialog).getByRole("button", { name: "Next photo" }));
  expect(within(dialog).getByText("2 / 2")).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("img"));
  expect(dialog).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Previous photo" }));
  expect(within(dialog).getByText("1 / 2")).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("lightbox-backdrop"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  openGallery();
  fireEvent.click(screen.getByRole("button", { name: "Close photo viewer" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("Tab and Shift+Tab keep focus inside the lightbox", () => {
  render(<PropertyImageGallery photos={photos} address={address} />);
  const { dialog } = openGallery();
  fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
  expect(screen.getByRole("button", { name: "Next photo" })).toHaveFocus();
  fireEvent.keyDown(document.activeElement, { key: "Tab" });
  expect(screen.getByRole("button", { name: "Close photo viewer" })).toHaveFocus();
});

test("single-photo lightboxes hide navigation and still close on Escape", () => {
  render(<PropertyImageGallery photos='["https://example.com/one.jpg"]' address={address} />);
  const { dialog } = openGallery();
  expect(within(dialog).queryByRole("button", { name: "Next photo" })).not.toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  expect(within(dialog).getByText("1 / 1")).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test.each([null, "broken", "[]"])("renders a placeholder without a viewer for %p", (value) => {
  render(<PropertyImageGallery photos={value} address={address} />);
  expect(screen.getByText("Photo unavailable")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("image failures are recoverable and new photo data closes the old viewer", () => {
  const { rerender } = render(<PropertyImageGallery photos={photos} address={address} />);
  fireEvent.error(screen.getByRole("img", { name: `Photo 1 of ${address}` }));
  expect(screen.getByText("Photo unavailable")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show photo 2" }));
  expect(screen.getByRole("img", { name: `Photo 2 of ${address}` })).toHaveAttribute("src", "https://example.com/two.jpg");
  openGallery();
  rerender(<PropertyImageGallery photos='["https://example.com/new.jpg"]' address={address} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: `Photo 1 of ${address}` })).toHaveAttribute("src", "https://example.com/new.jpg");
  expect(document.body.style.overflow).not.toBe("hidden");
});
