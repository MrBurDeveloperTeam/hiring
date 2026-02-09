import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-white/50 bg-white/80 backdrop-blur">
      <div className="container-wide grid gap-6 py-8 md:grid-cols-4">
        <div>
          <img
            src="/Mr_Bur_Logo.png"
            alt="MR.BUR Dental Jobs logo"
            className="h-10 w-auto object-contain"
            loading="lazy"
          />
          <p className="mt-3 text-sm text-gray-600">
            A dedicated hiring marketplace for dental talent across Southeast Asia.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Product</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
            <Link to="/jobs">Jobs</Link>
            <Link to="/employers">Employers</Link>
            <Link to="/seekers">Seekers</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Company</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
            <Link to="/">Role chooser</Link>
            <Link to="/about">About</Link>
            <a href="mailto:hello@mrburdental.com">Contact</a>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Resources</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
            <span>Dental hiring tips</span>
            <span>Interview kits</span>
            <span>Clinic onboarding guide</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/60 py-4">
        <div className="container-wide flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} MR.BUR Dental Jobs</span>
          <div className="flex gap-4">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
