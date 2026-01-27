# Notes Queue Service

A job scheduling service using [Agenda](https://github.com/agenda/agenda) for managing background tasks related to notes.

## Features

- **Scheduled Jobs**: Uses Agenda for reliable job scheduling with MongoDB persistence
- **Cleanup Deleted Notes**: Automatically removes notes that have been in trash for over 30 days

## Prerequisites

- Node.js 18+
- MongoDB (local or cloud)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
APP_NAME=Notes Queue Service
ENV=local
DATABASE=mongodb://127.0.0.1:27017/notes
DATABASE_PROD=mongodb+srv://your-connection-string
```

## Development

```bash
# Run in development mode
npm run dev

# Watch for changes and rebuild
npm run watch
```

## Production

```bash
# Build TypeScript
npm run build

# Start the service
npm start
```

## Jobs

### cleanup-deleted-notes

Runs every hour to permanently delete notes that:

- Have `deleted: true`
- Have `deletedDate` older than 30 days

## Project Structure

```
src/
├── index.ts           # Application entry point
├── agenda.ts          # Agenda configuration and job scheduling
├── config/
│   └── database.ts    # MongoDB connection setup
├── jobs/
│   └── cleanupDeletedNotes.ts  # Cleanup job definition
└── models/
    └── Note.ts        # Mongoose Note model
```
