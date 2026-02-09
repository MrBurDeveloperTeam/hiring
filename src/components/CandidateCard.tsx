import { GraduationCap, Star } from 'lucide-react';
import { Candidate } from '../lib/types';
import { TagPill } from './TagPill';

interface CandidateCardProps {
  candidate: Candidate;
  onView: (candidate: Candidate) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  draggable?: boolean;
}

export function CandidateCard({
  candidate,
  onView,
  isFavorite,
  onToggleFavorite,
  draggable
}: CandidateCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(candidate)}
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', candidate.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onView(candidate);
        }
      }}
      className="relative flex w-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-brand/40 hover:shadow-md overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite?.(candidate.id);
        }}
        className="absolute right-3 top-3 rounded-full p-1.5 text-gray-300 transition hover:text-amber-500"
        aria-pressed={isFavorite}
        aria-label="Toggle favorite"
      >
        <Star className={`h-4 w-4 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
      </button>
      <div className="pr-7">
        <p className="text-sm font-semibold text-gray-900">{candidate.name}</p>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-600 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="h-4 w-4 text-brand" />
            <span className="truncate max-w-[100px]">{candidate.school}</span>
          </span>
          <span className="text-gray-300">-</span>
          <span className="whitespace-nowrap">Grad {candidate.gradDate}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {candidate.skills.slice(0, 2).map((skill) => (
          <TagPill key={skill} label={skill} />
        ))}
        {candidate.skills.length > 2 && <TagPill label={`+${candidate.skills.length - 2} more`} />}
      </div>
    </div>
  );
}
