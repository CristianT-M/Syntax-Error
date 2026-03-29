import { Clock3, RotateCcw } from 'lucide-react'

function formatTime(value) {
  return new Date(value).toLocaleTimeString()
}

export default function TimelineReplay({
  snapshots = [],
  activeFileId,
  onRestore,
}) {
  const visible = snapshots.filter((item) => item.file_id === activeFileId)

  return (
    <div className="rounded-3xl border border-white/10 bg-[#081121] p-4">
      <div className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
        <Clock3 className="h-5 w-5" />
        Time-Travel Debugging
      </div>

      <div className="max-h-[320px] space-y-3 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="text-sm text-slate-400">
            No rewind points yet for this file.
          </div>
        ) : (
          visible.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <div className="text-sm font-medium text-white">
                {item.event_type || 'edit'}
              </div>
              <div className="text-xs text-slate-400">{item.file_name}</div>
              <div className="mt-1 text-xs text-slate-500">
                {formatTime(item.created_at)}
              </div>

              <button
                onClick={() => onRestore?.(item)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore this moment
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}