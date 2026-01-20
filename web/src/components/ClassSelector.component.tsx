const CLASSES = ['6ème', '5ème', '4ème', '3ème'];

export const ClassSelector = ({ value, onChange, error, disabled }: any) => (
  <div style={{ marginBottom: '1rem', width: '100%' }}>
    <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem', fontWeight: '500' }}>
      Sélectionnez votre classe :
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
      {CLASSES.map((classe) => (
        <button
          key={classe}
          type="button"
          disabled={disabled}
          onClick={() => onChange(classe)}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: value === classe ? '2px solid #f97316' : '1px solid #d1d5db',
            backgroundColor: value === classe ? '#fff7ed' : 'white',
            color: value === classe ? '#f97316' : '#4b5563',
            cursor: 'pointer',
            fontWeight: value === classe ? '600' : '400'
          }}
        >
          {classe}
        </button>
      ))}
    </div>
    {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{error}</p>}
  </div>
);