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
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      gap: '4px',
      padding: '8px',
      zIndex: 10
    }}>
      {/* Zoom Controls */}
      <button
        onClick={onZoomIn}
        style={buttonStyle}
        title="Zoom In"
      >
        <ZoomIn size={18} />
      </button>
      
      <button
        onClick={onZoomOut}
        style={buttonStyle}
        title="Zoom Out"
      >
        <ZoomOut size={18} />
      </button>
      
      <button
        onClick={onFitView}
        style={buttonStyle}
        title="Fit View"
      >
        <Maximize2 size={18} />
      </button>

      <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />

      {/* Export/Import */}
      <button
        onClick={onExport}
        style={buttonStyle}
        title="Export JSON"
      >
        <Download size={18} />
      </button>
      
      <button
        onClick={onImport}
        style={buttonStyle}
        title="Import JSON"
      >
        <Upload size={18} />
      </button>

      <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />

      {/* Clear */}
      <button
        onClick={onClear}
        style={{ ...buttonStyle, color: '#f44336' }}
        title="Clear All"
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
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
  color: '#333',
};

export default Toolbar;
