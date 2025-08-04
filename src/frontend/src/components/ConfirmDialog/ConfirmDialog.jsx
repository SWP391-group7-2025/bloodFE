import React, { useState } from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ show, title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy' }) => {
    if (!show) return null;

    return (
        <div className="confirm-dialog-overlay">
            <div className="confirm-dialog">
                <div className="confirm-dialog-header">
                    <h3>{title}</h3>
                </div>
                <div className="confirm-dialog-body">
                    <p>{message}</p>
                </div>
                <div className="confirm-dialog-actions">
                    <button className="confirm-dialog-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className="confirm-dialog-confirm" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
