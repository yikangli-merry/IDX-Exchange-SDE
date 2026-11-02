import { fireEvent, render, screen, within } from "@testing-library/react";
import Pagination from "./Pagination";

function pageNumbers() {
  return within(screen.getByRole("navigation", { name: "Property pagination" }))
    .getAllByRole("button", { name: /^Page \d+$/ })
    .map((button) => Number(button.textContent));
}

test.each([0, 1])("hides pagination for %s total pages", (totalPages) => {
  render(<Pagination currentPage={1} totalPages={totalPages} onPageChange={jest.fn()} />);
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});

test.each([
  [1, 2, [1, 2], 0],
  [4, 7, [1, 2, 3, 4, 5, 6, 7], 0],
  [1, 24, [1, 2, 3, 4, 5, 24], 1],
  [4, 24, [1, 2, 3, 4, 5, 24], 1],
  [5, 24, [1, 4, 5, 6, 24], 2],
  [20, 24, [1, 19, 20, 21, 24], 2],
  [21, 24, [1, 20, 21, 22, 23, 24], 1],
  [24, 24, [1, 20, 21, 22, 23, 24], 1],
])("renders page %s of %s with the correct numbers and ellipses", (currentPage, totalPages, numbers, ellipses) => {
  render(<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={jest.fn()} />);
  expect(pageNumbers()).toEqual(numbers);
  const gaps = screen.queryAllByText("…");
  expect(gaps).toHaveLength(ellipses);
  gaps.forEach((gap) => {
    expect(gap.tagName).toBe("SPAN");
    expect(gap.closest("button")).toBeNull();
  });
  expect(screen.getByRole("button", { name: `Page ${currentPage}`, current: "page" })).toBeInTheDocument();
});

test("disables Previous on the first page and Next on the last page", () => {
  const onPageChange = jest.fn();
  const { rerender } = render(<Pagination currentPage={1} totalPages={24} onPageChange={onPageChange} />);
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  expect(onPageChange).not.toHaveBeenCalled();

  rerender(<Pagination currentPage={24} totalPages={24} onPageChange={onPageChange} />);
  expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(onPageChange).not.toHaveBeenCalled();
});

test("emits the requested number for page, Previous, and Next clicks", () => {
  const onPageChange = jest.fn();
  render(<Pagination currentPage={5} totalPages={24} onPageChange={onPageChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Page 6" }));
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Page 24" }));
  expect(onPageChange.mock.calls).toEqual([[6], [4], [6], [24]]);
});

test("clicking the current page does not emit a redundant change", () => {
  const onPageChange = jest.fn();
  render(<Pagination currentPage={5} totalPages={24} onPageChange={onPageChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Page 5" }));
  expect(onPageChange).not.toHaveBeenCalled();
});

test("regression: first and last pages never repeat near the end of a large range", () => {
  const { rerender } = render(<Pagination currentPage={1} totalPages={8} onPageChange={jest.fn()} />);
  [8, 24, 2761].forEach((totalPages) => {
    [1, 4, 5, Math.ceil(totalPages / 2), totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages].forEach((currentPage) => {
      rerender(<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={jest.fn()} />);
      const numbers = pageNumbers();
      expect(screen.getAllByRole("button", { name: "Page 1", exact: true })).toHaveLength(1);
      expect(screen.getAllByRole("button", { name: `Page ${totalPages}`, exact: true })).toHaveLength(1);
      expect(numbers).toContain(currentPage);
      expect(numbers.every((number) => number >= 1 && number <= totalPages)).toBe(true);
      expect(numbers.every((number, index) => index === 0 || number > numbers[index - 1])).toBe(true);
    });
  });
});
