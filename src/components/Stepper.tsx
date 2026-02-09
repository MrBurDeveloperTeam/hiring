interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  activeStep: number;
}

export function Stepper({ steps, activeStep }: StepperProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 md:grid-cols-4">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          return (
            <div
              key={step.id}
              className={`rounded-xl border p-4 transition ${
                isActive
                  ? 'border-brand bg-brand/10'
                  : isCompleted
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <p>{step.title}</p>
                  {step.description && <p className="text-xs text-gray-600">{step.description}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
