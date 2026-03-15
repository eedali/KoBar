import React, { useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import TooltipButton from './TooltipButton';

const CalculatorButton: React.FC = () => {
    const { t, isCalculatorOpen, setIsCalculatorOpen, setCalculatorAnchorRect } = useAppStore();
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleToggle = () => {
        if (!isCalculatorOpen && buttonRef.current) {
            const r = buttonRef.current.getBoundingClientRect();
            setCalculatorAnchorRect({ 
                top: r.top, left: r.left, bottom: r.bottom, 
                right: r.right, width: r.width, height: r.height 
            });
        }
        setIsCalculatorOpen(!isCalculatorOpen);
    };

    return (
        <div className="relative group flex items-center justify-center w-full no-drag-region">
            <TooltipButton
                buttonRef={buttonRef}
                onClick={handleToggle}
                className={`p-1.5 transition-colors relative flex items-center justify-center w-10 h-10 rounded-full ${isCalculatorOpen ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-200'}`}
                label={t('calculator')}
            >
                <span className="material-symbols-outlined text-[20px]">calculate</span>
            </TooltipButton>
        </div>
    );
};

export default CalculatorButton;
