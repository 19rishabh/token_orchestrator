# Token Orchestrator
An API key management system built with Node.js, Express, and MongoDB. It is designed to manage a pool of temporary, expiring keys for systems that need to control access to a limited number of concurrent workers or resource slots. This project is analogous to a digital keycard system for a hotel conference room, a library card, or a software license with a limited number of seats.

Clients can request a key, use it for a task, and must send periodic heartbeats to keep it "alive." The system includes automatic failsafes to release keys that are no longer in use and to permanently delete keys after a set duration, ensuring the pool remains healthy and secure.

## Features
- **Dynamic Key Generation**: Create unique keys that are available in a shared pool.
- **Atomic Key Assignment**: Retrieve and "block" an available key in a single, atomic operation to prevent race conditions.
- **Hard Expiration**: Keys are automatically deleted from the database 5 minutes after they are created or refreshed, enforced by a MongoDB TTL index.
- **Lease Expiration**: Assigned keys are automatically unblocked if the client fails to send a "keep-alive" signal within 60 seconds, enforced by a background job.
- **Keep-Alive Mechanism**: Clients can periodically send a heartbeat signal to extend their lease on a key.
- **Explicit Release**: Clients can explicitly unblock a key when their work is complete.
- **Efficient & Scalable**: Operations are designed for O(1) or O(log n) complexity, avoiding inefficient iterations over the key pool.

## Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML, Tailwind CSS (via CDN), JavaScript

## Backend Setup

**Clone the repository**:
```
git clone <repository-url>
cd <repository-directory>
```
**Install dependencies**:
```
npm install
```
**Create a .env file in the root directory**:
```
MONGODB_URI=<YOUR_MONGO_URI>
PORT=3000
```
**Start the server**:
```
npm run dev
```
The server should now be running on the port specified in your .env file (e.g., http://localhost:3000).

## Frontend Setup
No Installation Needed: Simply open the index.html file in your web browser.


