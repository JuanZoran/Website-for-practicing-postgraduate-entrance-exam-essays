import PropTypes from 'prop-types';
import { Check } from 'lucide-react';

const StepIndicator = ({ currentStep }) => {
  const steps = ["思考", "翻译", "成文"];
  
  return (
    <div className="flex justify-center items-center gap-3 mb-6 py-1">
      {steps.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 transition-all duration-500 ${i === currentStep ? 'opacity-100' : i < currentStep ? 'opacity-60' : 'opacity-30'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500 ${
              i === currentStep 
                ? 'bg-indigo-600 text-white scale-110' 
                : i < currentStep 
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === currentStep ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{t}</span>
          </div>
          {i < 2 && <div className={`w-6 h-0.5 rounded-full transition-colors duration-500 ${i < currentStep ? 'bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
        </div>
      ))}
    </div>
  );
};

StepIndicator.propTypes = {
  currentStep: PropTypes.number.isRequired,
};

export default StepIndicator;