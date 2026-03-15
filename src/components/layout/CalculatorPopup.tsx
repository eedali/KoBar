import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';

const CalculatorPopup: React.FC = () => {
    const { t, edgePosition, calculatorAnchorRect, setIsCalculatorOpen } = useAppStore();
    const [display, setDisplay] = useState('0');
    const [prevValue, setPrevValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const popupRef = useRef<HTMLDivElement>(null);

    const getPopupStyle = (): React.CSSProperties => {
        if (!calculatorAnchorRect) return { display: 'none' };
        
        const rect = calculatorAnchorRect;
        
        const style: React.CSSProperties = {
            position: 'fixed',
            top: Math.max(10, rect.top), 
            zIndex: 99999,
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-border)',
        };

        if (edgePosition === 'left') {
            style.left = rect.right + 12;
        } else {
            style.left = rect.left - 256 - 12; // 256 is w-64
        }
        return style;
    };

    const handleDigit = (digit: string) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const handleOperator = (nextOperator: string) => {
        const inputValue = parseFloat(display);

        if (prevValue === null) {
            setPrevValue(inputValue);
        } else if (operator) {
            const result = performCalculation();
            setPrevValue(result);
            setDisplay(String(result));
        }

        setWaitingForOperand(true);
        setOperator(nextOperator);
    };

    const performCalculation = () => {
        const inputValue = parseFloat(display);
        if (prevValue === null || operator === null) return inputValue;

        switch (operator) {
            case '+': return prevValue + inputValue;
            case '-': return prevValue - inputValue;
            case '×': return prevValue * inputValue;
            case '÷': return prevValue / inputValue;
            default: return inputValue;
        }
    };

    const handleEqual = () => {
        if (!operator) return;
        const result = performCalculation();
        setDisplay(String(result));
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    const handleClear = () => {
        setDisplay('0');
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    const handleBackspace = () => {
        if (waitingForOperand) return;
        if (display === '0') return;
        if (display.length === 1) {
            setDisplay('0');
        } else {
            setDisplay(display.slice(0, -1));
        }
    };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // If any input/textarea is focused, don't hijack keys
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

            const { key } = e;

            if (/[0-9]/.test(key)) {
                handleDigit(key);
            } else if (key === '.' || key === ',') {
                if (!display.includes('.')) handleDigit('.');
            } else if (key === '+') {
                handleOperator('+');
            } else if (key === '-') {
                handleOperator('-');
            } else if (key === '*' || key.toLowerCase() === 'x') {
                handleOperator('×');
            } else if (key === '/') {
                handleOperator('÷');
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                handleEqual();
            } else if (key === 'Backspace') {
                handleBackspace();
            } else if (key === 'Escape' || key.toLowerCase() === 'c') {
                handleClear();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [display, prevValue, operator, waitingForOperand]);

    const CalcButton = ({ onClick, children, className = '' }: any) => (
        <button
            onClick={onClick}
            className={`h-11 flex items-center justify-center rounded-lg text-lg font-medium transition-all active:scale-95 no-drag-region ${className}`}
        >
            {children}
        </button>
    );

    return (
        <div
            ref={popupRef}
            className="w-64 rounded-xl border p-4 shadow-2xl pointer-events-auto animate-in fade-in zoom-in duration-200"
            style={getPopupStyle()}
        >
            {/* Header with Close Button */}
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">{t('calculator')}</span>
                <button 
                    onClick={() => setIsCalculatorOpen(false)}
                    className="w-6 h-6 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-all no-drag-region"
                >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
            </div>

            {/* Display */}
            <div className="bg-black/20 rounded-lg p-3 mb-4 text-right border" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="text-xs text-slate-500 h-4 overflow-hidden tabular-nums">
                    {prevValue !== null ? `${prevValue} ${operator}` : ''}
                </div>
                <div className="text-2xl font-bold text-slate-200 overflow-hidden truncate tabular-nums">
                    {display}
                </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-2">
                <CalcButton onClick={handleClear} className="col-span-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20">C</CalcButton>
                <CalcButton onClick={() => handleOperator('÷')} className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">÷</CalcButton>
                <CalcButton onClick={() => handleOperator('×')} className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">×</CalcButton>

                {[7, 8, 9].map(n => (
                    <CalcButton key={n} onClick={() => handleDigit(String(n))} className="bg-slate-700/50 text-slate-200 hover:bg-slate-700"> {n} </CalcButton>
                ))}
                <CalcButton onClick={() => handleOperator('-')} className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">−</CalcButton>

                {[4, 5, 6].map(n => (
                    <CalcButton key={n} onClick={() => handleDigit(String(n))} className="bg-slate-700/50 text-slate-200 hover:bg-slate-700"> {n} </CalcButton>
                ))}
                <CalcButton onClick={() => handleOperator('+')} className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">+</CalcButton>

                {[1, 2, 3].map(n => (
                    <CalcButton key={n} onClick={() => handleDigit(String(n))} className="bg-slate-700/50 text-slate-200 hover:bg-slate-700"> {n} </CalcButton>
                ))}
                <CalcButton onClick={handleEqual} className="row-span-2 h-full bg-primary text-slate-900 hover:opacity-90 font-bold">=</CalcButton>

                <CalcButton onClick={() => handleDigit('0')} className="col-span-2 bg-slate-700/50 text-slate-200 hover:bg-slate-700">0</CalcButton>
                <CalcButton onClick={() => !display.includes('.') && handleDigit('.')} className="bg-slate-700/50 text-slate-200 hover:bg-slate-700">.</CalcButton>
            </div>
        </div>
    );
};

export default CalculatorPopup;
