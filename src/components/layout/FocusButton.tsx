import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/useAppStore';
import TooltipButton from './TooltipButton';

const MELODIES = ['Alarm', 'Bells', 'Calming', 'Cosmic', 'Guitar', 'Hiphop', 'Ringtones'];

const FocusButton: React.FC = () => {
    const { t, edgePosition, focusSettings, setFocusSettings, isFocusActive, focusRemainingTime, startFocusMode, stopFocusMode } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    
    // Preview logic
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [melodyDropdownOpen, setMelodyDropdownOpen] = useState(false);
    const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

    // Alarm logic
    const [isAlarmRinging, setIsAlarmRinging] = useState(false);
    const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

    // Load initial values into local state for the panel
    const [localMin, setLocalMin] = useState(focusSettings.minutes);
    const [localSec, setLocalSec] = useState(focusSettings.seconds);
    const [localMelody, setLocalMelody] = useState(focusSettings.melody);
    const [localLoop, setLocalLoop] = useState(focusSettings.loop);

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const stopPreview = () => {
        if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            audioPreviewRef.current.currentTime = 0;
        }
        setIsPlayingPreview(false);
    };

    const togglePreview = async () => {
        if (isPlayingPreview) {
            stopPreview();
            return;
        }
        
        try {
            const base64 = await window.api?.getMelodyAudio(localMelody);
            if (base64) {
                if (audioPreviewRef.current) {
                    audioPreviewRef.current.pause();
                }
                const audio = new Audio(base64);
                audio.loop = false; // Preview never loops indefinitely, or maybe it should? The prompt implies playing selected sound. Let's not loop preview.
                audio.onended = () => setIsPlayingPreview(false);
                audioPreviewRef.current = audio;
                audio.play();
                setIsPlayingPreview(true);
            }
        } catch (e) {
            console.error('Playback error', e);
        }
    };

    const stopAlarm = () => {
        if (alarmAudioRef.current) {
            alarmAudioRef.current.pause();
            alarmAudioRef.current.currentTime = 0;
            alarmAudioRef.current = null;
        }
        setIsAlarmRinging(false);
    };

    // When focusRemainingTime hits 0 from an active state, we trigger alarm
    const prevTimeRef = useRef(focusRemainingTime);
    useEffect(() => {
        if (isFocusActive && focusRemainingTime === 0 && prevTimeRef.current > 0) {
            // Timer just hit 0!
            triggerAlarm();
        }
        prevTimeRef.current = focusRemainingTime;
    }, [focusRemainingTime, isFocusActive]);

    const triggerAlarm = async () => {
        stopFocusMode();
        setIsAlarmRinging(true);
        try {
            const base64 = await window.api?.getMelodyAudio(focusSettings.melody);
            if (base64) {
                const audio = new Audio(base64);
                audio.loop = focusSettings.loop;
                alarmAudioRef.current = audio;
                audio.play();
                
                // If not looping, we stop state when it ends
                if (!focusSettings.loop) {
                    audio.onended = () => {
                        setIsAlarmRinging(false);
                        alarmAudioRef.current = null;
                    };
                }
            }
        } catch(e) {
            console.error('Alarm error', e);
        }
    };

    const handleMainButtonClick = () => {
        if (isAlarmRinging) {
            // Dismiss alarm
            stopAlarm();
            return;
        }
        if (isFocusActive) {
            // If running, clicking it could open settings or do nothing. Prompt says:
            // "Süre dolduğunda kum saati iconu geri gelecek..." means during focus it's mm:ss
            // Let's just open/close popup
            setIsOpen(!isOpen);
        } else {
            // Not running
            setIsOpen(!isOpen);
        }
    };

    const handleStart = () => {
        // Save settings
        setFocusSettings({
            minutes: localMin,
            seconds: localSec,
            melody: localMelody,
            loop: localLoop
        });
        stopPreview();
        startFocusMode();
        setIsOpen(false);
    };

    // Keep local synced with store if opened when not active
    useEffect(() => {
        if (isOpen && !isFocusActive) {
            setLocalMin(focusSettings.minutes);
            setLocalSec(focusSettings.seconds);
            setLocalMelody(focusSettings.melody);
            setLocalLoop(focusSettings.loop);
        }
    }, [isOpen, isFocusActive, focusSettings]);

    // Handle clicks outside popup
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
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

    // Compute popup position from button rect
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

    return (
        <div className="relative group flex items-center justify-center w-full no-drag-region">
            
            {/* Main Button */}
            <TooltipButton
                buttonRef={buttonRef}
                onClick={handleMainButtonClick}
                className={`p-1.5 transition-colors relative flex items-center justify-center w-10 h-10 rounded-full
                    ${isAlarmRinging ? 'animate-[pulse_1s_ease-in-out_infinite] bg-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'text-slate-400 hover:text-slate-200'}
                `}
                label={t('focusMode')}
            >
                {isFocusActive ? (
                    <span className="text-xs font-bold text-primary tracking-wider">{formatTime(focusRemainingTime)}</span>
                ) : (
                    <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
                )}
            </TooltipButton>

            {/* Popup Panel */}
            {isOpen && createPortal(
                <div
                    ref={popupRef}
                    className="w-64 rounded-xl border p-4 shadow-2xl pointer-events-auto animate-in fade-in zoom-in duration-200 overflow-visible"
                    style={getPopupStyle()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-primary font-bold">{t('focusMode')}</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>

                    {/* Time Pickers */}
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="text-xs text-slate-400 mb-1 block">{t('minutes')}</label>
                            <div className="flex items-center border rounded overflow-hidden" style={{ borderColor: 'var(--theme-border)' }}>
                                <button
                                    type="button"
                                    disabled={isFocusActive || localMin <= 0}
                                    onClick={() => setLocalMin(m => Math.max(0, m - 1))}
                                    className="px-2 py-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[14px]">remove</span>
                                </button>
                                <span className="flex-1 text-center text-slate-200 text-sm py-1 tabular-nums">{localMin}</span>
                                <button
                                    type="button"
                                    disabled={isFocusActive || localMin >= 120}
                                    onClick={() => setLocalMin(m => Math.min(120, m + 1))}
                                    className="px-2 py-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-slate-400 mb-1 block">{t('seconds')}</label>
                            <div className="flex items-center border rounded overflow-hidden" style={{ borderColor: 'var(--theme-border)' }}>
                                <button
                                    type="button"
                                    disabled={isFocusActive || localSec <= 0}
                                    onClick={() => setLocalSec(s => Math.max(0, s - 1))}
                                    className="px-2 py-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[14px]">remove</span>
                                </button>
                                <span className="flex-1 text-center text-slate-200 text-sm py-1 tabular-nums">{localSec}</span>
                                <button
                                    type="button"
                                    disabled={isFocusActive || localSec >= 59}
                                    onClick={() => setLocalSec(s => Math.min(59, s + 1))}
                                    className="px-2 py-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Melody Selection */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <button
                                    type="button"
                                    onClick={() => !isFocusActive && setMelodyDropdownOpen(!melodyDropdownOpen)}
                                    disabled={isFocusActive}
                                    className="w-full bg-black/20 border rounded px-2 py-1.5 text-slate-200 text-left flex items-center justify-between disabled:opacity-50 cursor-pointer hover:border-primary/50 transition-colors"
                                    style={{ borderColor: 'var(--theme-border)' }}
                                >
                                    <span>{localMelody}</span>
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                                        {melodyDropdownOpen ? 'expand_less' : 'expand_more'}
                                    </span>
                                </button>
                                {melodyDropdownOpen && (
                                    <div
                                        className="absolute top-full left-0 w-full mt-1 rounded border shadow-xl overflow-y-auto"
                                        style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', zIndex: 10000 }}
                                    >
                                        {MELODIES.map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => {
                                                    setLocalMelody(m);
                                                    setMelodyDropdownOpen(false);
                                                    stopPreview();
                                                }}
                                                className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-primary/20 ${m === localMelody ? 'text-primary font-semibold bg-primary/10' : 'text-slate-300'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={togglePreview}
                                disabled={isFocusActive}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 border border-primary/30"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {isPlayingPreview ? 'stop' : 'play_arrow'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Loop Toggle */}
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-sm text-slate-300 font-medium">{t('loop')}</span>
                        <button
                            onClick={() => !isFocusActive && setLocalLoop(!localLoop)}
                            disabled={isFocusActive}
                            className={`w-11 h-6 rounded-full transition-colors relative flex items-center border border-black/20 disabled:opacity-50 ${localLoop ? 'bg-primary' : 'bg-slate-600'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute transition-transform ${localLoop ? 'translate-x-[22px]' : 'translate-x-[4px]'}`} />
                        </button>
                    </div>

                    {/* Start/Stop Button */}
                    {isFocusActive ? (
                        <button
                            onClick={() => {
                                stopFocusMode();
                                setIsOpen(false);
                            }}
                            className="w-full py-2 rounded-lg font-bold transition-all active:scale-95 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                        >
                            {t('stop')}
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={localMin === 0 && localSec === 0}
                            className="w-full py-2 rounded-lg font-bold transition-all active:scale-95 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('start')}
                        </button>
                    )}

                </div>,
                document.body
            )}
        </div>
    );
};

export default FocusButton;
