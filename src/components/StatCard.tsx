interface Props {
  title: string
  value: string
  description: string
}

export const StatCard = ({ title, value, description }: Props) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
    <p className="text-xs text-slate-500">{description}</p>
  </div>
)
