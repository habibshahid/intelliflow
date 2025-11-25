# IntelliFlow - Simple Database Select

## 🎯 What This Does

Populate dropdowns from database queries. Simple.

**No connection management on frontend** - backend handles all database connections.

---

## ⚡ Quick Setup (5 minutes)

### 1. Configure Backend Database

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=intelliflow
```

### 2. Start Backend

```bash
cd backend
npm install
npm start
```

### 3. Start Frontend

```bash
npm install
npm run dev
```

**Done!** ✓

---

## 📝 How to Use

### In blockDefinitions.json:

```json
{
  "key": "audioFile",
  "label": "Audio File",
  "type": "select_database",
  "query": "SELECT id, title, file_url FROM audio_files WHERE status = 1",
  "valueField": "id",
  "labelField": "title"
}
```

### With Preview (Audio/Image/Video):

```json
{
  "key": "audioFile",
  "type": "select_database",
  "propertyType": "media_audio",
  "query": "SELECT id, title, file_url FROM audio_files",
  "valueField": "id",
  "labelField": "title",
  "previewField": "file_url",
  "searchable": true,
  "searchPlaceholder": "Search audio files..."
}
```

---

## 🔧 Property Fields

| Field | Required | Description |
|-------|----------|-------------|
| `type` | ✅ | `"select_database"` |
| `query` | ✅ | SQL query |
| `valueField` | ✅ | Column for option value |
| `labelField` | ✅ | Column for option label |
| `propertyType` | ❌ | `media_audio`, `media_image`, `media_video` |
| `previewField` | ❌ | Column for preview URL |
| `placeholder` | ❌ | Dropdown placeholder |
| `searchable` | ❌ | Enable search/filter (`true`/`false`) |
| `searchPlaceholder` | ❌ | Search input placeholder |

---

## 🎨 Preview Types

### Audio
```json
{
  "propertyType": "media_audio",
  "previewField": "file_url"
}
```
Shows audio player when option selected.

### Image
```json
{
  "propertyType": "media_image",
  "previewField": "image_url"
}
```
Shows image thumbnail when option selected.

### Video
```json
{
  "propertyType": "media_video",
  "previewField": "video_url"
}
```
Shows video player when option selected.

---

## 📊 Example Database

```sql
CREATE TABLE audio_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  file_url VARCHAR(500),
  status TINYINT DEFAULT 1
);

INSERT INTO audio_files VALUES
(1, 'Welcome Message', 'https://example.com/welcome.mp3', 1),
(2, 'Background Music', 'https://example.com/music.mp3', 1);
```

---

## 🗂️ File Structure

```
intelliflow-simple/
├── backend/
│   ├── server.js       ← API + database connection
│   ├── package.json
│   └── .env.example    ← Configure database here
│
├── src/
│   ├── components/
│   │   └── PropertyPanel.jsx  ← Renders select_database
│   ├── services/
│   │   └── databaseApi.js     ← API calls
│   └── blockDefinitions.json  ← Your block configs
│
└── .env.example        ← Frontend config
```

---

## 🔄 How It Works

```
1. Frontend reads blockDefinitions.json
2. PropertyPanel sees type: "select_database"
3. Sends query to backend: POST /api/select-options
4. Backend executes query on MySQL
5. Returns options: [{ value, label, preview }]
6. Frontend shows dropdown + preview
```

---

## 🐛 Troubleshooting

**Options not loading?**
- Check backend is running: `curl localhost:3001/health`
- Check database config in `backend/.env`
- Test database: `curl localhost:3001/api/test-db`

**Preview not showing?**
- Set `propertyType` in config
- Set `previewField` to URL column
- Check URL is valid

---

## ✅ Benefits of This Approach

✅ **Simple** - No connection management UI  
✅ **Secure** - Credentials stay on backend  
✅ **Fast** - Connection pooling  
✅ **Clean** - Just query + fields in JSON  

---

## 📖 API Reference

### POST /api/select-options

**Request:**
```json
{
  "query": "SELECT id, name FROM users",
  "valueField": "id",
  "labelField": "name",
  "previewField": "avatar_url"
}
```

**Response:**
```json
{
  "success": true,
  "options": [
    { "value": 1, "label": "John", "preview": "https://..." },
    { "value": 2, "label": "Jane", "preview": "https://..." }
  ],
  "count": 2
}
```

---

**That's it! Simple database selects without the complexity.** 🎉
