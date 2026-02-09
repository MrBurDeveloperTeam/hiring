import { Link, useNavigate } from 'react-router-dom';
import type { KeyboardEvent } from 'react';
import { Building2, MapPin, Sparkles, Star, Bookmark, X, Undo2, EyeOff, Check, Trash2 } from 'lucide-react';
import { Job } from '../lib/types';
import { Badge } from './ui/badge';
import { TagPill } from './TagPill';
import { Button } from './ui/button';
import { timeAgo, createJobSlug } from '../lib/utils';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface JobCardProps {
  job: Job;
  onApply?: (job: Job) => void;
  isSaved?: boolean;
  onToggleSave?: (job: Job) => void;
  onHide?: (job: Job) => void;
  isHidden?: boolean;
  onUndo?: () => void;
  hasApplied?: boolean;
  onDelete?: (job: Job) => void;
  canEdit?: boolean;
}

export function JobCard({ job, onApply, isSaved, onToggleSave, onHide, isHidden, onUndo, hasApplied, onDelete, canEdit }: JobCardProps) {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const goToDetails = () => !isHidden && navigate(`/jobs/${createJobSlug(job)}`);

  if (isHidden) {
    return (
      <div className="relative flex items-center justify-between rounded-3xl border border-gray-100 bg-gray-50/80 p-6 shadow-sm min-h-[160px] animate-in fade-in duration-1000 ease-in-out">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500">
            <EyeOff className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Job hidden</p>
            <p className="text-sm text-gray-500">We will not show you this job again.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onUndo?.();
          }}
          className="gap-2 bg-white hover:bg-gray-100"
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </Button>
      </div>
    );
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToDetails();
    }
  };

  return (
    <div
      className="relative block rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-brand/30 cursor-pointer group"
      onClick={goToDetails}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {/* Action buttons moved to float-right section */}

      <div className="float-right ml-4 mb-2 flex flex-col items-end gap-2 text-right">
        <div className="flex items-center gap-1">
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(job);
              }}
              className={cn(
                "rounded-full p-2 transition-colors hover:bg-gray-100",
                isSaved ? "text-brand" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
            </button>
          )}

          {userRole === 'admin' && onDelete ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(job);
              }}
              title="Delete this job"
              className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : onHide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHide(job);
              }}
              title="Hide this job"
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {job.logoUrl && (
          <div className="mb-4 h-24 w-24 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm flex items-center justify-center">
            <img
              src={job.logoUrl}
              alt={`${job.clinicName} logo`}
              className="h-full w-full object-contain p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}


      </div>

      <div className="space-y-1 mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{job.roleType}</h3>
        <div className="flex flex-col gap-1">
          <Link
            to={`/organizations/${encodeURIComponent(job.clinicName)}`}
            onClick={(e) => e.stopPropagation()}
            className="text-lg font-medium text-brand bg-brand/5 px-2 py-0.5 rounded-md w-fit hover:bg-brand/10 transition-colors"
          >
            {job.clinicName}
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>{timeAgo(job.postedAt)}</span>
            <span className="h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {job.employmentType}
            </span>
            <span className="h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.city}, {job.country}
            </span>
            <span className="h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Star className="h-3.5 w-3.5" />
              {job.experienceLevel}
            </span>
          </div>
        </div>
      </div>

      <p className="text-base text-gray-700 leading-relaxed mb-4">{job.description}</p>

      <div className="clear-both"></div>

      <div className="flex flex-col gap-2 mb-4">
        <Badge variant="default" className="text-sm w-fit">
          {job.salaryRange}
        </Badge>
        <div className="flex gap-2">
          {job.newGradWelcome && <Badge variant="info">New grad friendly</Badge>}
          {job.trainingProvided && <Badge variant="success">Training provided</Badge>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {job.specialtyTags.slice(0, 4).map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/jobs/${createJobSlug(job)}`} onClick={(event) => event.stopPropagation()}>
              Details
            </Link>
          </Button>

          {canEdit ? (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link
                to={`/employer/jobs/${createJobSlug(job)}/edit`}
                onClick={(e) => e.stopPropagation()}
              >
                Edit Job
              </Link>
            </Button>
          ) : (
            <Button
              variant={hasApplied ? "outline" : "primary"}
              size="sm"
              disabled={hasApplied}
              rightIcon={hasApplied ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation();
                if (!hasApplied) {
                  onApply?.(job);
                }
              }}
            >
              {hasApplied ? 'Applied' : 'Quick apply'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
        {job.requirements.slice(0, 2).map((req) => (
          <span key={req} className="rounded-full bg-gray-100 px-3 py-1">
            {req}
          </span>
        ))}
      </div>
    </div>
  );
}
