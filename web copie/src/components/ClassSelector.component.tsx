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
  <div style={{ marginBottom: '1rem', width: '100%' }}>
    <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem', fontWeight: '500' }}>
      Sélectionnez votre classe :
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
      {CLASSES.map(({ label, value: classValue }) => (
        <button
          key={classValue}
          type="button"
          disabled={disabled}
          onClick={() => onChange(classValue)}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: value === classValue ? '2px solid #f97316' : '1px solid #d1d5db',
            backgroundColor: value === classValue ? '#fff7ed' : 'white',
            color: value === classValue ? '#f97316' : '#4b5563',
            cursor: 'pointer',
            fontWeight: value === classValue ? '600' : '400'
          }}
        >
          {label}
        </button>
      ))}
    </div>
    {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{error}</p>}
  </div>
);