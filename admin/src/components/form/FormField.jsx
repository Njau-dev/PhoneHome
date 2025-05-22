import React from 'react';

const FormField = ({ label, children, className = '' }) => (
    <div className={`mb-4 ${className}`}>
        <label className="block text-sm font-medium text-primary mb-2">{label}</label>
        {children}
    </div>
);

export default FormField;