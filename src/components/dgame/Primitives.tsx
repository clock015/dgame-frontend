import type { ReactNode } from 'react';

import styles from '../../styles/Dgame.module.css';

type SectionProps = {
  title: string;
  meta?: string;
  children: ReactNode;
};

export function Section({ title, meta, children }: SectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        {meta ? <span>{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

type FieldProps = {
  label: string;
  value: ReactNode;
};

export function Field({ label, value }: FieldProps) {
  return (
    <div className={styles.field}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

export function ActionButton({
  children,
  disabled,
  onClick,
  variant = 'secondary',
}: ButtonProps) {
  return (
    <button
      className={variant === 'primary' ? styles.primaryButton : styles.button}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

type TextInputProps = {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function TextInput({ label, onChange, placeholder, value }: TextInputProps) {
  return (
    <label className={styles.inputGroup}>
      <span>{label}</span>
      <input
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
