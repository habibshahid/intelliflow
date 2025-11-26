import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';

const Sidebar = ({ blockTypes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const onDragStart = (event, blockType) => {
    event.dataTransfer.setData('application/reactflow', blockType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Group blocks by category
  const categories = useMemo(() => {
    const cats = {};
    Object.values(blockTypes).forEach(block => {
      if (!cats[block.category]) {
        cats[block.category] = [];
      }
      cats[block.category].push(block);
    });
    return cats;
  }, [blockTypes]);

  // Filter blocks based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;

    const term = searchTerm.toLowerCase();
    const filtered = {};

    Object.entries(categories).forEach(([category, blocks]) => {
      const matchingBlocks = blocks.filter(block => 
        block.name.toLowerCase().includes(term) ||
        block.id.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term)
      );
      if (matchingBlocks.length > 0) {
        filtered[category] = matchingBlocks;
      }
    });

    return filtered;
  }, [categories, searchTerm]);

  // Toggle category collapse
  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Expand all categories when searching
  const isSearching = searchTerm.trim().length > 0;

  // Category display names
  const categoryNames = {
    'intelliflow_globals': 'IntelliFlow Globals',
    'call_control': 'Call Control',
    'playback': 'Playback',
    'functions': 'Functions',
    'applications': 'Applications',
    'chat_management': 'Chat Management',
    'whatsapp_management': 'WhatsApp Management',
    'ecommerce': 'eCommerce',
    'cx9_apps': 'CX9 Apps',
  };

  const getCategoryDisplayName = (category) => {
    return categoryNames[category] || category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const totalBlocks = Object.values(blockTypes).length;
  const matchingBlocks = Object.values(filteredCategories).flat().length;

  return (
    <div style={{
      width: '280px',
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px 16px 16px',
        borderBottom: '1px solid #e5e7eb',
        flexShrink: 0,
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '16px', 
          fontWeight: '700',
          color: '#1a1a1a',
          letterSpacing: '-0.01em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          Blocks
          <span style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#6b7280',
            background: '#f3f4f6',
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            {totalBlocks}
          </span>
        </h3>
        
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              pointerEvents: 'none',
            }} 
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blocks..."
            style={{
              width: '100%',
              padding: '10px 36px 10px 38px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Count */}
        {isSearching && (
          <div style={{
            marginTop: '10px',
            fontSize: '12px',
            color: '#6b7280',
          }}>
            Found <strong style={{ color: '#1a1a1a' }}>{matchingBlocks}</strong> blocks
            {matchingBlocks !== totalBlocks && ` matching "${searchTerm}"`}
          </div>
        )}
      </div>
      
      {/* Scrollable Categories */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
      }}>
        {Object.keys(filteredCategories).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              No blocks found
            </div>
            <div style={{ fontSize: '12px' }}>
              Try a different search term
            </div>
          </div>
        ) : (
          Object.entries(filteredCategories).map(([category, blocks]) => {
            const isCollapsed = !isSearching && collapsedCategories[category];
            
            return (
              <div key={category} style={{ marginBottom: '8px' }}>
                {/* Category Header - Collapsible */}
                <button
                  onClick={() => toggleCategory(category)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: isCollapsed ? '8px' : '8px 8px 0 0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCollapsed ? (
                      <ChevronRight size={16} style={{ color: '#6b7280' }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: '#6b7280' }} />
                    )}
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      textTransform: 'uppercase',
                      color: '#374151',
                      letterSpacing: '0.03em'
                    }}>
                      {getCategoryDisplayName(category)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#6b7280',
                    background: '#e5e7eb',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    {blocks.length}
                  </span>
                </button>
                
                {/* Category Blocks */}
                {!isCollapsed && (
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '8px',
                    background: '#fff',
                  }}>
                    {blocks.map(block => (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, block.id)}
                        style={{
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          marginBottom: '6px',
                          cursor: 'grab',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.15s ease',
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
                            fontSize: '16px',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `${block.color}15`,
                            borderRadius: '5px',
                            flexShrink: 0,
                          }}
                        >
                          {block.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: '500', 
                            fontSize: '12px',
                            color: '#1a1a1a',
                            lineHeight: '1.3',
                          }}>
                            {block.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.3' }}>
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
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Footer Tip */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #e5e7eb',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '10px 12px',
          background: '#eff6ff',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#1e40af',
          lineHeight: '1.5',
          border: '1px solid #dbeafe'
        }}>
          <span style={{ fontWeight: '600' }}>💡 Tip:</span> Drag blocks onto the canvas
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
