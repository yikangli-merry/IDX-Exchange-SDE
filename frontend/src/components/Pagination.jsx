function getPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-gap", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "start-gap", ...Array.from({ length: 5 }, (_, index) => totalPages - 4 + index)];
  }

  return [1, "start-gap", currentPage - 1, currentPage, currentPage + 1, "end-gap", totalPages];
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  function changePage(page) {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  }

  return (
    <nav className="pagination" aria-label="Property pagination">
      <button className="pagination-button pagination-direction" type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
        Previous
      </button>
      <div className="pagination-pages">
        {getPageItems(currentPage, totalPages).map((item) => typeof item === "number" ? (
          <button
            key={item}
            className="pagination-button"
            type="button"
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? "page" : undefined}
            onClick={() => changePage(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="pagination-ellipsis" aria-hidden="true">…</span>
        ))}
      </div>
      <button className="pagination-button pagination-direction" type="button" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>
        Next
      </button>
    </nav>
  );
}
