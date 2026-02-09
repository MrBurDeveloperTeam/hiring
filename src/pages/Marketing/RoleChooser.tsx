import { Link } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { Card } from '../../components/ui/card';
import { Briefcase, Building2 } from 'lucide-react';

export default function RoleChooser() {
  return (
    <AppShell showFooter={false} background="muted">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 py-8 text-center">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">MR.BUR Dental Jobs</p>
          <h1 className="text-3xl font-bold text-gray-900">Choose your workspace</h1>
          <p className="text-sm text-gray-600">A clean, dental-first hiring experience for students and clinics.</p>
        </div>
        <div className="grid w-full gap-4 md:grid-cols-2">
          <Link to="/seekers">
            <Card className="group flex h-full flex-col gap-4 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">I'm a Job Seeker</p>
                <p className="text-sm text-gray-600">
                  Browse dental jobs, quick apply, and track your applications.
                </p>
              </div>
              <span className="text-sm font-semibold text-brand group-hover:text-brand-hover">
                Go to seeker home &gt;
              </span>
            </Card>
          </Link>
          <Link to="/employers">
            <Card className="group flex h-full flex-col gap-4 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">I'm an Employer</p>
                <p className="text-sm text-gray-600">
                  Post jobs and manage your applicants pipeline with clarity.
                </p>
              </div>
              <span className="text-sm font-semibold text-brand group-hover:text-brand-hover">
                Go to employer home &gt;
              </span>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
