import { PurchaseStep } from '../types/course'

interface Props {
  steps: PurchaseStep[]
}

export const PurchaseFlow = ({ steps }: Props) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-primary">课程购买流程</h2>
      <p className="text-xs text-slate-500">完成授权后方可解锁内容链接</p>
    </div>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {steps.map((step) => (
        <div key={step.title} className="rounded-2xl border border-slate-100 bg-surface-muted p-4 text-sm text-slate-600">
          <p className="text-base font-semibold text-primary">{step.title}</p>
          <p className="mt-2 text-slate-500">{step.description}</p>
        </div>
      ))}
    </div>
  </div>
)
