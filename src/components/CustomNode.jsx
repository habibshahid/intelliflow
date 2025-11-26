import React from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, selected }) => {
  const { blockDef, properties = {}, propertyLabels = {}, outputLabels = [], enabledOutputs = null } = data;

  // Get output labels and their indices based on mode
  const getActiveOutputs = () => {
    const isDynamic = blockDef.outputs.mode === 'dynamic';
    const baseLabels = blockDef.outputs.labels || [];
    
    if (isDynamic) {
      // For dynamic outputs, use outputLabels if available, otherwise base labels
      const labels = outputLabels.length > 0 ? outputLabels : baseLabels;
      return labels.map((label, idx) => ({ label, index: idx, originalIndex: idx }));
    } else {
      // For fixed outputs, filter by enabledOutputs if set
      if (enabledOutputs && enabledOutputs.length > 0) {
        // Only show enabled outputs, but preserve their original index for handle IDs
        return enabledOutputs
          .map(idx => ({ 
            label: baseLabels[idx] || `Output ${idx}`, 
            index: idx,
            originalIndex: idx 
          }))
          .sort((a, b) => a.index - b.index);
      }
      // Show all outputs by default
      return baseLabels.map((label, idx) => ({ label, index: idx, originalIndex: idx }));
    }
  };

  const activeOutputs = getActiveOutputs();
  const hasOutputs = blockDef.outputs.max > 0 || blockDef.outputs.max === -1;
  const totalBaseOutputs = blockDef.outputs.labels?.length || 0;
  const showingSubset = enabledOutputs && enabledOutputs.length < totalBaseOutputs && blockDef.outputs.mode !== 'dynamic';

  // Get property preview - show label if available, otherwise value
  const getPropertyPreview = () => {
    const entries = Object.entries(properties);
    if (entries.length === 0) return null;
    
    // Find the first property with a value
    for (const [key, value] of entries) {
      // Skip internal properties (starting with _)
      if (key.startsWith('_')) continue;
      if (!value && value !== 0 && value !== false) continue;
      
      // Use the stored label if available, otherwise use the value
      const displayValue = propertyLabels[key] || String(value);
      
      // Find the property definition to get its label
      const propDef = blockDef.properties?.find(p => p.key === key);
      const propLabel = propDef?.label || key;
      
      // Truncate if too long
      const truncated = displayValue.length > 25 
        ? displayValue.substring(0, 25) + '...' 
        : displayValue;
      
      return truncated;
    }
    return null;
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
        borderBottom: hasOutputs && activeOutputs.length > 0 ? '1px solid #e5e7eb' : 'none',
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

          {/* Badge showing subset of outputs */}
          {showingSubset && (
            <div style={{
              fontSize: '9px',
              background: '#fef3c7',
              color: '#92400e',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '600',
            }}>
              {activeOutputs.length}/{totalBaseOutputs}
            </div>
          )}
        </div>
      </div>

      {/* OUTPUT BRANCHES AS ROWS */}
      {hasOutputs && activeOutputs.length > 0 ? (
        <div style={{ position: 'relative' }}>
          {activeOutputs.map((output, displayIndex) => {
            // Use originalIndex for handle ID to maintain connection compatibility
            const handleId = `output-${output.originalIndex}`;
            
            return (
              <div
                key={handleId}
                style={{
                  position: 'relative',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: displayIndex < activeOutputs.length - 1 ? '1px solid #f3f4f6' : 'none',
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {/* Show index badge for fixed outputs */}
                  {blockDef.outputs.mode !== 'dynamic' && totalBaseOutputs > 5 && (
                    <span style={{
                      fontSize: '10px',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontWeight: '600',
                    }}>
                      {output.originalIndex}
                    </span>
                  )}
                  {output.label}
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
