import React from 'react';

const Pagination = ({ currentPage, totalPages, paginate }) => {
    // Generate page numbers array
    const pageNumbers = [];

    // Logic to determine which page numbers to show
    // Will show: first page, last page, current page, 
    // one page before and after current page
    const getPageNumbers = () => {
        const pages = [];

        // Always add page 1
        pages.push(1);

        // Add pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }

        // Always add last page if more than 1 page
        if (totalPages > 1 && !pages.includes(totalPages)) {
            pages.push(totalPages);
        }

        // Sort and add ellipses
        const sortedPages = [...new Set(pages)].sort((a, b) => a - b);
        const pagesWithEllipses = [];

        for (let i = 0; i < sortedPages.length; i++) {
            pagesWithEllipses.push(sortedPages[i]);

            // Add ellipsis between non-consecutive pages
            if (i < sortedPages.length - 1 && sortedPages[i + 1] - sortedPages[i] > 1) {
                pagesWithEllipses.push('...');
            }
        }

        return pagesWithEllipses;
    };

    const pageNumbersToShow = getPageNumbers();

    return (
        <div className="flex justify-center items-center">
            {/* Previous Button */}
            <button
                onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`mx-1 px-3 py-1 rounded-md border ${currentPage === 1
                        ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border-accent text-accent hover:bg-accent hover:text-bgdark'
                    }`}
            >
                Prev
            </button>

            {/* Page Numbers */}
            <div className="flex mx-2">
                {pageNumbersToShow.map((number, index) => (
                    <React.Fragment key={index}>
                        {number === '...' ? (
                            <span className="mx-1 px-3 py-1">...</span>
                        ) : (
                            <button
                                onClick={() => paginate(number)}
                                className={`mx-1 px-3 py-1 rounded-md ${currentPage === number
                                        ? 'bg-accent text-bgdark'
                                        : 'border border-accent text-accent hover:bg-accent hover:text-bgdark'
                                    }`}
                            >
                                {number}
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Next Button */}
            <button
                onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`mx-1 px-3 py-1 rounded-md border ${currentPage === totalPages
                        ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border-accent text-accent hover:bg-accent hover:text-bgdark'
                    }`}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;