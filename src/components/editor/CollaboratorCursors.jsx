import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CURSOR_COLORS = {
  'Ana M.': { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500' },
  'Radu P.': { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
  'iTECify AI': { bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-500' },
};

export default function CollaboratorCursors() {
  const [cursors, setCursors] = useState([
    { name: 'Ana M.', line: 4, col: 18 },
    { name: 'Radu P.', line: 12, col: 8 },
    { name: 'iTECify AI', line: 8, col: 0 },
  ]);

  // Simulate cursor movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCursors(prev => prev.map(c => ({
        ...c,
        line: Math.max(1, c.line + Math.floor(Math.random() * 3) - 1),
        col: Math.max(0, c.col + Math.floor(Math.random() * 5) - 2),
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {cursors.map((cursor) => {
        const colors = CURSOR_COLORS[cursor.name] || { bg: 'bg-amber-500', text: 'text-amber-500' };
        const top = (cursor.line - 1) * 22 + 8;
        const left = cursor.col * 8.4 + 52;

        return (
          <motion.div
            key={cursor.name}
            className="absolute pointer-events-none z-10"
            animate={{ top, left }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            <div className={`w-0.5 h-5 ${colors.bg} animate-cursor-blink`} />
            <div className={`${colors.bg} px-1.5 py-0.5 rounded-sm text-[9px] font-medium text-white whitespace-nowrap -mt-0.5`}>
              {cursor.name}
            </div>
          </motion.div>
        );
      })}
    </>
  );
}