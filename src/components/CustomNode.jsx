import React from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, selected }) => {
  const { blockDef, properties = {}, outputLabels = [] } = data;

  // Get output labels
  const getOutputLabels = () => {
    if (blockDef.outputs.mode === 'dynamic' && outputLabels.length > 0) {
      return outputLabels;
    }
    return blockDef.outputs.labels || [];
  };

  const activeOutputLabels = getOutputLabels();
  const hasOutputs = blockDef.outputs.max > 0;

  // Get property preview
  const getPropertyPreview = () => {
    const entries = Object.entries(properties);
    if (entries.length === 0) return null;
    const [key, value] = entries[0];
    const displayValue = String(value).substring(0, 30);
    return displayValue ? `${displayValue}${String(value).length > 30 ? '...' : ''}` : null;
  };

  const propertyPreview = getPropertyPreview();

  return (
    <div
      style={{
        background: '#fff',
        border: selected ? `2px solid ${blockDef.color}` : '1px solid #e0e0e0',
        borderRadius: '8px',
        minWidth: '240px',
        maxWidth: '300px',
        boxShadow: selected 
          ? `0 4px 12px ${blockDef.color}20, 0 0 0 4px ${blockDef.color}10`
          : '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        overflow: 'visible',
        position: 'relative',
      }}
    >
      {/* Input Handle - Single centered on left */}
      {blockDef.inputs.max > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          id="input-0"
          style={{
            top: '30px',
            background: '#fff',
            width: '12px',
            height: '12px',
            border: `2px solid ${blockDef.color}`,
            left: '-6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        />
      )}

      {/* HEADER SECTION */}
      <div style={{ 
        padding: '12px 16px',
        borderBottom: hasOutputs && activeOutputLabels.length > 0 ? '1px solid #e5e7eb' : 'none',
        background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Icon */}
          <div 
            style={{ 
              fontSize: '18px',
              flexShrink: 0,
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${blockDef.color}15`,
              borderRadius: '6px',
            }}
          >
            {blockDef.icon}
          </div>

          {/* Block Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: '600', 
              fontSize: '14px', 
              color: '#1a1a1a',
              lineHeight: '1.3',
            }}>
              {blockDef.name}
            </div>

            {propertyPreview && (
              <div style={{ 
                fontSize: '11px', 
                color: '#9ca3af',
                lineHeight: '1.3',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {propertyPreview}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OUTPUT BRANCHES AS ROWS */}
      {hasOutputs && activeOutputLabels.length > 0 ? (
        <div style={{ position: 'relative' }}>
          {activeOutputLabels.map((label, index) => {
            const handleId = `output-${index}`;
            
            return (
              <div
                key={handleId}
                style={{
                  position: 'relative',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: index < activeOutputLabels.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: 'transparent',
                  transition: 'background 0.15s ease',
                  minHeight: '40px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Branch Label */}
                <div style={{
                  fontSize: '13px',
                  color: '#374151',
                  fontWeight: '500',
                  flex: 1,
                  paddingRight: '30px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </div>

                {/* Arrow indicator */}
                <div style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  position: 'absolute',
                  right: '20px',
                  pointerEvents: 'none',
                }}>
                  →
                </div>

                {/* Output Handle for this row */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={handleId}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#fff',
                    width: '12px',
                    height: '12px',
                    border: `2px solid ${blockDef.color}`,
                    right: '-6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : hasOutputs ? (
        /* Fallback for blocks with no labels */
        <Handle
          type="source"
          position={Position.Right}
          id="output-0"
          style={{
            top: '30px',
            background: '#fff',
            width: '12px',
            height: '12px',
            border: `2px solid ${blockDef.color}`,
            right: '-6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        />
      ) : null}
    </div>
  );
};

export default CustomNode;
