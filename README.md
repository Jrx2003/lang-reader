# Lang Reader Backend

Backend API server for the Lang Reader application, providing data storage and retrieval for language learning projects.

## Features

- RESTful API for project management
- MongoDB integration for data storage
- Full CRUD operations for projects and breakpoints

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | Get all projects |
| `/api/projects/:id` | GET | Get a specific project by ID |
| `/api/projects` | POST | Create a new project |
| `/api/projects/:id` | PUT | Update an existing project |
| `/api/projects/:id` | DELETE | Delete a project |

## Project Schema

```javascript
{
  name: String,
  description: String,
  videoUrl: String,
  createdAt: Date,
  breakpoints: [
    {
      time: Number,
      note: String
    }
  ],
  notesText: String
}
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd project3/backend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file with the following content:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/lang-reader
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The server will run on `http://localhost:3000`.

## Production Deployment

For production, use:

```bash
npm start
# or
yarn start
``` 