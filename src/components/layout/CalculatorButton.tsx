import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/useAppStore';
import TooltipButton from './TooltipButton';

const CalculatorButton: React.FC = () => {
    const { t, edgePosition } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const [display, setDisplay] = useState('0');
    const [prevValue, setPrevValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && 
                popupRef.current && !popupRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const getPopupStyle = (): React.CSSProperties => {
        if (!buttonRef.current) return {};
        const rect = buttonRef.current.getBoundingClientRect();
        const style: React.CSSProperties = {
            position: 'fixed',
            bottom: window.innerHeight - rect.bottom,
            zIndex: 9999,
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-border)',
        };
        if (edgePosition === 'left') {
            style.left = rect.right + 12;
        } else {
            style.right = window.innerWidth - rect.left + 12;
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

    const CalcButton = ({ onClick, children, className = '' }: any) => (
        <button
            onClick={onClick}
            className={`h-12 flex items-center justify-center rounded-lg text-lg font-medium transition-all active:scale-95 no-drag-region ${className}`}
        >
            {children}
        </button>
    );

    return (
        <div className="relative group flex items-center justify-center w-full no-drag-region">
            <TooltipButton
                buttonRef={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors relative flex items-center justify-center w-10 h-10 rounded-full"
                label={t('calculator')}
            >
                <span className="material-symbols-outlined text-[20px]">calculate</span>
            </TooltipButton>

            {isOpen && createPortal(
                <div
                    ref={popupRef}
                    className="w-64 rounded-xl border p-4 shadow-2xl pointer-events-auto animate-in fade-in zoom-in duration-200"
                    style={getPopupStyle()}
                >
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
                </div>,
                document.body
            )}
        </div>
    );
};

export default CalculatorButton;
