#!/usr/bin/env node

/**
 * Block Definitions Validator
 * Validates blockDefinitions.json for correctness and consistency
 * 
 * Usage: node scripts/validateBlockDefinitions.js [path-to-file]
 * Default: validates src/blockDefinitions.json
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  error: (msg) => console.log(`${colors.red}✗ ERROR:${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ WARNING:${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`),
};

// Valid property types
const VALID_PROPERTY_TYPES = [
  'text',
  'textarea', 
  'number',
  'boolean',
  'select',
  'select_database',
];

// Valid media preview types
const VALID_MEDIA_TYPES = [
  'media_audio',
  'media_image',
  'media_video',
];

// Valid output modes
const VALID_OUTPUT_MODES = ['fixed', 'dynamic'];

// Required block fields
const REQUIRED_BLOCK_FIELDS = ['id', 'name', 'category', 'icon', 'color', 'inputs', 'outputs', 'properties'];

// Required input/output fields
const REQUIRED_IO_FIELDS = ['min', 'max', 'labels'];

// Validation results
let errors = [];
let warnings = [];

/**
 * Validate a single property definition
 */
function validateProperty(prop, blockId, allProperties) {
  const propPath = `blocks.${blockId}.properties.${prop.key}`;
  
  // Required fields
  if (!prop.key) {
    errors.push(`${propPath}: Missing required field 'key'`);
    return;
  }
  if (!prop.type) {
    errors.push(`${propPath}: Missing required field 'type'`);
    return;
  }
  
  // Valid type
  if (!VALID_PROPERTY_TYPES.includes(prop.type)) {
    errors.push(`${propPath}: Invalid type '${prop.type}'. Valid types: ${VALID_PROPERTY_TYPES.join(', ')}`);
  }
  
  // Type-specific validation
  switch (prop.type) {
    case 'text':
    case 'textarea':
      // Optional: placeholder, default, showPredefinedVariables
      if (prop.showPredefinedVariables !== undefined && typeof prop.showPredefinedVariables !== 'boolean') {
        errors.push(`${propPath}: 'showPredefinedVariables' must be a boolean`);
      }
      break;
      
    case 'number':
      // Optional: min, max, step, default
      if (prop.min !== undefined && typeof prop.min !== 'number') {
        errors.push(`${propPath}: 'min' must be a number`);
      }
      if (prop.max !== undefined && typeof prop.max !== 'number') {
        errors.push(`${propPath}: 'max' must be a number`);
      }
      if (prop.step !== undefined && typeof prop.step !== 'number') {
        errors.push(`${propPath}: 'step' must be a number`);
      }
      if (prop.min !== undefined && prop.max !== undefined && prop.min > prop.max) {
        errors.push(`${propPath}: 'min' (${prop.min}) cannot be greater than 'max' (${prop.max})`);
      }
      break;
      
    case 'boolean':
      // Optional: default
      if (prop.default !== undefined && typeof prop.default !== 'boolean') {
        errors.push(`${propPath}: 'default' must be a boolean`);
      }
      break;
      
    case 'select':
      // Can have either options OR groups (for optgroups)
      if (!prop.options && !prop.groups) {
        errors.push(`${propPath}: 'select' type requires 'options' array or 'groups' array`);
      } else if (prop.options && !Array.isArray(prop.options)) {
        errors.push(`${propPath}: 'options' must be an array`);
      } else if (prop.groups && !Array.isArray(prop.groups)) {
        errors.push(`${propPath}: 'groups' must be an array`);
      } else if (prop.options && prop.options.length === 0 && !prop.groups) {
        warnings.push(`${propPath}: 'options' array is empty`);
      }
      // Validate groups structure
      if (prop.groups && Array.isArray(prop.groups)) {
        prop.groups.forEach((group, idx) => {
          if (!group.label) {
            errors.push(`${propPath}.groups[${idx}]: Missing 'label' field`);
          }
          if (!group.options || !Array.isArray(group.options)) {
            errors.push(`${propPath}.groups[${idx}]: Missing or invalid 'options' array`);
          }
        });
      }
      // Optional: searchable, searchPlaceholder
      if (prop.searchable !== undefined && typeof prop.searchable !== 'boolean') {
        errors.push(`${propPath}: 'searchable' must be a boolean`);
      }
      break;
      
    case 'select_database':
      // Can have single query OR groups for optgroups
      if (prop.groups && Array.isArray(prop.groups)) {
        // Validate each group
        prop.groups.forEach((group, idx) => {
          if (!group.label) {
            errors.push(`${propPath}.groups[${idx}]: Missing 'label' field`);
          }
          if (!group.query) {
            errors.push(`${propPath}.groups[${idx}]: Missing 'query' field`);
          }
          if (!group.valueField) {
            errors.push(`${propPath}.groups[${idx}]: Missing 'valueField' field`);
          }
          if (!group.labelField) {
            errors.push(`${propPath}.groups[${idx}]: Missing 'labelField' field`);
          }
          // Validate query is SELECT only
          if (group.query && typeof group.query === 'string') {
            const queryUpper = group.query.trim().toUpperCase();
            if (!queryUpper.startsWith('SELECT')) {
              errors.push(`${propPath}.groups[${idx}]: Query must be a SELECT statement`);
            }
          }
          // Validate propertyType in group (for media preview)
          if (group.propertyType && !VALID_MEDIA_TYPES.includes(group.propertyType)) {
            errors.push(`${propPath}.groups[${idx}]: Invalid 'propertyType' '${group.propertyType}'. Valid types: ${VALID_MEDIA_TYPES.join(', ')}`);
          }
          // If propertyType is set in group, previewField should also be set
          if (group.propertyType && !group.previewField) {
            warnings.push(`${propPath}.groups[${idx}]: 'propertyType' is set but 'previewField' is missing`);
          }
        });
      } else {
        // Single query mode - Required: query, valueField, labelField
        if (!prop.query) {
          errors.push(`${propPath}: 'select_database' type requires 'query' field or 'groups' array`);
        }
        if (!prop.valueField) {
          errors.push(`${propPath}: 'select_database' type requires 'valueField' field`);
        }
        if (!prop.labelField) {
          errors.push(`${propPath}: 'select_database' type requires 'labelField' field`);
        }
      }
      
      // Validate query is SELECT only (single query mode)
      if (prop.query && typeof prop.query === 'string') {
        const queryUpper = prop.query.trim().toUpperCase();
        if (!queryUpper.startsWith('SELECT')) {
          errors.push(`${propPath}: Query must be a SELECT statement`);
        }
        if (queryUpper.includes('INSERT') || queryUpper.includes('UPDATE') || 
            queryUpper.includes('DELETE') || queryUpper.includes('DROP')) {
          errors.push(`${propPath}: Query contains forbidden SQL commands`);
        }
      }
      
      // Optional: propertyType (for media preview)
      if (prop.propertyType && !VALID_MEDIA_TYPES.includes(prop.propertyType)) {
        errors.push(`${propPath}: Invalid 'propertyType' '${prop.propertyType}'. Valid types: ${VALID_MEDIA_TYPES.join(', ')}`);
      }
      
      // If propertyType is set, previewField should also be set
      if (prop.propertyType && !prop.previewField) {
        warnings.push(`${propPath}: 'propertyType' is set but 'previewField' is missing (preview won't work)`);
      }
      
      // Optional: searchable
      if (prop.searchable !== undefined && typeof prop.searchable !== 'boolean') {
        errors.push(`${propPath}: 'searchable' must be a boolean`);
      }
      
      // Optional: dependsOn - validate it references existing property
      if (prop.dependsOn) {
        const parentProp = allProperties.find(p => p.key === prop.dependsOn);
        if (!parentProp) {
          errors.push(`${propPath}: 'dependsOn' references non-existent property '${prop.dependsOn}'`);
        } else {
          // Check that parent is before child in properties array
          const parentIndex = allProperties.findIndex(p => p.key === prop.dependsOn);
          const childIndex = allProperties.findIndex(p => p.key === prop.key);
          if (parentIndex > childIndex) {
            errors.push(`${propPath}: 'dependsOn' property '${prop.dependsOn}' must be defined before this property`);
          }
          
          // Check that query contains placeholder
          if (prop.query && !prop.query.includes(`{{${prop.dependsOn}}}`)) {
            warnings.push(`${propPath}: 'dependsOn' is set but query doesn't contain placeholder '{{${prop.dependsOn}}}'`);
          }
        }
      }
      
      // Optional: dependencyOptional - if true, should have options fallback
      if (prop.dependencyOptional) {
        if (!prop.dependsOn) {
          warnings.push(`${propPath}: 'dependencyOptional' is set but 'dependsOn' is not defined`);
        }
        if (!prop.options || !Array.isArray(prop.options) || prop.options.length === 0) {
          warnings.push(`${propPath}: 'dependencyOptional' is true but no fallback 'options' array provided`);
        }
      }
      
      // Optional: disabledPlaceholder
      if (prop.disabledPlaceholder && !prop.dependsOn) {
        warnings.push(`${propPath}: 'disabledPlaceholder' is set but 'dependsOn' is not defined (placeholder won't be used)`);
      }
      break;
  }
}

/**
 * Validate inputs/outputs configuration
 */
function validateIO(io, blockId, ioType) {
  const ioPath = `blocks.${blockId}.${ioType}`;
  
  // Required fields
  for (const field of REQUIRED_IO_FIELDS) {
    if (io[field] === undefined) {
      errors.push(`${ioPath}: Missing required field '${field}'`);
    }
  }
  
  // min/max validation
  if (typeof io.min !== 'number') {
    errors.push(`${ioPath}: 'min' must be a number`);
  }
  if (typeof io.max !== 'number') {
    errors.push(`${ioPath}: 'max' must be a number`);
  }
  
  if (typeof io.min === 'number' && typeof io.max === 'number') {
    if (io.min < 0) {
      errors.push(`${ioPath}: 'min' cannot be negative`);
    }
    if (io.max !== -1 && io.max < io.min) {
      errors.push(`${ioPath}: 'max' (${io.max}) cannot be less than 'min' (${io.min})`);
    }
  }
  
  // labels validation
  if (!Array.isArray(io.labels)) {
    errors.push(`${ioPath}: 'labels' must be an array`);
  }
  
  // mode validation (outputs only)
  if (ioType === 'outputs' && io.mode) {
    if (!VALID_OUTPUT_MODES.includes(io.mode)) {
      errors.push(`${ioPath}: Invalid 'mode' '${io.mode}'. Valid modes: ${VALID_OUTPUT_MODES.join(', ')}`);
    }
  }
}

/**
 * Validate a single block definition
 */
function validateBlock(block, blockId) {
  const blockPath = `blocks.${blockId}`;
  
  // Required fields
  for (const field of REQUIRED_BLOCK_FIELDS) {
    if (block[field] === undefined) {
      errors.push(`${blockPath}: Missing required field '${field}'`);
    }
  }
  
  // ID consistency
  if (block.id && block.id !== blockId) {
    warnings.push(`${blockPath}: Block 'id' (${block.id}) doesn't match key '${blockId}'`);
  }
  
  // Color format
  if (block.color && !/^#[0-9A-Fa-f]{6}$/.test(block.color)) {
    warnings.push(`${blockPath}: 'color' should be a 6-digit hex color (e.g., #FF5722)`);
  }
  
  // Validate inputs
  if (block.inputs) {
    validateIO(block.inputs, blockId, 'inputs');
  }
  
  // Validate outputs
  if (block.outputs) {
    validateIO(block.outputs, blockId, 'outputs');
  }
  
  // Validate properties
  if (block.properties) {
    if (!Array.isArray(block.properties)) {
      errors.push(`${blockPath}: 'properties' must be an array`);
    } else {
      // Check for duplicate keys
      const keys = block.properties.map(p => p.key).filter(Boolean);
      const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
      if (duplicates.length > 0) {
        errors.push(`${blockPath}: Duplicate property keys found: ${[...new Set(duplicates)].join(', ')}`);
      }
      
      // Validate each property
      for (const prop of block.properties) {
        validateProperty(prop, blockId, block.properties);
      }
    }
  }
}

/**
 * Validate system variables
 */
function validateSystemVariables(variables) {
  if (!variables) return;
  
  if (!Array.isArray(variables)) {
    errors.push(`systemVariables: Must be an array`);
    return;
  }
  
  for (let i = 0; i < variables.length; i++) {
    const v = variables[i];
    if (!v.key) {
      errors.push(`systemVariables[${i}]: Missing required field 'key'`);
    }
    if (!v.description) {
      warnings.push(`systemVariables[${i}]: Missing 'description' field`);
    }
    if (v.key && (!v.key.startsWith('{{') || !v.key.endsWith('}}'))) {
      warnings.push(`systemVariables[${i}]: Variable '${v.key}' should use {{variable}} format`);
    }
  }
}

/**
 * Main validation function
 */
function validateBlockDefinitions(filePath) {
  log.section('Block Definitions Validator');
  log.info(`Validating: ${filePath}`);
  
  // Reset results
  errors = [];
  warnings = [];
  
  // Check file exists
  if (!fs.existsSync(filePath)) {
    log.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  // Parse JSON
  let data;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(content);
  } catch (err) {
    log.error(`Failed to parse JSON: ${err.message}`);
    process.exit(1);
  }
  
  log.success('JSON syntax is valid');
  
  // Validate structure
  log.section('Structure Validation');
  
  if (!data.blockTypes) {
    errors.push('Root: Missing required field "blockTypes"');
  } else if (typeof data.blockTypes !== 'object') {
    errors.push('Root: "blockTypes" must be an object');
  } else {
    const blockCount = Object.keys(data.blockTypes).length;
    log.success(`Found ${blockCount} block type(s)`);
    
    // Validate each block
    for (const [blockId, block] of Object.entries(data.blockTypes)) {
      validateBlock(block, blockId);
    }
  }
  
  // Validate system variables
  if (data.systemVariables) {
    validateSystemVariables(data.systemVariables);
  }
  
  // Print results
  log.section('Validation Results');
  
  if (errors.length === 0 && warnings.length === 0) {
    log.success('All validations passed! ✨');
    return true;
  }
  
  if (errors.length > 0) {
    console.log(`\n${colors.red}Errors (${errors.length}):${colors.reset}`);
    errors.forEach(err => log.error(err));
  }
  
  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}Warnings (${warnings.length}):${colors.reset}`);
    warnings.forEach(warn => log.warn(warn));
  }
  
  log.section('Summary');
  console.log(`  Errors:   ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  
  if (errors.length > 0) {
    log.error('Validation failed!');
    return false;
  } else {
    log.success('Validation passed with warnings');
    return true;
  }
}

// CLI execution
const args = process.argv.slice(2);
const filePath = args[0] || path.join(__dirname, '..', 'src', 'blockDefinitions.json');

const isValid = validateBlockDefinitions(filePath);
process.exit(isValid ? 0 : 1);
