import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { Button } from '../../components/ui/button';
import { jobs } from '../../lib/mockData';
import { JobCard } from '../../components/JobCard';
import { Card } from '../../components/ui/card';
import { TagPill } from '../../components/TagPill';
import { ShieldCheck, Sparkles, Star, Users } from 'lucide-react';

const reasons = [
  {
    title: 'Built for dental teams',
    desc: 'Roles, tags, and filters tuned for chairside support, sterilization, and digital workflows.',
    icon: <ShieldCheck className="h-6 w-6 text-brand" />
  },
  {
    title: 'Faster shortlisting',
    desc: 'Pre-screening questions and resume highlights for new grads and experienced assistants.',
    icon: <Sparkles className="h-6 w-6 text-brand" />
  },
  {
    title: 'Transparent plans',
    desc: 'Flat fees cover posts, boosts, and featured slots so clinics can budget with confidence.',
    icon: <Star className="h-6 w-6 text-brand" />
  }
];

const planHighlights = [
  { title: 'Post a job', desc: 'Reach dental assistants, nurses, interns, and coordinators with one template.' },
  { title: 'Boost visibility', desc: 'Pin your role to the top for faster views and responses.' },
  { title: 'Unlock insights', desc: 'Preview candidates and notes instantly to refine shortlists.' }
];

const testimonials = [
  { name: 'Dr. Sarah Lim', role: 'Clinical Director, Align Studio', text: 'We found two ortho assistants in under a week. The dental-specific tags filter exactly what we need.' },
  { name: 'Arif Rahman', role: 'Dental Student, KL', text: 'Quick Apply + screening questions helped me land interviews without endless emails.' },
  { name: 'Hui Min', role: 'Clinic Manager, Bluewave Dental', text: 'Operational dashboards keep spend predictable. Love the applicants pipeline view.' }
];

export default function Landing() {
  const featured = jobs.slice(0, 3);
  const navigate = useNavigate();

  return (
    <AppShell background="muted">
      <div className="grid items-center gap-10 rounded-3xl bg-gradient-to-br from-brand/5 via-white to-brand/10 px-6 py-10 shadow-sm md:grid-cols-2 md:px-10">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            Dental-only hiring platform
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900">
            Hire trusted dental assistants, students, and coordinators faster.
          </h1>
          <p className="text-lg text-gray-700">
            MR.BUR Dental Jobs is a clean, medical-grade hiring experience for clinics and students across
            Malaysia & Singapore. No generic noise-just dental talent.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate('/jobs')}>
              Find dental jobs
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/employer/post-job')}>
              Post a job
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <TagPill label="4-hand dentistry" highlighted />
            <TagPill label="Sterilization" />
            <TagPill label="Intraoral scanning" />
            <TagPill label="Implant assisting" />
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-gray-800">Featured jobs</p>
            <div className="mt-3 space-y-3">
              {featured.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{job.roleType}</p>
                    <p className="text-xs text-gray-600">{job.clinicName} - {job.city}</p>
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{job.salaryRange}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Active jobs" value="200+" />
            <MiniStat label="Dental resumes" value="5,100" />
            <MiniStat label="Avg. time to shortlist" value="48h" />
            <MiniStat label="Interviews scheduled weekly" value="320+" />
          </div>
        </div>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        {reasons.map((reason) => (
          <Card key={reason.title} className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
              {reason.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{reason.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{reason.desc}</p>
          </Card>
        ))}
      </section>

      <section className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">Featured roles</p>
            <h2 className="text-2xl font-bold text-gray-900">Dental jobs trending this week</h2>
          </div>
          <Link to="/jobs" className="text-sm font-semibold text-brand hover:text-brand-hover">
            View all jobs
          </Link>
        </div>
        <div className="grid gap-4">
          {featured.map((job) => (
            <JobCard key={job.id} job={job} onApply={() => navigate(`/jobs/${job.id}`)} />
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand">Pricing</p>
            <h3 className="text-xl font-bold text-gray-900">Transparent plans for busy clinics</h3>
            <p className="text-sm text-gray-600">Flat-rate packages cover posts, boosts, and featured roles with predictable billing.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/employer/dashboard')}>
            Explore employer tools
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {planHighlights.map((card) => (
            <Card key={card.title} className="p-4">
              <h4 className="text-sm font-semibold text-gray-900">{card.title}</h4>
              <p className="text-sm text-gray-600">{card.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand">
          <Users className="h-4 w-4" />
          Testimonials
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="p-5">
              <p className="text-sm text-gray-700">"{t.text}"</p>
              <p className="mt-3 text-sm font-semibold text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-600">{t.role}</p>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
