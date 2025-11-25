# blockDefinitions.json - Cheat Sheet

## 📦 File Structure
```json
{
  "systemVariables": [...],
  "blockTypes": { "block_id": {...} }
}
```

---

## 🏷️ Block Definition
```json
{
  "my_block": {
    "id": "my_block",
    "name": "My Block",
    "category": "logic",
    "icon": "🎯",
    "color": "#4CAF50",
    "inputs": { "min": 1, "max": 1, "labels": ["input"] },
    "outputs": { "min": 2, "max": 2, "labels": ["yes", "no"], "mode": "fixed" },
    "properties": [...]
  }
}
```

---

## ⬅️ Inputs
```json
"inputs": {
  "min": 0,        // Required minimum
  "max": 1,        // Maximum allowed (-1 = unlimited)
  "labels": ["trigger"]
}
```

## ➡️ Outputs
```json
"outputs": {
  "min": 1,
  "max": 2,
  "labels": ["success", "error"],
  "mode": "fixed"   // "fixed" or "dynamic"
}
```

| mode | Description |
|------|-------------|
| `fixed` | User cannot change outputs |
| `dynamic` | User can add/remove/rename outputs |

---

## 📝 Property Types

### text
```json
{ "key": "url", "label": "URL", "type": "text", "placeholder": "https://...", "required": true, "showPredefinedVariables": true }
```

### textarea
```json
{ "key": "body", "label": "Body", "type": "textarea", "placeholder": "Enter JSON...", "showPredefinedVariables": true }
```

### number
```json
{ "key": "volume", "label": "Volume", "type": "number", "default": 100, "min": 0, "max": 100, "step": 1 }
```

### boolean
```json
{ "key": "enabled", "label": "Enabled", "type": "boolean", "default": true }
```

### select
```json
{ "key": "method", "label": "Method", "type": "select", "options": ["GET", "POST", "PUT"], "default": "GET" }
```

### select (searchable)
```json
{ "key": "country", "type": "select", "options": ["USA", "UK", "..."], "searchable": true, "searchPlaceholder": "Search..." }
```

### select_database
```json
{
  "key": "audioFile",
  "label": "Audio",
  "type": "select_database",
  "query": "SELECT id, title, file_url FROM audio_files",
  "valueField": "id",
  "labelField": "title",
  "previewField": "file_url",
  "propertyType": "media_audio",
  "placeholder": "Select...",
  "searchable": true,
  "searchPlaceholder": "Search..."
}
```

### select_database (cascading/dependent)
```json
{
  "key": "category",
  "type": "select_database",
  "query": "SELECT id, name FROM categories",
  "valueField": "id",
  "labelField": "name"
},
{
  "key": "item",
  "type": "select_database",
  "query": "SELECT id, name FROM items WHERE category_id = {{category}}",
  "valueField": "id",
  "labelField": "name",
  "dependsOn": "category",
  "disabledPlaceholder": "Select category first..."
}
```

| propertyType | Preview |
|--------------|---------|
| `media_audio` | Audio player |
| `media_image` | Image thumbnail |
| `media_video` | Video player |
| *(none)* | Just dropdown |

---

## 🔢 System Variables
```json
"systemVariables": [
  { "key": "{{user.name}}", "label": "User Name", "description": "Current user" },
  { "key": "{{timestamp}}", "label": "Timestamp", "description": "Current datetime" },
  { "key": "{{input.data}}", "label": "Input", "description": "Data from previous block" }
]
```

---

## ⚡ Quick Examples

**Start (no inputs):**
```json
"inputs": { "min": 0, "max": 0, "labels": [] }
"outputs": { "min": 1, "max": 1, "labels": ["start"], "mode": "fixed" }
```

**End (no outputs):**
```json
"inputs": { "min": 1, "max": 10, "labels": ["input"] }
"outputs": { "min": 0, "max": 0, "labels": [] }
```

**If/Else (2 fixed outputs):**
```json
"outputs": { "min": 2, "max": 2, "labels": ["true", "false"], "mode": "fixed" }
```

**Switch (dynamic outputs):**
```json
"outputs": { "min": 2, "max": 20, "labels": ["case1", "default"], "mode": "dynamic" }
```

**Merge (unlimited inputs):**
```json
"inputs": { "min": 2, "max": -1, "labels": ["input"] }
```

---

## 🎨 Common Colors

| Color | Hex | Use |
|-------|-----|-----|
| 🔵 Blue | `#2196F3` | AI, processing |
| 🟢 Green | `#4CAF50` | Success, media |
| 🟠 Orange | `#FF9800` | Logic, conditions |
| 🔴 Red | `#F44336` | End, error, delete |
| 🟣 Purple | `#9C27B0` | API, advanced |
| 🔷 Cyan | `#00BCD4` | Start, control |
| 🟤 Brown | `#795548` | Data, storage |

---

## 📋 Property Fields Summary

| Field | Types | Description |
|-------|-------|-------------|
| `key` | all | Unique identifier |
| `label` | all | Display name |
| `type` | all | Property type |
| `required` | all | Show required marker |
| `default` | all | Default value |
| `placeholder` | text, textarea, select, select_database | Hint text |
| `showPredefinedVariables` | text, textarea | Show variables dropdown |
| `options` | select | Array of options |
| `min`, `max`, `step` | number | Numeric constraints |
| `query` | select_database | SQL query |
| `valueField`, `labelField` | select_database | Column mappings |
| `previewField` | select_database | Preview URL column |
| `propertyType` | select_database | Preview type |
| `searchable` | select, select_database | Enable search filter |
| `searchPlaceholder` | select, select_database | Search input placeholder |
| `dependsOn` | select_database | Parent property key (cascading) |
| `disabledPlaceholder` | select_database | Placeholder when parent not selected |
| `dependencyOptional` | select_database | Use fallback options if query empty |

## 🔧 Validation Script

Run validation:
```bash
npm run validate
```

Or directly:
```bash
node scripts/validateBlockDefinitions.js [path-to-file]
```

---

**Keep this handy!** 📌
