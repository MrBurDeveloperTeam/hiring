import { AppShell } from '../../layouts/AppShell';
import { Card } from '../../components/ui/card';

export default function About() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <p className="text-sm font-semibold text-brand">About MR.BUR Dental Jobs</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Built for dental clinics and students.</h1>
          <p className="mt-3 text-lg text-gray-700">
            MR.BUR Dental Jobs is a specialized hiring experience tailored for dental assistants, nurses,
            treatment coordinators, and dental students. Our mission is to make clinical hiring predictable,
            transparent, and trustworthy.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-gray-900">Dental-first taxonomy</h3>
            <p className="mt-2 text-sm text-gray-600">
              Specialty tags like 4-hand dentistry, sterilization, intraoral scanning, implant chairside, and ortho workflows.
            </p>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-gray-900">Transparent pricing</h3>
            <p className="mt-2 text-sm text-gray-600">
              Flat-rate packages cover posting, boosting, and featuring roles so clinics can plan their hiring spend.
            </p>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-gray-900">Friendly for new grads</h3>
            <p className="mt-2 text-sm text-gray-600">
              Clinics can highlight training provided and new grad welcome. Students can upload resumes and track applications.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
