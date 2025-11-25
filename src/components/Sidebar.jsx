import React from 'react';

const Sidebar = ({ blockTypes }) => {
  const onDragStart = (event, blockType) => {
    event.dataTransfer.setData('application/reactflow', blockType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Group blocks by category
  const categories = {};
  Object.values(blockTypes).forEach(block => {
    if (!categories[block.category]) {
      categories[block.category] = [];
    }
    categories[block.category].push(block);
  });

  return (
    <div style={{
      width: '280px',
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      padding: '20px 16px',
      overflowY: 'auto',
      height: '100vh'
    }}>
      <h3 style={{ 
        margin: '0 0 20px 0', 
        fontSize: '16px', 
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: '-0.01em'
      }}>
        Blocks
      </h3>
      
      {Object.entries(categories).map(([category, blocks]) => (
        <div key={category} style={{ marginBottom: '28px' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            textTransform: 'uppercase',
            color: '#6b7280',
            marginBottom: '10px',
            letterSpacing: '0.05em'
          }}>
            {category}
          </div>
          
          {blocks.map(block => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => onDragStart(e, block.id)}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '8px',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = block.color;
                e.currentTarget.style.background = `${block.color}08`;
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div 
                style={{ 
                  fontSize: '18px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${block.color}15`,
                  borderRadius: '6px',
                  flexShrink: 0,
                }}
              >
                {block.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '13px',
                  color: '#1a1a1a',
                  lineHeight: '1.3',
                  marginBottom: '2px'
                }}>
                  {block.name}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.3' }}>
                  {block.inputs.max > 0 && (
                    <span>{block.inputs.max === -1 ? '∞' : block.inputs.max} in</span>
                  )}
                  {block.inputs.max > 0 && block.outputs.max > 0 && <span> • </span>}
                  {block.outputs.max > 0 && (
                    <span>{block.outputs.max === -1 ? '∞' : block.outputs.max} out</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
      
      <div style={{
        marginTop: '24px',
        padding: '12px',
        background: '#eff6ff',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#1e40af',
        lineHeight: '1.5',
        border: '1px solid #dbeafe'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>💡 Tip</div>
        Drag blocks onto the canvas to build your flow
      </div>
    </div>
  );
};

export default Sidebar;
