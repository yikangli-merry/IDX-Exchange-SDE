import { fireEvent, render, screen } from "@testing-library/react";
import OpenHouses from "./OpenHouses";

const event = { id: 1, OpenHouseDate: "2026-11-10", OH_StartTime: "13:30:00", OH_EndTime: "16:00:00", all_data: '{"OpenHouseRemarks":"Use the side entrance."}' };

test("renders calendar date, formatted times and remarks from the all_data JSON string", () => {
  render(<OpenHouses openHouses={[event]} />);
  expect(screen.getByText("Tue, Nov 10, 2026")).toBeInTheDocument();
  expect(screen.getByText("1:30 PM – 4:00 PM")).toBeInTheDocument();
  expect(screen.getByText("Use the side entrance.")).toBeInTheDocument();
});

test.each([null, "broken", "{}", '{"OpenHouseRemarks":null}', '{"OpenHouseRemarks":42}'])("bad or missing remarks %p do not hide the event", (all_data) => {
  render(<OpenHouses openHouses={[{ ...event, all_data }]} />);
  expect(screen.getByText("1:30 PM – 4:00 PM")).toBeInTheDocument();
  expect(screen.queryByText("Use the side entrance.")).not.toBeInTheDocument();
});

test("supports parsed remarks and renders their content as text", () => {
  render(<OpenHouses openHouses={[{ ...event, all_data: { OpenHouseRemarks: "<script>test</script>" } }]} />);
  expect(screen.getByText("<script>test</script>")).toBeInTheDocument();
  expect(document.querySelector("script")).not.toBeInTheDocument();
});

test("handles midnight, noon, ISO dates and missing values", () => {
  render(<OpenHouses openHouses={[
    { ...event, OpenHouseDate: "2026-11-10T12:00:00.000Z", OH_StartTime: "00:00:00", OH_EndTime: "12:00:00" },
    { id: 2, OpenHouseDate: "bad", OH_StartTime: "25:00", OH_EndTime: null },
  ]} />);
  expect(screen.getByText("12:00 AM – 12:00 PM")).toBeInTheDocument();
  expect(screen.getByText("Date unavailable")).toBeInTheDocument();
  expect(screen.getByText("Time unavailable – Time unavailable")).toBeInTheDocument();
});

test("distinguishes loading, empty results and an independently retryable error", () => {
  const onRetry = jest.fn();
  const { rerender } = render(<OpenHouses loading />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading open houses...");
  expect(screen.queryByText("No open houses scheduled")).not.toBeInTheDocument();
  rerender(<OpenHouses />);
  expect(screen.getByText("No open houses scheduled")).toBeInTheDocument();
  rerender(<OpenHouses error="Open houses unavailable" onRetry={onRetry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Open houses unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Retry open houses" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});
