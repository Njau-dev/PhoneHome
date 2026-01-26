interface PaginationProps {
  currentPage: number;
  totalPages: number;
  paginate: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, paginate }: PaginationProps) => {
  const pageNumbers = [];

  // Calculate the range of page numbers to show
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex justify-center items-center gap-2 mt-8">
      {/* Previous Button */}
      <button
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-lg border transition-colors ${currentPage === 1
          ? "border-border text-muted cursor-not-allowed"
          : "border-accent text-accent hover:bg-accent hover:text-bg"
          }`}
      >
        Previous
      </button>

      {/* First page */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => paginate(1)}
            className="px-4 py-1 rounded-lg border border-border hover:border-accent transition-colors"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}

      {/* Page Numbers */}
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => paginate(number)}
          className={`px-4 py-1 rounded-lg border transition-colors ${currentPage === number
            ? "bg-accent text-bg border-accent"
            : "border-border hover:border-accent"
            }`}
        >
          {number}
        </button>
      ))}

      {/* Last page */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <button
            onClick={() => paginate(totalPages)}
            className="px-4 py-1 rounded-lg border border-border hover:border-accent transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-lg border transition-colors ${currentPage === totalPages
          ? "border-border text-muted cursor-not-allowed"
          : "border-accent text-accent hover:bg-accent hover:text-bg"
          }`}
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
