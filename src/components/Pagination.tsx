import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => canPrev && onChange(page - 1)}
          disabled={!canPrev}
          icon={<ChevronLeft className="h-4 w-4" />}
        />
        {pageNumbers.map((pageNumber) => (
          <Button
            key={pageNumber}
            variant={pageNumber === page ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => canNext && onChange(page + 1)}
          disabled={!canNext}
          icon={<ChevronRight className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
