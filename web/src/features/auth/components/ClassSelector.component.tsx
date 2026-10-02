const CLASSES = [
  { label: '6ème', value: '6eme' },
  { label: '5ème', value: '5eme' },
  { label: '4ème', value: '4eme' },
  { label: '3ème', value: '3eme' },
];

interface ClassSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const ClassSelector = ({ value, onChange, error, disabled }: ClassSelectorProps ) => (
  <div style={{ width: '100%' }}>
    <p style={{ fontSize: '0.85rem', color: 'var(--milo-encre)', marginBottom: '0.6rem', fontWeight: '700' }}>
      Sélectionne ta classe
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
      {CLASSES.map(({ label, value: classValue }) => (
        <button
          key={classValue}
          type="button"
          disabled={disabled}
          onClick={() => onChange(classValue)}
          style={{
            padding: '12px',
            borderRadius: '14px',
            border: value === classValue ? '2px solid var(--milo-orange)' : '2px solid rgba(241, 223, 203, 0.8)',
            backgroundColor: value === classValue ? 'rgba(255, 84, 29, 0.1)' : 'rgba(255, 255, 255, 0.9)',
            color: value === classValue ? 'var(--milo-orange)' : 'var(--text-2)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: value === classValue ? '800' : '600',
            fontFamily: 'inherit',
            transition: '0.2s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
    {error && <p style={{ color: 'var(--ko)', fontSize: '0.8rem', fontWeight: 600, marginTop: '6px' }}>{error}</p>}
  </div>
);