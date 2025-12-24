import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-slate-900 border-2 border-slate-700 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md transform transition-all animate-bounce-in overflow-hidden">
                {/* Header */}
                <div className="bg-slate-800 p-4 sm:p-5 border-b border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-amber-900/40 rounded-lg">
                        <AlertTriangle className="text-amber-400 w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white">{title}</h3>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6">
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 bg-slate-950/50 flex gap-3 sm:gap-4 font-black text-sm sm:text-base">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <X size={18} />
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Confirm Exit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
