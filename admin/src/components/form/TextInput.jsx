import React from 'react';

const TextInput = ({ value, onChange, placeholder, type = 'text', name, className = '' }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        }}
        name={name}
        placeholder={placeholder}
        className={`w-full px-4 py-2 rounded-xl border border-border bg-bgdark focus:border-accent focus:outline-none transition-colors duration-300 ${className}`}
    />
);

export default TextInput;