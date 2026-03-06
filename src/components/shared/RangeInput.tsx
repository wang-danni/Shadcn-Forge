interface RangeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

export const RangeInput: React.FC<RangeInputProps> = ({ 
  label, value, min, max, step, unit, onChange 
}) => (
  <div className="space-y-2 group">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 rounded">
        {isNaN(value) ? min : value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={isNaN(value) ? min : value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);