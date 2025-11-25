import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Upload,
  Trash2 
} from 'lucide-react';

const Toolbar = ({ 
  onZoomIn, 
  onZoomOut, 
  onFitView, 
  onExport, 
  onImport,
  onClear 
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#fff',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      display: 'flex',
      gap: '4px',
      padding: '6px',
      zIndex: 10,
      border: '1px solid #e5e7eb'
    }}>
      {/* Zoom Controls */}
      <button
        onClick={onZoomIn}
        style={buttonStyle}
        title="Zoom In"
        onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <ZoomIn size={18} />
      </button>
      
      <button
        onClick={onZoomOut}
        style={buttonStyle}
        title="Zoom Out"
        onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <ZoomOut size={18} />
      </button>
      
      <button
        onClick={onFitView}
        style={buttonStyle}
        title="Fit View"
        onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Maximize2 size={18} />
      </button>

      <div style={{ width: '1px', background: '#e5e7eb', margin: '4px 4px' }} />

      {/* Export/Import */}
      <button
        onClick={onExport}
        style={buttonStyle}
        title="Export JSON"
        onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Download size={18} />
      </button>
      
      <button
        onClick={onImport}
        style={buttonStyle}
        title="Import JSON"
        onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Upload size={18} />
      </button>

      <div style={{ width: '1px', background: '#e5e7eb', margin: '4px 4px' }} />

      {/* Clear */}
      <button
        onClick={onClear}
        style={{ ...buttonStyle, color: '#ef4444' }}
        title="Clear All"
        onMouseOver={(e) => {
          e.currentTarget.style.background = '#fef2f2';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

const buttonStyle = {
  background: 'transparent',
  border: 'none',
  padding: '8px',
  cursor: 'pointer',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  color: '#374151',
};

export default Toolbar;
