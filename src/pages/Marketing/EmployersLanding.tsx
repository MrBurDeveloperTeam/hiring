import { Link } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { TagPill } from '../../components/TagPill';
import { Stepper } from '../../components/Stepper';
import { candidates } from '../../lib/mockData';
import { ClipboardList, Clock, FileCheck, Sparkles, Wallet } from 'lucide-react';

const quickActions = [
  {
    title: 'Post a Job',
    desc: 'Launch a dental role with templates and chairside skill checkboxes.',
    to: '/employer/post-job'
  },
  {
    title: 'Browse Candidates',
    desc: 'Preview dental student and assistant profiles in one dashboard.',
    to: '/employer/applicants'
  },
  {
    title: 'Track Applicants',
    desc: 'Move candidates through Applied -> Hired in a visual pipeline.',
    to: '/employer/applicants'
  }
];

const advantages = [
  'Dental role templates',
  'Chairside skill checkboxes',
  'Internship intake mode',
  'Shift-based hiring',
  'Clinic profile credibility'
];

const faq = [
  {
    q: 'How does pricing work?',
    a: 'Flat-fee plans cover job posts, boosts, and featured listings so clinics can budget confidently.'
  },
  { q: 'Can I reuse templates?', a: 'Yes, save job templates and reuse requirements for similar roles.' },
  { q: 'Do you support internships?', a: 'Internship and attachment filters help clinics find student talent quickly.' }
];

const hiringStats = [
  { label: 'Avg. time to shortlist', value: '48 hrs' },
  { label: 'Active clinics', value: '180+' },
  { label: 'Qualified matches', value: '1,920' }
];

const processHighlights = [
  {
    title: 'Launch your role',
    desc: 'Dental templates and clinical checklists get jobs live in minutes.'
  },
  {
    title: 'Boost visibility',
    desc: 'Feature listings and share across channels to draw the right candidates.'
  },
  {
    title: 'Close faster',
    desc: 'Pipeline clarity keeps candidates flowing from Applied to Hired with ease.'
  }
];

export default function EmployersLanding() {
  return (
    <AppShell background="muted">
      <section className="section relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-white to-brand/20 p-6 shadow-sm md:p-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              Employer Studio
            </p>
            <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">Hire trusted dental talent faster.</h1>
            <p className="text-lg text-gray-600">
              Dental-first hiring with role templates, clinical skill checklists, and transparent pricing that keeps every posting predictable.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="lg" asChild className="hover:text-white">
                <Link to="/employer/post-job">Post a Job</Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/employer/applicants">Browse Candidates</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <TagPill label="Dental-specific matching" />
              <TagPill label="Transparent billing" />
              <TagPill label="Applicants pipeline" />
            </div>
          </div>
          <div className="grid gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Wallet className="h-4 w-4 text-brand" />
                Hiring velocity
              </div>
              <div className="mt-4 grid gap-3">
                {hiringStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-semibold text-gray-900">Premium hiring perks</p>
              <p className="mt-2 text-sm text-gray-600">
                Boost listings and feature roles to surface your clinic first in seeker searches.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand">
                <Sparkles className="h-4 w-4" />
                Token boosts included
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="section mt-10 grid gap-4 md:grid-cols-3 md:auto-rows-fr items-stretch">
        {quickActions.map((item) => (
          <Card key={item.title} className="flex h-full flex-col p-6">
            <div>
              <p className="text-lg font-semibold text-gray-900">{item.title}</p>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
            </div>
            <div className="mt-auto pt-4">
              <Link to={item.to} className="inline-flex text-sm font-semibold text-brand">
                Go now &gt;
              </Link>
            </div>
          </Card>
        ))}
      </section>

      <section className="section mt-12 rounded-3xl bg-white/90 p-6 shadow-sm md:p-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">How it works</p>
            <h2 className="text-2xl font-bold text-gray-900">Predictable hiring in three steps</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {processHighlights.map((item) => (
            <Card key={item.title} className="p-5">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section mt-12 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-lg font-semibold text-gray-900">Dental-specific job posting advantages</p>
          <div className="mt-4 grid gap-2">
            {advantages.map((adv) => (
              <div key={adv} className="flex items-center gap-2 text-sm text-gray-700">
                <FileCheck className="h-4 w-4 text-brand" />
                {adv}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-lg font-semibold text-gray-900">Post in 2 minutes</p>
          <Stepper
            steps={[
              { id: '1', title: 'Job basics' },
              { id: '2', title: 'Dental requirements' },
              { id: '3', title: 'Schedule & salary' },
              { id: '4', title: 'Publish' }
            ]}
            activeStep={1}
          />
        </Card>
      </section>

      <section className="section mt-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">Applicants pipeline preview</p>
            <h2 className="text-2xl font-bold text-gray-900">Keep hiring stages visible</h2>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/employer/applicants">Open pipeline</Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {['Applied', 'Interview', 'Offer'].map((stage) => (
            <Card key={stage} className="p-4">
              <p className="text-sm font-semibold text-gray-900">{stage}</p>
              <div className="mt-3 space-y-2">
                {candidates
                  .filter((c) => c.status === stage)
                  .slice(0, 2)
                  .map((cand) => (
                    <div key={cand.id} className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {cand.name}
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="section mt-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">Candidate previews</p>
            <h2 className="text-2xl font-bold text-gray-900">Top matches ready today</h2>
          </div>
          <Button variant="primary" size="sm" asChild className="hover:text-white">
            <Link to="/employer/applicants">View all</Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.slice(0, 6).map((cand) => (
            <Card key={cand.id} className="p-5">
              <p className="text-sm font-semibold text-gray-900">{cand.name}</p>
              <p className="text-xs text-gray-500">
                {cand.school} - Grad {cand.gradDate.slice(0, 4)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cand.skills.slice(0, 3).map((skill) => (
                  <TagPill key={skill} label={skill} />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Rating {cand.rating.toFixed(1)}</span>
                <Link to="/employer/applicants" className="font-semibold text-brand">
                  View &gt;
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="section mt-12 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm font-semibold text-brand">Testimonials</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">"We hired two assistants in a week."</p>
          <p className="text-sm text-gray-600">- Dr. Sarah Lim, Align Studio</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-semibold text-brand">Why clinics trust MR.BUR</p>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand" />
              Faster turnaround on shortlisting
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-brand" />
              Structured dental requirements
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              Premium hiring insights
            </div>
          </div>
        </Card>
      </section>

      <section className="section mt-12 rounded-3xl bg-white/90 p-6 shadow-sm md:p-10">
        <h3 className="text-xl font-semibold text-gray-900">Employer FAQ</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {faq.map((item) => (
            <Card key={item.q} className="p-4">
              <p className="text-sm font-semibold text-gray-900">{item.q}</p>
              <p className="text-sm text-gray-600">{item.a}</p>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
