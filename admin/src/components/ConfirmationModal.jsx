import { AlertTriangle } from 'lucide-react';
import React from 'react'

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    const getModalStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    iconBg: 'bg-red-500/10',
                    iconColor: 'text-red-500',
                    confirmBg: 'bg-red-500 hover:bg-red-600',
                    confirmText: 'text-white'
                };
            case 'warning':
                return {
                    iconBg: 'bg-yellow-500/10',
                    iconColor: 'text-yellow-500',
                    confirmBg: 'bg-yellow-500 hover:bg-yellow-600',
                    confirmText: 'text-white'
                };
            default:
                return {
                    iconBg: 'bg-blue-500/10',
                    iconColor: 'text-blue-500',
                    confirmBg: 'bg-blue-500 hover:bg-blue-600',
                    confirmText: 'text-white'
                };
        }
    };

    const styles = getModalStyles();

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal positioning */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal content */}
                <div className="inline-block align-bottom bg-bgdark rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-border">
                    <div className="px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                                <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-primary" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-secondary">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse bg-gray-700/5 border-t border-border">
                        <button
                            type="button"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${styles.confirmBg} text-base font-medium ${styles.confirmText} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-bgdark text-base font-medium text-primary hover:bg-gray-700/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal