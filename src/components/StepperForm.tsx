import { ReactNode } from 'react';
import { Stepper } from './Stepper';

interface StepperFormProps {
  steps: Array<{ id: string; title: string; description?: string }>;
  activeStep: number;
  children: ReactNode;
}

export function StepperForm({ steps, activeStep, children }: StepperFormProps) {
  return (
    <div className="space-y-5">
      <Stepper steps={steps} activeStep={activeStep} />
      <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-sm">{children}</div>
    </div>
  );
}
