interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => (
  <div className="space-y-1.5 group">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
    </div>
    <div className="flex gap-2">
      <div className="relative w-8 h-8 rounded-md overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 text-xs font-mono text-slate-700 dark:text-slate-300 outline-none uppercase"
      />
    </div>
  </div>
);