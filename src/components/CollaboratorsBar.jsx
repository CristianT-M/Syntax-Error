export default function CollaboratorsBar({ collaborators = [] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Live collaborators
      </span>

      {collaborators.length === 0 ? (
        <span className="text-sm text-slate-400">Only you are here</span>
      ) : (
        collaborators.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1727] px-3 py-1.5"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: member.color }}
            />
            <span className="text-sm text-white">{member.username}</span>
          </div>
        ))
      )}
    </div>
  )
}