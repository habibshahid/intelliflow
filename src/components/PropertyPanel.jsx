import React from 'react';

const PropertyPanel = ({ selectedNode, blockTypes, onUpdateNode, onDeleteNode, onCloneNode }) => {
  if (!selectedNode) {
    return (
      <div style={{
        width: '300px',
        background: '#f8f9fa',
        borderLeft: '1px solid #ddd',
        padding: '16px',
        overflowY: 'auto',
        height: '100vh'
      }}>
        <div style={{ color: '#999', textAlign: 'center', marginTop: '100px' }}>
          Select a block to edit properties
        </div>
      </div>
    );
  }

  // Get blockDef from node data
  const blockDef = selectedNode.data?.blockDef;
  
  if (!blockDef) {
    return (
      <div style={{
        width: '300px',
        background: '#f8f9fa',
        borderLeft: '1px solid #ddd',
        padding: '16px',
        overflowY: 'auto',
        height: '100vh'
      }}>
        <div style={{ color: '#999', textAlign: 'center', marginTop: '100px' }}>
          Block definition not found
        </div>
      </div>
    );
  }

  const properties = selectedNode.data.properties || {};

  const handlePropertyChange = (key, value) => {
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      properties: {
        ...properties,
        [key]: value
      }
    });
  };

  const renderPropertyInput = (prop) => {
    const value = properties[prop.key] ?? prop.default ?? '';

    switch (prop.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
            placeholder={prop.placeholder}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
            placeholder={prop.placeholder}
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handlePropertyChange(prop.key, parseFloat(e.target.value))}
            min={prop.min}
            max={prop.max}
            step={prop.step || 1}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          />
        );

      case 'boolean':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handlePropertyChange(prop.key, e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '13px' }}>Enable</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Select --</option>
            {prop.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      default:
        return <div>Unsupported type: {prop.type}</div>;
    }
  };

  return (
    <div style={{
      width: '300px',
      background: '#f8f9fa',
      borderLeft: '1px solid #ddd',
      padding: '16px',
      overflowY: 'auto',
      height: '100vh'
    }}>
      {/* Block Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '24px' }}>{blockDef.icon}</span>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{blockDef.name}</h3>
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          ID: {selectedNode.id}
        </div>
      </div>

      {/* Properties */}
      {blockDef.properties.length > 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: '#333'
          }}>
            Properties
          </h4>
          
          {blockDef.properties.map(prop => (
            <div key={prop.key} style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '12px',
                fontWeight: '500',
                color: '#555'
              }}>
                {prop.label}
                {prop.required && <span style={{ color: '#f44336' }}>*</span>}
              </label>
              {renderPropertyInput(prop)}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          padding: '12px', 
          background: '#fff3cd', 
          borderRadius: '4px',
          fontSize: '12px',
          color: '#856404',
          marginBottom: '24px'
        }}>
          No configurable properties
        </div>
      )}

      {/* Connection Info */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          marginBottom: '12px',
          color: '#333'
        }}>
          Connections
        </h4>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div style={{ marginBottom: '6px' }}>
            📥 Inputs: {blockDef.inputs.min} - {blockDef.inputs.max === -1 ? '∞' : blockDef.inputs.max}
          </div>
          <div>
            📤 Outputs: {blockDef.outputs.min} - {blockDef.outputs.max === -1 ? '∞' : blockDef.outputs.max}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => onCloneNode(selectedNode.id)}
          style={{
            padding: '10px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          🔄 Clone Block
        </button>
        
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          style={{
            padding: '10px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          🗑️ Delete Block
        </button>
      </div>
    </div>
  );
};

export default PropertyPanel;
