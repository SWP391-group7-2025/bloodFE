import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose, show }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => {
                    onClose && onClose();
                }, 300); // Wait for animation to complete
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show && !isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            default:
                return 'ℹ';
        }
    };

    return (
        <div className={`toast toast-${type} ${isVisible ? 'toast-show' : 'toast-hide'}`}>
            <div className="toast-content">
                <span className="toast-icon">{getIcon()}</span>
                <span className="toast-message">{message}</span>
                <button className="toast-close" onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => onClose && onClose(), 300);
                }}>
                    ×
                </button>
            </div>
        </div>
    );
};

export default Toast;
