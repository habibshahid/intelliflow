import React, { useState, useEffect, useRef } from 'react';
import { fetchSelectOptions } from '../services/databaseApi';
import { ChevronDown, RefreshCw, AlertCircle, Loader, Search, X } from 'lucide-react';
import blockDefinitions from '../blockDefinitions.json';

const PropertyPanel = ({ selectedNode, blockTypes, onUpdateNode, onDeleteNode, onCloneNode }) => {
  const [newBranchName, setNewBranchName] = useState('');
  
  // System variables from blockDefinitions
  const systemVariables = blockDefinitions.systemVariables || [];

  if (!selectedNode) {
    return (
      <div style={{
        width: '320px',
        background: '#fff',
        borderLeft: '1px solid #e5e7eb',
        padding: '20px',
        overflowY: 'auto',
        height: '100vh'
      }}>
        <div style={{ 
          color: '#9ca3af', 
          textAlign: 'center', 
          marginTop: '100px',
          fontSize: '14px'
        }}>
          Select a block to edit properties
        </div>
      </div>
    );
  }

  const blockDef = selectedNode.data?.blockDef;
  
  if (!blockDef) {
    return (
      <div style={{
        width: '320px',
        background: '#fff',
        borderLeft: '1px solid #e5e7eb',
        padding: '20px',
        overflowY: 'auto',
        height: '100vh'
      }}>
        <div style={{ 
          color: '#9ca3af', 
          textAlign: 'center', 
          marginTop: '100px',
          fontSize: '14px'
        }}>
          Block definition not found
        </div>
      </div>
    );
  }

  const properties = selectedNode.data.properties || {};
  const outputLabels = selectedNode.data.outputLabels || [...(blockDef.outputs.labels || [])];
  const isDynamicOutputs = blockDef.outputs.mode === 'dynamic';

  const handlePropertyChange = (key, value) => {
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      properties: {
        ...properties,
        [key]: value
      }
    });
  };

  const insertVariable = (propertyKey, variable) => {
    const currentValue = properties[propertyKey] || '';
    const newValue = currentValue + variable.key;
    handlePropertyChange(propertyKey, newValue);
  };

  const handleAddOutputBranch = () => {
    if (!newBranchName.trim()) return;
    
    const updatedLabels = [...outputLabels, newBranchName.trim()];
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      outputLabels: updatedLabels
    });
    setNewBranchName('');
  };

  const handleRemoveOutputBranch = (index) => {
    const updatedLabels = outputLabels.filter((_, i) => i !== index);
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      outputLabels: updatedLabels
    });
  };

  const handleRenameOutputBranch = (index, newName) => {
    const updatedLabels = [...outputLabels];
    updatedLabels[index] = newName;
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      outputLabels: updatedLabels
    });
  };

  const renderPropertyInput = (prop) => {
    const value = properties[prop.key] ?? prop.default ?? '';

    const inputBaseStyle = {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '13px',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s ease',
    };

    // Variable Selector Component
    const VariableSelector = ({ propKey }) => {
      const [showDropdown, setShowDropdown] = useState(false);

      return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              background: '#f9fafb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#374151',
              fontWeight: '500',
            }}
            title="Insert system variable"
          >
            Variables
            <ChevronDown size={12} />
          </button>
          
          {showDropdown && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999,
                }}
                onClick={() => setShowDropdown(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  minWidth: '250px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
              >
                <div style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #f3f4f6',
                }}>
                  System Variables
                </div>
                {systemVariables.map((variable) => (
                  <div
                    key={variable.key}
                    onClick={() => {
                      insertVariable(propKey, variable);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      borderBottom: '1px solid #f9fafb',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '2px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}>
                      {variable.key}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                    }}>
                      {variable.description}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    };

    // =====================================================
    // SEARCHABLE SELECT COMPONENT
    // =====================================================
    const SearchableSelect = ({ 
      options, 
      value, 
      onChange, 
      placeholder = '-- Select --',
      searchPlaceholder = 'Search...',
      disabled = false,
      renderPreview = null,
      selectedOption = null
    }) => {
      const [isOpen, setIsOpen] = useState(false);
      const [searchTerm, setSearchTerm] = useState('');
      const containerRef = useRef(null);
      const inputRef = useRef(null);

      // Filter options based on search (with null safety)
      const filteredOptions = options.filter(opt => {
        const label = opt.label || '';
        return label.toLowerCase().includes(searchTerm.toLowerCase());
      });

      // Get display label for selected value
      const selectedLabel = options.find(opt => opt.value == value)?.label || '';

      // Close dropdown when clicking outside
      useEffect(() => {
        const handleClickOutside = (event) => {
          if (containerRef.current && !containerRef.current.contains(event.target)) {
            setIsOpen(false);
            setSearchTerm('');
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      // Focus search input when dropdown opens
      useEffect(() => {
        if (isOpen && inputRef.current) {
          inputRef.current.focus();
        }
      }, [isOpen]);

      const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
      };

      const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
      };

      return (
        <div ref={containerRef} style={{ position: 'relative' }}>
          {/* Selected Value Display / Trigger */}
          <div
            onClick={() => !disabled && setIsOpen(!isOpen)}
            style={{
              width: '100%',
              padding: '8px 12px',
              paddingRight: '60px',
              border: `1px solid ${isOpen ? '#3b82f6' : '#e5e7eb'}`,
              borderRadius: '6px',
              fontSize: '13px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: disabled ? '#f9fafb' : '#fff',
              opacity: disabled ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              minHeight: '38px',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ 
              color: value ? '#374151' : '#9ca3af',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {selectedLabel || placeholder}
            </span>
            
            {/* Clear & Dropdown Icons */}
            <div style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              {value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
              <ChevronDown 
                size={16} 
                style={{ 
                  color: '#6b7280',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease',
                }} 
              />
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '300px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Search Input */}
              <div style={{
                padding: '8px',
                borderBottom: '1px solid #f3f4f6',
              }}>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={14} 
                    style={{ 
                      position: 'absolute', 
                      left: '10px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                    }} 
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: '2px',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        display: 'flex',
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Options List */}
              <div style={{
                overflowY: 'auto',
                maxHeight: '240px',
              }}>
                {filteredOptions.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '13px',
                  }}>
                    No results found
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#374151',
                        background: option.value == value ? '#eff6ff' : 'transparent',
                        borderLeft: option.value == value ? '3px solid #3b82f6' : '3px solid transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (option.value != value) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (option.value != value) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {option.label}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Preview (if provided) */}
          {renderPreview && selectedOption && renderPreview(selectedOption)}
        </div>
      );
    };

    // =====================================================
    // SIMPLIFIED DATABASE SELECT - Just sends query to backend
    // =====================================================
    const DatabaseSelectInput = ({ prop }) => {
      const [options, setOptions] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);

      useEffect(() => {
        if (prop.query) {
          loadOptions();
        }
      }, [prop.query]);

      const loadOptions = async () => {
        try {
          setLoading(true);
          setError(null);

          // Simple: just send query, valueField, labelField to backend
          const fetchedOptions = await fetchSelectOptions(
            prop.query,
            prop.valueField || 'id',
            prop.labelField || 'label',
            prop.previewField || null
          );

          setOptions(fetchedOptions);
        } catch (err) {
          console.error('Failed to load options:', err);
          setError(err.message);
          setOptions([]);
        } finally {
          setLoading(false);
        }
      };

      const selectedOption = options.find(opt => opt.value == value);

      // Preview renderer for database select
      const renderDbPreview = (selOption) => {
        if (!prop.propertyType || !selOption) return null;
        return renderPreview(prop.propertyType, selOption);
      };

      // Use searchable component if searchable is true
      if (prop.searchable) {
        return (
          <div>
            <SearchableSelect
              options={options}
              value={value}
              onChange={(val) => handlePropertyChange(prop.key, val)}
              placeholder={loading ? 'Loading...' : (prop.placeholder || '-- Select --')}
              searchPlaceholder={prop.searchPlaceholder || 'Search...'}
              disabled={loading}
              renderPreview={renderDbPreview}
              selectedOption={selectedOption}
            />

            {/* Error Message */}
            {error && (
              <div style={{
                marginTop: '6px',
                padding: '6px 10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Refresh Button */}
            {!loading && (
              <button
                type="button"
                onClick={loadOptions}
                style={{
                  marginTop: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#374151',
                  fontWeight: '500',
                }}
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            )}

            {/* Preview for non-searchable (searchable has it built in) */}
            {!prop.searchable && prop.propertyType && value && selectedOption && renderPreview(prop.propertyType, selectedOption)}
          </div>
        );
      }

      // Non-searchable: standard dropdown
      return (
        <div>
          {/* Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={value}
              onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
              disabled={loading}
              style={{
                ...inputBaseStyle,
                cursor: loading ? 'wait' : 'pointer',
                backgroundImage: loading 
                  ? 'none'
                  : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236b7280\' d=\'M6 9L1.5 4.5h9z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: '32px',
                appearance: 'none',
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">{loading ? 'Loading...' : (prop.placeholder || '-- Select --')}</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {loading && (
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}>
                <Loader size={16} color="#3b82f6" className="spin" />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: '6px',
              padding: '6px 10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Refresh Button */}
          {!loading && (
            <button
              type="button"
              onClick={loadOptions}
              style={{
                marginTop: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#374151',
                fontWeight: '500',
              }}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          )}

          {/* Preview based on propertyType */}
          {prop.propertyType && value && selectedOption && renderPreview(prop.propertyType, selectedOption)}
        </div>
      );
    };

    // Preview Renderer
    const renderPreview = (propertyType, selectedOption) => {
      const previewUrl = selectedOption.preview;
      
      if (!previewUrl) return null;

      switch (propertyType) {
        case 'media_audio':
          return (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}>
                Audio Preview
              </div>
              <audio
                controls
                style={{ width: '100%', height: '32px' }}
                src={previewUrl}
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          );

        case 'media_image':
          return (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}>
                Image Preview
              </div>
              <img
                src={previewUrl}
                alt={selectedOption.label}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  background: '#fff',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          );

        case 'media_video':
          return (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}>
                Video Preview
              </div>
              <video
                controls
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  background: '#000',
                }}
                src={previewUrl}
              >
                Your browser does not support video playback.
              </video>
            </div>
          );

        default:
          return null;
      }
    };

    // =====================================================
    // RENDER PROPERTY INPUT BY TYPE
    // =====================================================
    switch (prop.type) {
      case 'text':
        return (
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
              placeholder={prop.placeholder}
              style={inputBaseStyle}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            {prop.showPredefinedVariables && (
              <div style={{ marginTop: '6px' }}>
                <VariableSelector propKey={prop.key} />
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div>
            <textarea
              value={value}
              onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
              placeholder={prop.placeholder}
              rows={4}
              style={{
                ...inputBaseStyle,
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '12px',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            {prop.showPredefinedVariables && (
              <div style={{ marginTop: '6px' }}>
                <VariableSelector propKey={prop.key} />
              </div>
            )}
          </div>
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
            style={inputBaseStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        );

      case 'boolean':
        return (
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            padding: '8px 0'
          }}>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handlePropertyChange(prop.key, e.target.checked)}
              style={{ 
                width: '18px', 
                height: '18px',
                cursor: 'pointer',
                accentColor: blockDef.color
              }}
            />
            <span style={{ fontSize: '13px', color: '#374151' }}>Enable</span>
          </label>
        );

      case 'select':
        // Convert static options to searchable format
        const selectOptions = (prop.options || []).map(opt => ({
          value: typeof opt === 'object' ? opt.value : opt,
          label: typeof opt === 'object' ? opt.label : opt,
        }));

        if (prop.searchable) {
          return (
            <SearchableSelect
              options={selectOptions}
              value={value}
              onChange={(val) => handlePropertyChange(prop.key, val)}
              placeholder={prop.placeholder || '-- Select --'}
              searchPlaceholder={prop.searchPlaceholder || 'Search...'}
            />
          );
        }

        return (
          <select
            value={value}
            onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
            style={{
              ...inputBaseStyle,
              cursor: 'pointer',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236b7280\' d=\'M6 9L1.5 4.5h9z\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              paddingRight: '32px',
              appearance: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="">{prop.placeholder || '-- Select --'}</option>
            {prop.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'select_database':
        return <DatabaseSelectInput prop={prop} />;

      default:
        return <div style={{ fontSize: '12px', color: '#ef4444' }}>Unsupported type: {prop.type}</div>;
    }
  };

  return (
    <div style={{
      width: '320px',
      background: '#fff',
      borderLeft: '1px solid #e5e7eb',
      padding: '20px',
      overflowY: 'auto',
      height: '100vh'
    }}>
      {/* Block Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          marginBottom: '8px'
        }}>
          <div
            style={{
              fontSize: '20px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${blockDef.color}15`,
              borderRadius: '8px',
            }}
          >
            {blockDef.icon}
          </div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: '700',
            color: '#1a1a1a',
            letterSpacing: '-0.01em'
          }}>
            {blockDef.name}
          </h3>
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#6b7280',
          fontFamily: 'Monaco, Consolas, monospace'
        }}>
          {selectedNode.id}
        </div>
      </div>

      {/* Properties Section */}
      {blockDef.properties.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ 
            fontSize: '13px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: '#374151',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Properties
          </h4>
          
          {blockDef.properties.map(prop => (
            <div key={prop.key} style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151'
              }}>
                {prop.label}
                {prop.required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
              </label>
              {renderPropertyInput(prop)}
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Output Branches */}
      {isDynamicOutputs && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ 
            fontSize: '13px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#374151',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Output Branches
            <span style={{ 
              fontSize: '10px', 
              fontWeight: '600', 
              background: '#dbeafe',
              color: '#1e40af',
              padding: '2px 8px',
              borderRadius: '12px',
              textTransform: 'none',
              letterSpacing: 'normal'
            }}>
              Dynamic
            </span>
          </h4>
          
          {/* Existing branches */}
          <div style={{ marginBottom: '12px' }}>
            {outputLabels.map((label, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                gap: '6px', 
                marginBottom: '8px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => handleRenameOutputBranch(index, e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  onClick={() => handleRemoveOutputBranch(index)}
                  style={{
                    background: '#fff',
                    color: '#ef4444',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: '1',
                  }}
                  title="Remove branch"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add new branch */}
          <div style={{ 
            display: 'flex', 
            gap: '6px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #f3f4f6'
          }}>
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAddOutputBranch();
              }}
              placeholder="New branch name..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <button
              onClick={handleAddOutputBranch}
              disabled={!newBranchName.trim()}
              style={{
                background: newBranchName.trim() ? '#3b82f6' : '#e5e7eb',
                color: newBranchName.trim() ? '#fff' : '#9ca3af',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: newBranchName.trim() ? 'pointer' : 'not-allowed',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Connection Info */}
      <div style={{ 
        marginBottom: '24px',
        padding: '12px',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #f3f4f6'
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '4px' }}>
            <strong style={{ color: '#374151' }}>Inputs:</strong> {blockDef.inputs.min} - {blockDef.inputs.max === -1 ? '∞' : blockDef.inputs.max}
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Outputs:</strong> {blockDef.outputs.min} - {blockDef.outputs.max === -1 ? '∞' : blockDef.outputs.max}
            {isDynamicOutputs && ` (${outputLabels.length} active)`}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => onCloneNode(selectedNode.id)}
          style={{
            padding: '10px',
            background: '#fff',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          Clone Block
        </button>
        
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          style={{
            padding: '10px',
            background: '#fff',
            color: '#ef4444',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          Delete Block
        </button>
      </div>

      {/* Add spinning animation for loader */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default PropertyPanel;