'use client';

import { OutputFormData, OutputType, getOutputFormFields } from '@/utils/OutputFormSelector';

interface OutputFormFieldsProps {
    type: OutputType;
    data: OutputFormData;
    onChange: (field: string, value: string) => void;
    errors?: Record<string, string>;
    disabled?: boolean;
}

export default function OutputFormFields({ type, data, onChange, errors = {}, disabled = false }: OutputFormFieldsProps) {
    const fields = getOutputFormFields(type);

    if (fields.length === 0) {
        return (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                <p>
                    Tidak ada field tambahan untuk jenis luaran <strong>{type}</strong>
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="border-b border-slate-200 pb-2 text-lg font-medium text-slate-900 dark:border-slate-800 dark:text-slate-100">
                Detail {type === 'Jurnal' ? 'Jurnal' : type === 'Buku' ? 'Buku' : type === 'HKI' ? 'HKI' : 'Produk'}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => (
                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <label
                            htmlFor={field.name}
                            className={`block text-sm font-medium text-slate-700 dark:text-slate-300 ${
                                field.required ? 'after:ml-0.5 after:text-rose-500 after:content-["*"]' : ''
                            }`}
                        >
                            {field.label}
                        </label>
                        {field.type === 'textarea' ? (
                            <textarea
                                id={field.name}
                                name={field.name}
                                value={data[field.name] || ''}
                                onChange={(e) => onChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                                maxLength={field.maxLength}
                                disabled={disabled}
                                rows={3}
                                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800 ${errors[field.name] ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-700 dark:text-rose-200' : 'border-slate-300'} `}
                            />
                        ) : (
                            <input
                                type={field.type}
                                id={field.name}
                                name={field.name}
                                value={data[field.name] || ''}
                                onChange={(e) => onChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                                maxLength={field.maxLength}
                                disabled={disabled}
                                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800 ${errors[field.name] ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-700 dark:text-rose-200' : 'border-slate-300'} `}
                            />
                        )}
                        {errors[field.name] && <p className="mt-1 text-sm text-rose-600">{errors[field.name]}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
