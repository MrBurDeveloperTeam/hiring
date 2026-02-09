import { Candidate, JobStage } from '../lib/types';
import { CandidateCard } from './CandidateCard';

interface KanbanBoardProps {
  candidates: Candidate[];
  onMove: (id: string, status: JobStage) => void;
  onView: (candidate: Candidate) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
}

const columns: { id: JobStage; label: string }[] = [
  { id: 'Applied', label: 'Applied' },
  { id: 'Shortlisted', label: 'Shortlisted' },
  { id: 'Interview', label: 'Interview' },
  { id: 'Offer', label: 'Offer' },
  { id: 'Hired', label: 'Hired' },
  { id: 'Rejected', label: 'Rejected' }
];

export function KanbanBoard({
  candidates,
  onMove,
  onView,
  favorites = [],
  onToggleFavorite
}: KanbanBoardProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[960px] grid-cols-6 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const id = event.dataTransfer.getData('text/plain');
              if (id) onMove(id, col.id);
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">{col.label}</p>
              <span className="text-xs font-semibold text-gray-500">
                {candidates.filter((c) => c.status === col.id).length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {candidates
                .filter((c) => c.status === col.id)
                .map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onView={onView}
                    isFavorite={favorites.includes(candidate.id)}
                    onToggleFavorite={onToggleFavorite}
                    draggable
                  />
                ))}
              {candidates.filter((c) => c.status === col.id).length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-3 text-xs text-gray-500">
                  No candidates here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
