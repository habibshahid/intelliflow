import React from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, selected }) => {
  const { blockDef, properties = {} } = data;

  // Calculate handle positions
  const inputCount = blockDef.outputs.max;
  const outputCount = blockDef.outputs.max;

  return (
    <div
      style={{
        background: selected ? '#fff' : '#fafafa',
        border: `2px solid ${selected ? blockDef.color : '#ddd'}`,
        borderRadius: '6px',
        padding: '8px 10px',
        minWidth: '120px',
        maxWidth: '160px',
        boxShadow: selected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 6px rgba(0,0,0,0.1)',
      }}
    >
      {/* Input Handles */}
      {blockDef.inputs.max > 0 && (
        <>
          {Array.from({ length: blockDef.inputs.max === -1 ? 5 : blockDef.inputs.max }).map((_, index) => {
            const handleId = `input-${index}`;
            const label = blockDef.inputs.labels?.[index] || `in-${index}`;
            const maxInputs = blockDef.inputs.max === -1 ? 5 : blockDef.inputs.max;
            const topOffset = maxInputs === 1 
              ? 50 
              : (100 / (maxInputs + 1)) * (index + 1);

            return (
              <div key={handleId}>
                <Handle
                  type="target"
                  position={Position.Left}
                  id={handleId}
                  style={{
                    top: `${topOffset}%`,
                    background: blockDef.color,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: `calc(${topOffset}% - 7px)`,
                    fontSize: '9px',
                    color: '#666',
                    pointerEvents: 'none',
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Node Content */}
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <div style={{ fontSize: '20px', marginBottom: '2px' }}>{blockDef.icon}</div>
        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#333', lineHeight: '1.2' }}>
          {blockDef.name}
        </div>
      </div>

      {/* Show some properties */}
      {Object.keys(properties).length > 0 && (
        <div style={{ 
          fontSize: '10px', 
          color: '#666', 
          marginTop: '6px',
          paddingTop: '6px',
          borderTop: '1px solid #eee'
        }}>
          {Object.entries(properties).slice(0, 1).map(([key, value]) => (
            <div key={key} style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              marginBottom: '2px'
            }}>
              <strong>{key}:</strong> {String(value).substring(0, 15)}
            </div>
          ))}
        </div>
      )}

      {/* Output Handles */}
      {blockDef.outputs.max > 0 && (
        <>
          {Array.from({ length: blockDef.outputs.max === -1 ? 5 : blockDef.outputs.max }).map((_, index) => {
            const handleId = `output-${index}`;
            const label = blockDef.outputs.labels?.[index] || `out-${index}`;
            const maxOutputs = blockDef.outputs.max === -1 ? 5 : blockDef.outputs.max;
            const topOffset = maxOutputs === 1 
              ? 50 
              : (100 / (maxOutputs + 1)) * (index + 1);

            return (
              <div key={handleId}>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={handleId}
                  style={{
                    top: `${topOffset}%`,
                    background: blockDef.color,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: `calc(${topOffset}% - 7px)`,
                    fontSize: '9px',
                    color: '#666',
                    pointerEvents: 'none',
                    textAlign: 'right',
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default CustomNode;
