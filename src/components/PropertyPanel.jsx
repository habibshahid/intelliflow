import React, { useState, useEffect, useRef } from 'react';
import { fetchSelectOptions, fetchGroupedSelectOptions } from '../services/databaseApi';
import { ChevronDown, RefreshCw, AlertCircle, Loader, Search, X } from 'lucide-react';
import blockDefinitions from '../blockDefinitions.json';
import { 
  DatabasePropertyComponent, 
  VariablesPropertyComponent, 
  TimestampPropertyComponent 
} from './CustomPropertyComponents';

const PropertyPanel = ({ selectedNode, blockTypes, onUpdateNode, onDeleteNode, onCloneNode, flowContext = {} }) => {
  const [newBranchName, setNewBranchName] = useState('');
  
  // System variables from blockDefinitions
  const systemVariables = blockDefinitions.systemVariables || [];

  if (!selectedNode) {
    return null;
  }

  const blockDef = selectedNode.data?.blockDef;
  
  if (!blockDef) {
    return null;
  }

  const properties = selectedNode.data.properties || {};
  const propertyLabels = selectedNode.data.propertyLabels || {};
  const outputLabels = selectedNode.data.outputLabels || [...(blockDef.outputs.labels || [])];
  const isDynamicOutputs = blockDef.outputs.mode === 'dynamic';

  const handlePropertyChange = (key, value, label) => {
    // If label is provided, update both property and label together
    if (label !== undefined) {
      onUpdateNode(selectedNode.id, {
        ...selectedNode.data,
        properties: {
          ...properties,
          [key]: value
        },
        propertyLabels: {
          ...propertyLabels,
          [key]: label
        }
      });
    } else {
      onUpdateNode(selectedNode.id, {
        ...selectedNode.data,
        properties: {
          ...properties,
          [key]: value
        }
      });
    }
  };

  // Store the display label for a property (shown on canvas)
  const handleLabelChange = (key, label) => {
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      propertyLabels: {
        ...propertyLabels,
        [key]: label
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

      const handleSelect = (option) => {
        // Pass both value and label to onChange
        onChange(option.value, option.label);
        setIsOpen(false);
        setSearchTerm('');
      };

      const handleClear = (e) => {
        e.stopPropagation();
        onChange('', '');
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
                      onClick={() => handleSelect(option)}
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
    // SIMPLIFIED DATABASE SELECT - Supports dependsOn for cascading
    // =====================================================
    const DatabaseSelectInput = ({ prop }) => {
      const [options, setOptions] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);

      // Get parent value if dependsOn is set
      const parentValue = prop.dependsOn ? properties[prop.dependsOn] : null;
      // Get parent's full row data if available (stored as _fieldKey_rowData)
      const parentRowData = prop.dependsOn ? properties[`_${prop.dependsOn}_rowData`] : null;
      const hasParentDependency = !!prop.dependsOn;
      const isParentSelected = hasParentDependency ? !!parentValue : true;

      // Build query with parent value substitution
      const buildQuery = () => {
        if (!prop.query) return null;
        
        let query = prop.query;
        
        if (prop.dependsOn && parentValue) {
          // Replace {{parentKey}} with parent's value
          const placeholder = `{{${prop.dependsOn}}}`;
          query = query.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), parentValue);
          
          // Replace {{parentKey.columnName}} with specific column from parent's row data
          if (parentRowData) {
            const columnPattern = new RegExp(`\\{\\{${prop.dependsOn}\\.([^}]+)\\}\\}`, 'g');
            query = query.replace(columnPattern, (match, columnName) => {
              const columnValue = parentRowData[columnName];
              if (columnValue !== undefined) {
                // Escape single quotes for SQL safety
                return String(columnValue).replace(/'/g, "''");
              }
              console.warn(`Column "${columnName}" not found in parent row data. Available:`, Object.keys(parentRowData));
              return match; // Leave placeholder if column not found
            });
          }
        }
        
        return query;
      };

      // Store selected option's full row data for child fields to access
      const handleSelectWithRowData = (selectedValue, selectedOption) => {
        // Store both the value AND the full row data for child fields
        const newProperties = {
          ...properties,
          [prop.key]: selectedValue,
        };
        
        // If option has raw data (from database), store it for child queries
        if (selectedOption && selectedOption.raw) {
          newProperties[`_${prop.key}_rowData`] = selectedOption.raw;
        } else {
          // Clear row data if no option selected
          delete newProperties[`_${prop.key}_rowData`];
        }
        
        // Also update the label for canvas display
        const newPropertyLabels = {
          ...propertyLabels,
          [prop.key]: selectedOption?.label || selectedValue || ''
        };
        
        onUpdateNode(selectedNode.id, {
          ...selectedNode.data,
          properties: newProperties,
          propertyLabels: newPropertyLabels
        });
      };

      // Load options when parent changes or on mount
      useEffect(() => {
        if (!isParentSelected) {
          // Parent not selected - clear options and value
          setOptions([]);
          if (value) {
            handlePropertyChange(prop.key, '');
          }
          return;
        }

        const query = buildQuery();
        if (query) {
          loadOptions(query);
        }
      }, [parentValue, parentRowData, prop.query]);

      const loadOptions = async (query) => {
        try {
          setLoading(true);
          setError(null);

          const fetchedOptions = await fetchSelectOptions(
            query,
            prop.valueField || 'id',
            prop.labelField || 'label',
            prop.previewField || null,
            flowContext
          );

          // If no results and dependencyOptional with fallback options
          if (fetchedOptions.length === 0 && prop.dependencyOptional && prop.options) {
            const fallbackOptions = prop.options.map(opt => ({
              value: typeof opt === 'object' ? opt.value : opt,
              label: typeof opt === 'object' ? opt.label : opt,
              preview: null,
            }));
            setOptions(fallbackOptions);
          } else {
            setOptions(fetchedOptions);
          }
        } catch (err) {
          console.error('Failed to load options:', err);
          setError(err.message);
          
          // On error, if dependencyOptional with fallback options, use them
          if (prop.dependencyOptional && prop.options) {
            const fallbackOptions = prop.options.map(opt => ({
              value: typeof opt === 'object' ? opt.value : opt,
              label: typeof opt === 'object' ? opt.label : opt,
              preview: null,
            }));
            setOptions(fallbackOptions);
          } else {
            setOptions([]);
          }
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

      // Determine placeholder text
      const getPlaceholder = () => {
        if (loading) return 'Loading...';
        if (!isParentSelected) {
          return prop.disabledPlaceholder || `Select ${prop.dependsOn} first...`;
        }
        return prop.placeholder || '-- Select --';
      };

      // Disabled state
      const isDisabled = loading || !isParentSelected;

      // Use searchable component if searchable is true
      if (prop.searchable) {
        return (
          <div>
            <SearchableSelect
              options={options}
              value={value}
              onChange={(val, label) => {
                // Find the selected option to get its raw data
                const selectedOpt = options.find(opt => opt.value == val);
                handleSelectWithRowData(val, selectedOpt);
              }}
              placeholder={getPlaceholder()}
              searchPlaceholder={prop.searchPlaceholder || 'Search...'}
              disabled={isDisabled}
              renderPreview={renderDbPreview}
              selectedOption={selectedOption}
            />

            {/* Dependency Info */}
            {hasParentDependency && !isParentSelected && (
              <div style={{
                marginTop: '6px',
                padding: '6px 10px',
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <AlertCircle size={14} />
                <span>Select <strong>{prop.dependsOn}</strong> first</span>
              </div>
            )}

            {/* Error Message */}
            {error && isParentSelected && (
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
            {!loading && isParentSelected && (
              <button
                type="button"
                onClick={() => loadOptions(buildQuery())}
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
              onChange={(e) => {
                const selectedVal = e.target.value;
                const selectedOpt = options.find(opt => opt.value == selectedVal);
                handleSelectWithRowData(selectedVal, selectedOpt);
              }}
              disabled={isDisabled}
              style={{
                ...inputBaseStyle,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                backgroundImage: isDisabled 
                  ? 'none'
                  : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236b7280\' d=\'M6 9L1.5 4.5h9z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: '32px',
                appearance: 'none',
                opacity: isDisabled ? 0.6 : 1,
                backgroundColor: isDisabled ? '#f9fafb' : '#fff',
              }}
              onFocus={(e) => !isDisabled && (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">{getPlaceholder()}</option>
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

          {/* Dependency Info */}
          {hasParentDependency && !isParentSelected && (
            <div style={{
              marginTop: '6px',
              padding: '6px 10px',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <AlertCircle size={14} />
              <span>Select <strong>{prop.dependsOn}</strong> first</span>
            </div>
          )}

          {/* Error Message */}
          {error && isParentSelected && (
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
          {!loading && isParentSelected && (
            <button
              type="button"
              onClick={() => loadOptions(buildQuery())}
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

    // =====================================================
    // GROUPED DATABASE SELECT - Supports optgroups from multiple queries
    // =====================================================
    const GroupedDatabaseSelectInput = ({ prop }) => {
      const [groupedOptions, setGroupedOptions] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const [isOpen, setIsOpen] = useState(false);
      const [searchTerm, setSearchTerm] = useState('');
      const dropdownRef = useRef(null);
      const searchInputRef = useRef(null);

      useEffect(() => {
        if (prop.groups && prop.groups.length > 0) {
          loadGroupedOptions();
        }
      }, [prop.groups]);

      useEffect(() => {
        const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      useEffect(() => {
        if (isOpen && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, [isOpen]);

      const loadGroupedOptions = async () => {
        try {
          setLoading(true);
          setError(null);
          const results = await fetchGroupedSelectOptions(prop.groups, flowContext);
          setGroupedOptions(results);
        } catch (err) {
          console.error('Failed to load grouped options:', err);
          setError(err.message);
          setGroupedOptions([]);
        } finally {
          setLoading(false);
        }
      };

      // Find selected option across all groups, including the group's propertyType
      const findSelectedOption = () => {
        for (let i = 0; i < groupedOptions.length; i++) {
          const group = groupedOptions[i];
          const found = group.options?.find(opt => opt.value == value);
          if (found) {
            // Get propertyType from the original group definition
            const groupDef = prop.groups?.[i];
            return { 
              ...found, 
              groupLabel: group.label,
              propertyType: groupDef?.propertyType || null
            };
          }
        }
        return null;
      };

      const selectedOption = findSelectedOption();

      // Filter options based on search
      const getFilteredGroups = () => {
        if (!searchTerm) return groupedOptions;
        
        return groupedOptions.map(group => ({
          ...group,
          options: group.options?.filter(opt => 
            (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase())
          ) || []
        })).filter(group => group.options.length > 0);
      };

      const filteredGroups = getFilteredGroups();

      const handleSelect = (optionValue, optionLabel) => {
        // Store the value
        handlePropertyChange(prop.key, optionValue);
        // Store the label for canvas display
        handleLabelChange(prop.key, optionLabel || optionValue);
        setIsOpen(false);
        setSearchTerm('');
      };

      const handleClear = () => {
        handlePropertyChange(prop.key, '');
        handleLabelChange(prop.key, '');
        setSearchTerm('');
      };

      // Searchable grouped dropdown
      if (prop.searchable) {
        return (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Selected Value Display / Trigger */}
            <div
              onClick={() => !loading && setIsOpen(!isOpen)}
              style={{
                ...inputBaseStyle,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: loading ? 0.6 : 1,
                backgroundColor: '#fff',
              }}
            >
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                color: selectedOption ? '#1f2937' : '#9ca3af',
              }}>
                {loading ? 'Loading...' : (selectedOption ? selectedOption.label : (prop.placeholder || '-- Select --'))}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {value && !loading && (
                  <X
                    size={14}
                    style={{ cursor: 'pointer', color: '#6b7280' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                  />
                )}
                <ChevronDown size={16} style={{ color: '#6b7280' }} />
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
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                maxHeight: '300px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Search Input */}
                <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ 
                      position: 'absolute', 
                      left: '10px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={prop.searchPlaceholder || 'Search...'}
                      style={{
                        width: '100%',
                        padding: '8px 8px 8px 32px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Options with Optgroups */}
                <div style={{ overflowY: 'auto', maxHeight: '240px' }}>
                  {filteredGroups.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      No results found
                    </div>
                  ) : (
                    filteredGroups.map((group, groupIndex) => (
                      <div key={groupIndex}>
                        {/* Optgroup Label */}
                        <div style={{
                          padding: '8px 12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#6b7280',
                          backgroundColor: '#f9fafb',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderTop: groupIndex > 0 ? '1px solid #e5e7eb' : 'none',
                        }}>
                          {group.label}
                        </div>
                        {/* Options in group */}
                        {group.options?.map((option, optIndex) => (
                          <div
                            key={`${groupIndex}-${optIndex}`}
                            onClick={() => handleSelect(option.value, option.label)}
                            style={{
                              padding: '10px 12px 10px 20px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              backgroundColor: option.value == value ? '#eff6ff' : 'transparent',
                              color: option.value == value ? '#2563eb' : '#374151',
                              borderLeft: option.value == value ? '3px solid #2563eb' : '3px solid transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (option.value != value) {
                                e.currentTarget.style.background = '#f3f4f6';
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
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

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
                onClick={loadGroupedOptions}
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

            {/* Media Preview for grouped selects */}
            {selectedOption && selectedOption.propertyType && selectedOption.preview && renderPreview(selectedOption.propertyType, selectedOption)}
          </div>
        );
      }

      // Non-searchable: standard select with optgroups
      return (
        <div>
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
            >
              <option value="">{loading ? 'Loading...' : (prop.placeholder || '-- Select --')}</option>
              {groupedOptions.map((group, groupIndex) => (
                <optgroup key={groupIndex} label={group.label}>
                  {group.options?.map((option, optIndex) => (
                    <option key={`${groupIndex}-${optIndex}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
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
              onClick={loadGroupedOptions}
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

          {/* Media Preview for grouped selects */}
          {selectedOption && selectedOption.propertyType && selectedOption.preview && renderPreview(selectedOption.propertyType, selectedOption)}
        </div>
      );
    };

    // =====================================================
    // GROUPED STATIC SELECT - Optgroups from static options
    // =====================================================
    const GroupedStaticSelect = ({ groups, value, onChange, placeholder, searchPlaceholder }) => {
      const [isOpen, setIsOpen] = useState(false);
      const [searchTerm, setSearchTerm] = useState('');
      const dropdownRef = useRef(null);
      const searchInputRef = useRef(null);

      useEffect(() => {
        const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      useEffect(() => {
        if (isOpen && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, [isOpen]);

      // Find selected option across all groups
      const findSelectedOption = () => {
        for (const group of groups) {
          const found = group.options?.find(opt => opt.value == value);
          if (found) return { ...found, groupLabel: group.label };
        }
        return null;
      };

      const selectedOption = findSelectedOption();

      // Filter options based on search
      const getFilteredGroups = () => {
        if (!searchTerm) return groups;
        
        return groups.map(group => ({
          ...group,
          options: group.options?.filter(opt => 
            (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase())
          ) || []
        })).filter(group => group.options.length > 0);
      };

      const filteredGroups = getFilteredGroups();

      const handleSelect = (optionValue, optionLabel) => {
        onChange(optionValue, optionLabel);
        setIsOpen(false);
        setSearchTerm('');
      };

      const handleClear = () => {
        onChange('', '');
        setSearchTerm('');
      };

      return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          {/* Selected Value Display / Trigger */}
          <div
            onClick={() => setIsOpen(!isOpen)}
            style={{
              ...inputBaseStyle,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fff',
            }}
          >
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              color: selectedOption ? '#1f2937' : '#9ca3af',
            }}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {value && (
                <X
                  size={14}
                  style={{ cursor: 'pointer', color: '#6b7280' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                />
              )}
              <ChevronDown size={16} style={{ color: '#6b7280' }} />
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              maxHeight: '300px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Search Input */}
              <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ 
                    position: 'absolute', 
                    left: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder}
                    style={{
                      width: '100%',
                      padding: '8px 8px 8px 32px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Options with Optgroups */}
              <div style={{ overflowY: 'auto', maxHeight: '240px' }}>
                {filteredGroups.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                    No results found
                  </div>
                ) : (
                  filteredGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {/* Optgroup Label */}
                      <div style={{
                        padding: '8px 12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#6b7280',
                        backgroundColor: '#f9fafb',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderTop: groupIndex > 0 ? '1px solid #e5e7eb' : 'none',
                      }}>
                        {group.label}
                      </div>
                      {/* Options in group */}
                      {group.options?.map((option, optIndex) => (
                        <div
                          key={`${groupIndex}-${optIndex}`}
                          onClick={() => handleSelect(option.value, option.label)}
                          style={{
                            padding: '10px 12px 10px 20px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            backgroundColor: option.value == value ? '#eff6ff' : 'transparent',
                            color: option.value == value ? '#2563eb' : '#374151',
                            borderLeft: option.value == value ? '3px solid #2563eb' : '3px solid transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (option.value != value) {
                              e.currentTarget.style.background = '#f3f4f6';
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
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
        // Check if this select has groups (optgroups)
        if (prop.groups && prop.groups.length > 0) {
          // Static optgroups
          if (prop.searchable) {
            // Searchable grouped select
            const groupedOptions = prop.groups.map(group => ({
              label: group.label,
              options: (group.options || []).map(opt => ({
                value: typeof opt === 'object' ? opt.value : opt,
                label: typeof opt === 'object' ? opt.label : opt,
              }))
            }));

            return (
              <GroupedStaticSelect
                groups={groupedOptions}
                value={value}
                onChange={(val, label) => {
                  handlePropertyChange(prop.key, val);
                  handleLabelChange(prop.key, label || val);
                }}
                placeholder={prop.placeholder || '-- Select --'}
                searchPlaceholder={prop.searchPlaceholder || 'Search...'}
              />
            );
          }

          // Non-searchable static optgroups
          return (
            <select
              value={value}
              onChange={(e) => {
                const selectedVal = e.target.value;
                // Find label from options
                let selectedLabel = selectedVal;
                for (const group of prop.groups) {
                  const found = (group.options || []).find(opt => {
                    const optVal = typeof opt === 'object' ? opt.value : opt;
                    return String(optVal) === selectedVal;
                  });
                  if (found) {
                    selectedLabel = typeof found === 'object' ? found.label : found;
                    break;
                  }
                }
                handlePropertyChange(prop.key, selectedVal);
                handleLabelChange(prop.key, selectedLabel);
              }}
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
              {prop.groups.map((group, groupIndex) => (
                <optgroup key={groupIndex} label={group.label}>
                  {(group.options || []).map((opt, optIndex) => {
                    const optValue = typeof opt === 'object' ? opt.value : opt;
                    const optLabel = typeof opt === 'object' ? opt.label : opt;
                    return (
                      <option key={`${groupIndex}-${optIndex}`} value={optValue}>{optLabel}</option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          );
        }

        // Convert static options to searchable format (no groups)
        const selectOptions = (prop.options || []).map(opt => ({
          value: typeof opt === 'object' ? opt.value : opt,
          label: typeof opt === 'object' ? opt.label : opt,
        }));

        if (prop.searchable) {
          return (
            <SearchableSelect
              options={selectOptions}
              value={value}
              onChange={(val, label) => {
                handlePropertyChange(prop.key, val);
                handleLabelChange(prop.key, label || val);
              }}
              placeholder={prop.placeholder || '-- Select --'}
              searchPlaceholder={prop.searchPlaceholder || 'Search...'}
            />
          );
        }

        return (
          <select
            value={value}
            onChange={(e) => {
              const selectedVal = e.target.value;
              const foundOpt = (prop.options || []).find(opt => {
                const optVal = typeof opt === 'object' ? opt.value : opt;
                return String(optVal) === selectedVal;
              });
              const selectedLabel = foundOpt 
                ? (typeof foundOpt === 'object' ? foundOpt.label : foundOpt)
                : selectedVal;
              handlePropertyChange(prop.key, selectedVal);
              handleLabelChange(prop.key, selectedLabel);
            }}
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
            {(prop.options || []).map((opt, idx) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              return <option key={idx} value={optValue}>{optLabel}</option>;
            })}
          </select>
        );

      case 'select_database':
        // Check for timestamp properties (gotoiftime, gotoiftimemulti)
        if (prop.key === 'gotoiftime_condition' || prop.key === 'gotoiftimemulti_condition') {
          return (
            <TimestampPropertyComponent
              value={value}
              onChange={(val, label) => handlePropertyChange(prop.key, val, label)}
              onLabelChange={(label) => handleLabelChange(prop.key, label)}
              flowContext={flowContext}
              prop={prop}
            />
          );
        }
        
        // Check for variable properties (contains _variable in key and queries variables table)
        const isVariableProperty = (
          prop.key?.includes('_variable') || 
          prop.key === 'ivr_variable' ||
          prop.key?.includes('variable_name')
        ) && prop.query?.toLowerCase().includes('variable');
        
        if (isVariableProperty) {
          return (
            <VariablesPropertyComponent
              value={value}
              onChange={(val, label) => handlePropertyChange(prop.key, val, label)}
              onLabelChange={(label) => handleLabelChange(prop.key, label)}
              flowContext={flowContext}
              prop={prop}
            />
          );
        }
        
        // Check for database connection property
        if (prop.key === 'database_connection' || prop.key === 'db_connection' || prop.customComponent === 'database') {
          return (
            <DatabasePropertyComponent
              value={value}
              onChange={(val, label) => handlePropertyChange(prop.key, val, label)}
              onLabelChange={(label) => handleLabelChange(prop.key, label)}
              flowContext={flowContext}
              prop={prop}
            />
          );
        }
        
        // Check if this has groups (database optgroups)
        if (prop.groups && prop.groups.length > 0) {
          return <GroupedDatabaseSelectInput prop={prop} />;
        }
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

      {/* Fixed Output Branch Selector - for blocks with many fixed outputs */}
      {!isDynamicOutputs && blockDef.outputs.labels && blockDef.outputs.labels.length > 4 && (
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
              background: '#fef3c7',
              color: '#92400e',
              padding: '2px 8px',
              borderRadius: '12px',
              textTransform: 'none',
              letterSpacing: 'normal'
            }}>
              {(selectedNode.data.enabledOutputs || blockDef.outputs.labels).length} / {blockDef.outputs.labels.length} Active
            </span>
          </h4>

          <div style={{
            fontSize: '11px',
            color: '#6b7280',
            marginBottom: '12px',
            padding: '8px 10px',
            background: '#f9fafb',
            borderRadius: '6px',
          }}>
            💡 Select which output branches to show on the canvas. Disabled branches won't appear but can be re-enabled anytime.
          </div>

          {/* Quick Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <button
              onClick={() => {
                onUpdateNode(selectedNode.id, {
                  ...selectedNode.data,
                  enabledOutputs: blockDef.outputs.labels.map((_, idx) => idx)
                });
              }}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              ✓ Enable All
            </button>
            <button
              onClick={() => {
                onUpdateNode(selectedNode.id, {
                  ...selectedNode.data,
                  enabledOutputs: []
                });
              }}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              ✗ Disable All
            </button>
          </div>
          
          {/* Output checkboxes in a compact grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '6px',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '4px',
          }}>
            {blockDef.outputs.labels.map((label, index) => {
              const enabledOutputs = selectedNode.data.enabledOutputs || blockDef.outputs.labels.map((_, idx) => idx);
              const isEnabled = enabledOutputs.includes(index);
              
              return (
                <label 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    background: isEnabled ? '#ecfdf5' : '#f9fafb',
                    border: `1px solid ${isEnabled ? '#a7f3d0' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isEnabled ? '#34d399' : '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isEnabled ? '#a7f3d0' : '#e5e7eb';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => {
                      let newEnabledOutputs;
                      if (e.target.checked) {
                        newEnabledOutputs = [...enabledOutputs, index].sort((a, b) => a - b);
                      } else {
                        newEnabledOutputs = enabledOutputs.filter(i => i !== index);
                      }
                      onUpdateNode(selectedNode.id, {
                        ...selectedNode.data,
                        enabledOutputs: newEnabledOutputs
                      });
                    }}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#10b981',
                      cursor: 'pointer',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: isEnabled ? '#065f46' : '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#9ca3af',
                    }}>
                      Index: {index}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
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
