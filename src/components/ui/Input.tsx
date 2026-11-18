import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  optional?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  optional,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 7);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
          {optional && <span className="text-[11px] text-slate-400">Optional</span>}
        </div>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
