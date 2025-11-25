# blockDefinitions.json - Complete Documentation

## 📖 Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [System Variables](#system-variables)
4. [Block Definition](#block-definition)
5. [Inputs Configuration](#inputs-configuration)
6. [Outputs Configuration](#outputs-configuration)
7. [Properties Configuration](#properties-configuration)
8. [Property Types Reference](#property-types-reference)
9. [Complete Examples](#complete-examples)

---

## Overview

`blockDefinitions.json` is the central configuration file that defines:
- All available block types in the flow builder
- Their inputs/outputs
- Configurable properties
- Visual appearance
- System-wide variables

---

## File Structure

```json
{
  "systemVariables": [...],
  "blockTypes": {
    "block_id": { ... },
    "another_block": { ... }
  }
}
```

| Key | Type | Description |
|-----|------|-------------|
| `systemVariables` | Array | Global variables available in all blocks |
| `blockTypes` | Object | Map of block ID → block definition |

---

## System Variables

System variables can be inserted into text/textarea properties.

```json
{
  "systemVariables": [
    {
      "key": "{{user.name}}",
      "label": "User Name",
      "description": "Current user's name"
    }
  ]
}
```

### System Variable Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | ✅ | Variable placeholder (e.g., `{{user.name}}`) |
| `label` | string | ✅ | Display name in dropdown |
| `description` | string | ❌ | Help text shown in dropdown |

### Example System Variables

```json
{
  "systemVariables": [
    {
      "key": "{{user.name}}",
      "label": "User Name",
      "description": "Current user's name"
    },
    {
      "key": "{{user.email}}",
      "label": "User Email",
      "description": "Current user's email address"
    },
    {
      "key": "{{timestamp}}",
      "label": "Current Timestamp",
      "description": "Current date and time (ISO format)"
    },
    {
      "key": "{{date}}",
      "label": "Current Date",
      "description": "Current date (YYYY-MM-DD)"
    },
    {
      "key": "{{time}}",
      "label": "Current Time",
      "description": "Current time (HH:MM:SS)"
    },
    {
      "key": "{{flow.id}}",
      "label": "Flow ID",
      "description": "Current flow identifier"
    },
    {
      "key": "{{flow.name}}",
      "label": "Flow Name",
      "description": "Current flow name"
    },
    {
      "key": "{{block.id}}",
      "label": "Block ID",
      "description": "Current block identifier"
    },
    {
      "key": "{{input.data}}",
      "label": "Input Data",
      "description": "Data received from previous block"
    },
    {
      "key": "{{input.value}}",
      "label": "Input Value",
      "description": "Primary value from input"
    },
    {
      "key": "{{random.uuid}}",
      "label": "Random UUID",
      "description": "Generate random UUID"
    },
    {
      "key": "{{random.number}}",
      "label": "Random Number",
      "description": "Generate random number"
    }
  ]
}
```

---

## Block Definition

Each block is defined with these fields:

```json
{
  "block_id": {
    "id": "block_id",
    "name": "Block Name",
    "category": "category_name",
    "icon": "🎯",
    "color": "#4CAF50",
    "inputs": { ... },
    "outputs": { ... },
    "properties": [ ... ]
  }
}
```

### Block Fields Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (must match key) |
| `name` | string | ✅ | Display name in UI |
| `category` | string | ✅ | Category for sidebar grouping |
| `icon` | string | ✅ | Emoji or icon character |
| `color` | string | ✅ | Hex color (e.g., `#4CAF50`) |
| `inputs` | object | ✅ | Input connection configuration |
| `outputs` | object | ✅ | Output connection configuration |
| `properties` | array | ✅ | Configurable properties (can be empty `[]`) |

### Categories

Common categories (you can create any):

| Category | Description |
|----------|-------------|
| `control` | Flow control (start, end) |
| `logic` | Conditions, branching, merging |
| `media` | Audio, video, images |
| `ai` | AI/ML operations |
| `api` | HTTP requests, webhooks |
| `data` | Data manipulation |
| `notification` | Alerts, emails, SMS |

---

## Inputs Configuration

Defines how many connections can enter the block.

```json
{
  "inputs": {
    "min": 1,
    "max": 1,
    "labels": ["trigger"]
  }
}
```

### Input Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `min` | number | ✅ | Minimum required inputs |
| `max` | number | ✅ | Maximum allowed inputs (`-1` = unlimited) |
| `labels` | array | ✅ | Labels for each input handle |

### Input Examples

**No inputs (start block):**
```json
{
  "inputs": {
    "min": 0,
    "max": 0,
    "labels": []
  }
}
```

**Single input:**
```json
{
  "inputs": {
    "min": 1,
    "max": 1,
    "labels": ["input"]
  }
}
```

**Multiple fixed inputs:**
```json
{
  "inputs": {
    "min": 2,
    "max": 2,
    "labels": ["input_a", "input_b"]
  }
}
```

**Unlimited inputs (merge block):**
```json
{
  "inputs": {
    "min": 2,
    "max": -1,
    "labels": ["input"]
  }
}
```

---

## Outputs Configuration

Defines how many connections can leave the block.

```json
{
  "outputs": {
    "min": 1,
    "max": 2,
    "labels": ["success", "error"],
    "mode": "fixed"
  }
}
```

### Output Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `min` | number | ✅ | Minimum outputs |
| `max` | number | ✅ | Maximum outputs (`-1` = unlimited) |
| `labels` | array | ✅ | Labels for each output handle |
| `mode` | string | ❌ | `"fixed"` or `"dynamic"` (default: `"fixed"`) |

### Output Modes

**Fixed Mode (`"fixed"`):**
- Output count and labels are predefined
- User cannot add/remove outputs
- Best for: If/Else, HTTP Request (success/error)

**Dynamic Mode (`"dynamic"`):**
- User can add/remove/rename outputs at runtime
- Initial labels come from `labels` array
- Best for: Switch/Case, Router, Custom branching

### Output Examples

**No outputs (end block):**
```json
{
  "outputs": {
    "min": 0,
    "max": 0,
    "labels": []
  }
}
```

**Single output:**
```json
{
  "outputs": {
    "min": 1,
    "max": 1,
    "labels": ["output"],
    "mode": "fixed"
  }
}
```

**Fixed multiple outputs (if/else):**
```json
{
  "outputs": {
    "min": 2,
    "max": 2,
    "labels": ["true", "false"],
    "mode": "fixed"
  }
}
```

**Dynamic outputs (user-configurable):**
```json
{
  "outputs": {
    "min": 1,
    "max": 10,
    "labels": ["branch_1", "branch_2"],
    "mode": "dynamic"
  }
}
```

**Unlimited outputs:**
```json
{
  "outputs": {
    "min": 1,
    "max": -1,
    "labels": ["output"],
    "mode": "dynamic"
  }
}
```

---

## Properties Configuration

Properties are the configurable fields shown in the property panel.

```json
{
  "properties": [
    {
      "key": "propertyName",
      "label": "Property Label",
      "type": "text",
      "placeholder": "Enter value...",
      "required": true
    }
  ]
}
```

### Common Property Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | ✅ | Unique property identifier |
| `label` | string | ✅ | Display label |
| `type` | string | ✅ | Property type (see below) |
| `required` | boolean | ❌ | Mark as required (shows `*`) |
| `default` | any | ❌ | Default value |
| `placeholder` | string | ❌ | Placeholder text |
| `showPredefinedVariables` | boolean | ❌ | Show variables dropdown (for text/textarea) |

---

## Property Types Reference

### 1. `text` - Single Line Text Input

```json
{
  "key": "url",
  "label": "URL",
  "type": "text",
  "placeholder": "https://example.com",
  "required": true,
  "default": "",
  "showPredefinedVariables": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `placeholder` | string | Hint text in empty input |
| `default` | string | Default value |
| `showPredefinedVariables` | boolean | Show system variables dropdown |

---

### 2. `textarea` - Multi-Line Text Input

```json
{
  "key": "body",
  "label": "Request Body",
  "type": "textarea",
  "placeholder": "Enter JSON...",
  "required": false,
  "default": "",
  "showPredefinedVariables": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `placeholder` | string | Hint text in empty input |
| `default` | string | Default value |
| `showPredefinedVariables` | boolean | Show system variables dropdown |

**Note:** Textarea uses monospace font, suitable for code/JSON.

---

### 3. `number` - Numeric Input

```json
{
  "key": "volume",
  "label": "Volume",
  "type": "number",
  "default": 100,
  "min": 0,
  "max": 100,
  "step": 1
}
```

| Field | Type | Description |
|-------|------|-------------|
| `default` | number | Default value |
| `min` | number | Minimum allowed value |
| `max` | number | Maximum allowed value |
| `step` | number | Increment step (default: 1) |

**Examples:**

Integer (0-100):
```json
{
  "key": "percentage",
  "type": "number",
  "default": 50,
  "min": 0,
  "max": 100,
  "step": 1
}
```

Decimal (0.5-2.0, step 0.1):
```json
{
  "key": "speed",
  "type": "number",
  "default": 1.0,
  "min": 0.5,
  "max": 2.0,
  "step": 0.1
}
```

---

### 4. `boolean` - Checkbox

```json
{
  "key": "enabled",
  "label": "Enable Feature",
  "type": "boolean",
  "default": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `default` | boolean | Default checked state |

---

### 5. `select` - Static Dropdown

```json
{
  "key": "method",
  "label": "HTTP Method",
  "type": "select",
  "options": ["GET", "POST", "PUT", "DELETE"],
  "default": "GET"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `options` | array | List of options (strings) |
| `default` | string | Default selected option |
| `searchable` | boolean | Enable search/filter (default: false) |
| `searchPlaceholder` | string | Placeholder for search input |
| `placeholder` | string | Placeholder text when nothing selected |

**Examples:**

Simple options:
```json
{
  "key": "priority",
  "type": "select",
  "options": ["low", "medium", "high"],
  "default": "medium"
}
```

Searchable dropdown (for long lists):
```json
{
  "key": "country",
  "label": "Country",
  "type": "select",
  "options": ["Afghanistan", "Albania", "Algeria", "...200+ more..."],
  "searchable": true,
  "searchPlaceholder": "Search countries...",
  "placeholder": "Select a country..."
}
```

HTTP methods:
```json
{
  "key": "method",
  "type": "select",
  "options": ["GET", "POST", "PUT", "PATCH", "DELETE"],
  "default": "GET"
}
```

---

### 6. `select_database` - Database-Driven Dropdown

Fetches options from database query.

```json
{
  "key": "audioFile",
  "label": "Audio File",
  "type": "select_database",
  "query": "SELECT id, title, file_url FROM audio_files WHERE status = 1",
  "valueField": "id",
  "labelField": "title",
  "previewField": "file_url",
  "propertyType": "media_audio",
  "placeholder": "Select audio file...",
  "required": true
}
```

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Must be `"select_database"` |
| `query` | string | SQL SELECT query |
| `valueField` | string | Column for option value |
| `labelField` | string | Column for option label |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `placeholder` | string | Dropdown placeholder text |
| `required` | boolean | Mark as required |
| `propertyType` | string | Preview type (see below) |
| `previewField` | string | Column for preview URL |
| `searchable` | boolean | Enable search/filter (default: false) |
| `searchPlaceholder` | string | Placeholder for search input |
| `dependsOn` | string | Key of parent property (for cascading dropdowns) |
| `disabledPlaceholder` | string | Placeholder when parent not selected |
| `dependencyOptional` | boolean | If true, show fallback options when query returns empty |
| `options` | array | Fallback options for dependencyOptional |

#### Cascading Dropdowns (dependsOn)

Use `dependsOn` to create parent-child dropdown relationships:

```json
{
  "key": "category",
  "label": "Category",
  "type": "select_database",
  "query": "SELECT id, name FROM categories WHERE active = 1",
  "valueField": "id",
  "labelField": "name"
},
{
  "key": "subcategory",
  "label": "Subcategory",
  "type": "select_database",
  "query": "SELECT id, name FROM subcategories WHERE category_id = {{category}}",
  "valueField": "id",
  "labelField": "name",
  "dependsOn": "category",
  "disabledPlaceholder": "Select a category first..."
}
```

**How it works:**
1. Child dropdown is disabled until parent has a value
2. `{{category}}` placeholder in query is replaced with parent's selected value
3. When parent changes, child value clears and options refresh
4. Custom `disabledPlaceholder` shown when parent not selected

#### Fallback Options (dependencyOptional)

Use when you want to show static options if the database query returns empty:

```json
{
  "key": "city",
  "type": "select_database",
  "query": "SELECT id, name FROM cities WHERE country_id = {{country}}",
  "valueField": "id",
  "labelField": "name",
  "dependsOn": "country",
  "dependencyOptional": true,
  "options": ["New York", "London", "Tokyo", "Paris"]
}
```

#### Property Types (for preview)

| propertyType | Description | Preview |
|--------------|-------------|---------|
| `media_audio` | Audio file | Audio player |
| `media_image` | Image file | Image thumbnail |
| `media_video` | Video file | Video player |
| *(not set)* | No preview | Just dropdown |

#### Examples

**Simple dropdown (no preview):**
```json
{
  "key": "category",
  "label": "Category",
  "type": "select_database",
  "query": "SELECT id, name FROM categories ORDER BY name",
  "valueField": "id",
  "labelField": "name",
  "placeholder": "Select category..."
}
```

**Audio with preview:**
```json
{
  "key": "audioFile",
  "label": "Audio File",
  "type": "select_database",
  "propertyType": "media_audio",
  "query": "SELECT id, title, file_url FROM audio_files WHERE status = 1",
  "valueField": "id",
  "labelField": "title",
  "previewField": "file_url",
  "placeholder": "Select audio..."
}
```

**Image with preview:**
```json
{
  "key": "image",
  "label": "Image",
  "type": "select_database",
  "propertyType": "media_image",
  "query": "SELECT id, title, image_url FROM images WHERE active = 1",
  "valueField": "id",
  "labelField": "title",
  "previewField": "image_url",
  "placeholder": "Select image..."
}
```

**Video with preview:**
```json
{
  "key": "video",
  "label": "Video",
  "type": "select_database",
  "propertyType": "media_video",
  "query": "SELECT id, title, video_url FROM videos WHERE status = 'active'",
  "valueField": "id",
  "labelField": "title",
  "previewField": "video_url",
  "placeholder": "Select video..."
}
```

**Filtered by user:**
```json
{
  "key": "myFiles",
  "type": "select_database",
  "query": "SELECT id, name, url FROM files WHERE user_id = 1 AND type = 'audio'",
  "valueField": "id",
  "labelField": "name",
  "previewField": "url",
  "propertyType": "media_audio"
}
```

**Searchable dropdown (recommended for large datasets):**
```json
{
  "key": "audioFile",
  "label": "Audio File",
  "type": "select_database",
  "propertyType": "media_audio",
  "query": "SELECT id, title, file_url FROM audio_files WHERE status = 1",
  "valueField": "id",
  "labelField": "title",
  "previewField": "file_url",
  "placeholder": "Select audio file...",
  "searchable": true,
  "searchPlaceholder": "Search audio files..."
}
```

---

## Complete Examples

### Example 1: Start Block (No inputs, single output)

```json
{
  "start": {
    "id": "start",
    "name": "Start",
    "category": "control",
    "icon": "▶️",
    "color": "#00BCD4",
    "inputs": {
      "min": 0,
      "max": 0,
      "labels": []
    },
    "outputs": {
      "min": 1,
      "max": 1,
      "labels": ["start"],
      "mode": "fixed"
    },
    "properties": []
  }
}
```

---

### Example 2: End Block (Multiple inputs, no outputs)

```json
{
  "end": {
    "id": "end",
    "name": "End",
    "category": "control",
    "icon": "⏹️",
    "color": "#F44336",
    "inputs": {
      "min": 1,
      "max": 10,
      "labels": ["input"]
    },
    "outputs": {
      "min": 0,
      "max": 0,
      "labels": []
    },
    "properties": [
      {
        "key": "message",
        "label": "End Message",
        "type": "text",
        "placeholder": "Flow completed successfully"
      }
    ]
  }
}
```

---

### Example 3: If/Else Block (Condition with fixed outputs)

```json
{
  "if_else": {
    "id": "if_else",
    "name": "If/Else Condition",
    "category": "logic",
    "icon": "🔀",
    "color": "#FF9800",
    "inputs": {
      "min": 1,
      "max": 1,
      "labels": ["input"]
    },
    "outputs": {
      "min": 2,
      "max": 2,
      "labels": ["true", "false"],
      "mode": "fixed"
    },
    "properties": [
      {
        "key": "condition",
        "label": "Condition",
        "type": "textarea",
        "placeholder": "e.g., value > 100",
        "required": true,
        "showPredefinedVariables": true
      }
    ]
  }
}
```

---

### Example 4: HTTP Request Block (Multiple property types)

```json
{
  "http_request": {
    "id": "http_request",
    "name": "HTTP Request",
    "category": "api",
    "icon": "🌐",
    "color": "#9C27B0",
    "inputs": {
      "min": 1,
      "max": 1,
      "labels": ["trigger"]
    },
    "outputs": {
      "min": 2,
      "max": 2,
      "labels": ["success", "error"],
      "mode": "fixed"
    },
    "properties": [
      {
        "key": "method",
        "label": "HTTP Method",
        "type": "select",
        "options": ["GET", "POST", "PUT", "PATCH", "DELETE"],
        "default": "GET"
      },
      {
        "key": "url",
        "label": "URL",
        "type": "text",
        "placeholder": "https://api.example.com/endpoint",
        "required": true,
        "showPredefinedVariables": true
      },
      {
        "key": "headers",
        "label": "Headers (JSON)",
        "type": "textarea",
        "placeholder": "{\n  \"Content-Type\": \"application/json\"\n}"
      },
      {
        "key": "body",
        "label": "Request Body",
        "type": "textarea",
        "placeholder": "Request body for POST/PUT",
        "showPredefinedVariables": true
      },
      {
        "key": "timeout",
        "label": "Timeout (seconds)",
        "type": "number",
        "default": 30,
        "min": 1,
        "max": 300
      },
      {
        "key": "retryOnError",
        "label": "Retry on Error",
        "type": "boolean",
        "default": false
      }
    ]
  }
}
```

---

### Example 5: Audio Playback Block (Database select with preview)

```json
{
  "audio_playback": {
    "id": "audio_playback",
    "name": "Audio Playback",
    "category": "media",
    "icon": "🔊",
    "color": "#4CAF50",
    "inputs": {
      "min": 0,
      "max": 1,
      "labels": ["trigger"]
    },
    "outputs": {
      "min": 1,
      "max": 5,
      "labels": ["completed", "error", "skipped"],
      "mode": "dynamic"
    },
    "properties": [
      {
        "key": "audioFile",
        "label": "Audio File",
        "type": "select_database",
        "propertyType": "media_audio",
        "query": "SELECT id, title, file_url FROM audio_files WHERE status = 1 ORDER BY title",
        "valueField": "id",
        "labelField": "title",
        "previewField": "file_url",
        "placeholder": "Select audio file...",
        "required": true
      },
      {
        "key": "volume",
        "label": "Volume",
        "type": "number",
        "default": 100,
        "min": 0,
        "max": 100,
        "step": 5
      },
      {
        "key": "loop",
        "label": "Loop Audio",
        "type": "boolean",
        "default": false
      }
    ]
  }
}
```

---

### Example 6: Merge Block (Unlimited inputs)

```json
{
  "merge": {
    "id": "merge",
    "name": "Merge",
    "category": "logic",
    "icon": "🔗",
    "color": "#673AB7",
    "inputs": {
      "min": 2,
      "max": -1,
      "labels": ["input"]
    },
    "outputs": {
      "min": 1,
      "max": 1,
      "labels": ["merged"],
      "mode": "fixed"
    },
    "properties": [
      {
        "key": "mergeStrategy",
        "label": "Merge Strategy",
        "type": "select",
        "options": ["wait_all", "first_complete", "last_complete"],
        "default": "wait_all"
      }
    ]
  }
}
```

---

### Example 7: Text to Speech Block (All property types)

```json
{
  "text_to_speech": {
    "id": "text_to_speech",
    "name": "Text to Speech",
    "category": "ai",
    "icon": "💬",
    "color": "#2196F3",
    "inputs": {
      "min": 1,
      "max": 1,
      "labels": ["input"]
    },
    "outputs": {
      "min": 2,
      "max": 2,
      "labels": ["success", "error"],
      "mode": "fixed"
    },
    "properties": [
      {
        "key": "text",
        "label": "Text to Speak",
        "type": "textarea",
        "placeholder": "Enter text or use variables...",
        "required": true,
        "showPredefinedVariables": true
      },
      {
        "key": "voice",
        "label": "Voice",
        "type": "select",
        "options": ["male", "female", "neutral"],
        "default": "neutral"
      },
      {
        "key": "language",
        "label": "Language",
        "type": "select",
        "options": ["en-US", "en-GB", "es-ES", "fr-FR", "de-DE"],
        "default": "en-US"
      },
      {
        "key": "speed",
        "label": "Speed",
        "type": "number",
        "default": 1.0,
        "min": 0.5,
        "max": 2.0,
        "step": 0.1
      },
      {
        "key": "pitch",
        "label": "Pitch",
        "type": "number",
        "default": 1.0,
        "min": 0.5,
        "max": 2.0,
        "step": 0.1
      },
      {
        "key": "saveToFile",
        "label": "Save to File",
        "type": "boolean",
        "default": false
      }
    ]
  }
}
```

---

### Example 8: Switch/Router Block (Dynamic outputs)

```json
{
  "switch": {
    "id": "switch",
    "name": "Switch / Router",
    "category": "logic",
    "icon": "🔀",
    "color": "#FF5722",
    "inputs": {
      "min": 1,
      "max": 1,
      "labels": ["input"]
    },
    "outputs": {
      "min": 2,
      "max": 20,
      "labels": ["case_1", "case_2", "default"],
      "mode": "dynamic"
    },
    "properties": [
      {
        "key": "switchVariable",
        "label": "Switch Variable",
        "type": "text",
        "placeholder": "e.g., {{input.value}}",
        "required": true,
        "showPredefinedVariables": true
      },
      {
        "key": "matchType",
        "label": "Match Type",
        "type": "select",
        "options": ["exact", "contains", "regex"],
        "default": "exact"
      }
    ]
  }
}
```

---

## Quick Reference Table

### Property Types Summary

| Type | Description | Key Fields |
|------|-------------|------------|
| `text` | Single line input | `placeholder`, `showPredefinedVariables` |
| `textarea` | Multi-line input | `placeholder`, `showPredefinedVariables` |
| `number` | Numeric input | `min`, `max`, `step`, `default` |
| `boolean` | Checkbox | `default` |
| `select` | Static dropdown | `options`, `default` |
| `select_database` | DB dropdown | `query`, `valueField`, `labelField`, `propertyType`, `previewField` |

### Special Values

| Value | Where | Meaning |
|-------|-------|---------|
| `-1` | `inputs.max` / `outputs.max` | Unlimited |
| `"fixed"` | `outputs.mode` | User cannot modify outputs |
| `"dynamic"` | `outputs.mode` | User can add/remove/rename outputs |
| `"media_audio"` | `propertyType` | Show audio player preview |
| `"media_image"` | `propertyType` | Show image preview |
| `"media_video"` | `propertyType` | Show video player preview |

---

## Full Template

```json
{
  "systemVariables": [
    {
      "key": "{{variable}}",
      "label": "Display Label",
      "description": "Help text"
    }
  ],
  "blockTypes": {
    "block_id": {
      "id": "block_id",
      "name": "Block Name",
      "category": "category",
      "icon": "🎯",
      "color": "#HEXCOLOR",
      "inputs": {
        "min": 0,
        "max": 1,
        "labels": ["input"]
      },
      "outputs": {
        "min": 1,
        "max": 2,
        "labels": ["success", "error"],
        "mode": "fixed"
      },
      "properties": [
        {
          "key": "propKey",
          "label": "Property Label",
          "type": "text|textarea|number|boolean|select|select_database",
          "placeholder": "...",
          "required": true,
          "default": "...",
          "showPredefinedVariables": true,
          "options": ["..."],
          "min": 0,
          "max": 100,
          "step": 1,
          "query": "SELECT ...",
          "valueField": "id",
          "labelField": "name",
          "previewField": "url",
          "propertyType": "media_audio|media_image|media_video"
        }
      ]
    }
  }
}
```

---

**This is the complete reference for blockDefinitions.json!** 🎉
