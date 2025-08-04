import { toast } from 'react-toastify';

// Toast configuration
const toastConfig = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored"
};

// Success toast
export const showSuccessToast = (message, options = {}) => {
    toast.success(message, { ...toastConfig, ...options });
};

// Error toast
export const showErrorToast = (message, options = {}) => {
    toast.error(message, { ...toastConfig, ...options });
};

// Warning toast
export const showWarningToast = (message, options = {}) => {
    toast.warning(message, { ...toastConfig, ...options });
};

// Info toast
export const showInfoToast = (message, options = {}) => {
    toast.info(message, { ...toastConfig, ...options });
};

// Loading toast
export const showLoadingToast = (message) => {
    return toast.loading(message);
};

// Update existing toast
export const updateToast = (toastId, { message, type = 'success', ...options }) => {
    const updateConfig = {
        render: message,
        type: type,
        isLoading: false,
        ...toastConfig,
        ...options
    };
    toast.update(toastId, updateConfig);
};

// Dismiss toast
export const dismissToast = (toastId) => {
    toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
    toast.dismiss();
};

export default {
    success: showSuccessToast,
    error: showErrorToast,
    warning: showWarningToast,
    info: showInfoToast,
    loading: showLoadingToast,
    update: updateToast,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts
};
