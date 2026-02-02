
import React from 'react';

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (newValue: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

const NumberStepper: React.FC<NumberStepperProps> = ({
  label,
  value,
  onChange,
  step = 1,
  min = -Infinity,
  max = Infinity,
}) => {

  const handleIncrement = () => {
    onChange(Math.min(max, value + step));
  };
  
  const handleDecrement = () => {
    onChange(Math.max(min, value - step));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={handleDecrement} className="w-10 h-10 bg-gray-700 rounded-md text-xl font-bold text-white hover:bg-gray-600 transition">-</button>
        <input 
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white text-center font-semibold text-lg focus:ring-emerald-500 focus:border-emerald-500"
        />
        <button type="button" onClick={handleIncrement} className="w-10 h-10 bg-gray-700 rounded-md text-xl font-bold text-white hover:bg-gray-600 transition">+</button>
      </div>
    </div>
  );
};

export default NumberStepper;
