import React from 'react';
import { 
  getSmoothStepPath, 
  EdgeLabelRenderer,
  BaseEdge 
} from 'reactflow';
import { X } from 'lucide-react';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const onEdgeClick = (evt, edgeId) => {
    evt.stopPropagation();
    // Dispatch a custom event that App.jsx will listen to
    window.dispatchEvent(new CustomEvent('deleteEdge', { detail: { edgeId } }));
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#3b82f6' : '#94a3b8',
          strokeDasharray: '5,5',
          animation: 'dashdraw 0.5s linear infinite',
        }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={(event) => onEdgeClick(event, id)}
            style={{
              width: '20px',
              height: '20px',
              background: selected ? '#ef4444' : '#fff',
              border: `1px solid ${selected ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              opacity: selected ? 1 : 0,
              transition: 'opacity 0.2s, background 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              if (!selected) {
                e.currentTarget.style.opacity = '0';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
            title="Delete connection"
          >
            <X size={12} color={selected ? '#fff' : '#ef4444'} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;