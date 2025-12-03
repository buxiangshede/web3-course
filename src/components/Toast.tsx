type ToastProps = {
  type: 'success' | 'error'
  message: string
  onClose?: () => void
}

export const Toast = ({ type, message, onClose }: ToastProps) => {
  const color =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-red-200 bg-red-50 text-red-600'

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg ${color}`}>
      <span className="text-sm">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-xs uppercase tracking-wide text-slate-400 transition hover:text-slate-600"
        >
          关闭
        </button>
      )}
    </div>
  )
}
