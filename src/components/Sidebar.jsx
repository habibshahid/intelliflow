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
      width: '260px',
      background: '#f8f9fa',
      borderRight: '1px solid #ddd',
      padding: '16px',
      overflowY: 'auto',
      height: '100vh'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
        Block Library
      </h3>
      
      {Object.entries(categories).map(([category, blocks]) => (
        <div key={category} style={{ marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            color: '#666',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            {category}
          </div>
          
          {blocks.map(block => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => onDragStart(e, block.id)}
              style={{
                background: 'white',
                border: `2px solid ${block.color}`,
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '8px',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '20px' }}>{block.icon}</div>
              <div>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>
                  {block.name}
                </div>
                <div style={{ fontSize: '10px', color: '#666' }}>
                  {block.inputs.max > 0 && `${block.inputs.max === -1 ? '∞' : block.inputs.max} in`}
                  {block.inputs.max > 0 && block.outputs.max > 0 && ' • '}
                  {block.outputs.max > 0 && `${block.outputs.max === -1 ? '∞' : block.outputs.max} out`}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
      
      <div style={{
        marginTop: '32px',
        padding: '12px',
        background: '#e3f2fd',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#1976d2'
      }}>
        <strong>💡 Tip:</strong> Drag blocks onto the canvas to build your flow
      </div>
    </div>
  );
};

export default Sidebar;
