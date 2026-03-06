import React from 'react';
import { Type } from 'lucide-react';
import { useForgeStore } from '@/store/forgeStore';

export const InspectView: React.FC = () => {
  const { canvasItems } = useForgeStore();

  return (
    <div className="w-full max-w-4xl h-full bg-white dark:bg-[#0d0d0d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 overflow-y-auto font-mono text-sm shadow-xl">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200 dark:border-slate-800/60">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Type size={16} />
        </div>
        <span className="font-bold text-slate-800 dark:text-slate-200">Virtual DOM Tree</span>
      </div>

      <div className="space-y-6">
        {canvasItems.map((item) => (
          <div 
            key={item.id} 
            className="pl-6 border-l-[3px] border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors py-2"
          >
            <div className="text-emerald-600 dark:text-emerald-400 font-bold mb-2">
              <span className="text-slate-400 font-normal">{'<'}</span>
              {item.type}
              <span className="text-slate-400 font-normal text-xs ml-2">
                key="{item.id}"
              </span>
            </div>

            <div className="pl-6 space-y-1.5 text-slate-600 dark:text-slate-300 text-xs">
              {Object.entries(item.props).map(([key, val]) => (
                <div key={key}>
                  <span className="text-blue-600 dark:text-blue-300">{key}</span>=
                  <span className="text-orange-600 dark:text-orange-300">
                    {typeof val === 'string' ? `"${val}"` : `{${String(val)}}`}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-2">
              <span className="text-slate-400 font-normal">{'/>'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};