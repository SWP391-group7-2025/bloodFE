import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ToastProvider.css';

const ToastProvider = ({ children }) => {
    return (
        <>
            {children}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                toastClassName="custom-toast"
                bodyClassName="custom-toast-body"
                progressClassName="custom-toast-progress"
            />
        </>
    );
};

export default ToastProvider;
