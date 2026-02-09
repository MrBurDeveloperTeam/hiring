import { Briefcase, ChevronDown, MapPin, Sparkles, X } from 'lucide-react';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { TagPill } from './TagPill';
import { useState } from 'react';

export interface JobFilterState {
  keyword: string;
  location: string;
  specialty: string;
  employmentType: string;
  shiftType: string;
  newGrad: boolean;
  training: boolean;
  internship: boolean;
  experienceLevel: string;
  salaryMin: number;
}

interface JobFiltersProps {
  values: JobFilterState;
  onChange: (values: JobFilterState) => void;
  onReset: () => void;
  sortBy?: string;
  onSortChange?: (value: string) => void;
  compact?: boolean;
}

const specialtyOptions = [
  '4-hand dentistry',
  'Sterilization',
  'Intraoral scanning',
  'Orthodontics',
  'Implants',
  'Pediatric',
  'Surgery'
];

export function JobFilters({ values, onChange, onReset, sortBy, onSortChange, compact }: JobFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const handleChange = (field: keyof JobFilterState, value: string | boolean | number) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-800">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-brand" />
          <span>Filters</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs"
          icon={
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
            />
          }
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
        aria-hidden={!isExpanded}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            label="Keyword"
            placeholder="Assistant, implant, ortho..."
            value={values.keyword}
            onChange={(e) => handleChange('keyword', e.target.value)}
            className="min-w-[220px]"
          />
          <Input
            label="Location"
            placeholder="Kuala Lumpur, Singapore..."
            icon={<MapPin className="h-4 w-4" />}
            value={values.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="min-w-[220px]"
          />
          <Select
            label="Specialty"
            value={values.specialty}
            onChange={(e) => handleChange('specialty', e.target.value)}
          >
            <option value="">All specialties</option>
            {specialtyOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
          <Select
            label="Experience"
            value={values.experienceLevel}
            onChange={(e) => handleChange('experienceLevel', e.target.value)}
          >
            <option value="">All levels</option>
            <option>Student</option>
            <option>New Grad</option>
            <option>Junior</option>
            <option>Mid</option>
            <option>Senior</option>
          </Select>
          <Select
            label="Employment"
            value={values.employmentType}
            onChange={(e) => handleChange('employmentType', e.target.value)}
          >
            <option value="">Any</option>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Locum</option>
            <option>Contract</option>
          </Select>
          <Select
            label="Shift"
            value={values.shiftType}
            onChange={(e) => handleChange('shiftType', e.target.value)}
          >
            <option value="">Any</option>
            <option>Day</option>
            <option>Night</option>
            <option>Rotating</option>
          </Select>
          <Checkbox
            label="New grad"
            description="Mentorship-ready"
            checked={values.newGrad}
            onChange={(e) => handleChange('newGrad', e.target.checked)}
          />
          <Checkbox
            label="Training"
            description="Onboarding included"
            checked={values.training}
            onChange={(e) => handleChange('training', e.target.checked)}
          />
          <Checkbox
            label="Internship"
            description="Student friendly"
            checked={values.internship}
            onChange={(e) => handleChange('internship', e.target.checked)}
          />
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>Minimum salary</span>
              <span className="text-gray-900">
                {values.salaryMin === 0 ? 'Any' : `MYR ${values.salaryMin.toLocaleString()}`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={6000}
              step={100}
              value={values.salaryMin}
              onChange={(e) => handleChange('salaryMin', Number(e.target.value))}
              className="mt-2 w-full accent-brand"
            />
          </div>
          {onSortChange && (
            <div className="min-w-[220px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
              <div className="text-xs font-semibold text-gray-500">Sort by</div>
              <Select className="mt-2" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="salary">Salary</option>
              </Select>
            </div>
          )}
          {onSortChange && (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
              <Button
                variant="primary"
                onClick={() => onChange(values)}
                icon={<Sparkles className="h-4 w-4 text-amber-500" />}
                className="min-w-[140px] whitespace-nowrap"
              >
                Apply filters
              </Button>
              <Button variant="ghost" onClick={onReset} className="text-gray-600" icon={<X className="h-4 w-4" />}>
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && compact && (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <TagPill label="Dental roles" />
          <TagPill label="Clinics" />
        </div>
      )}
    </div>
  );
}
