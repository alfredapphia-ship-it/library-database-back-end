LIBRARY MANAGEMENT SYSTEM-BACKEND

# Clone & install
git clone <https://github.com/alfredapphia-ship-it/library-database-back-end/tree/main>
cd libra-backend
npm install

# Setup environment
cp .env.example .env
# Edit .env and add: MONGO_URI=mongodb://localhost:27017/Libra

# Optional: Seed sample data
node seedData.js

# Run the server
npm start
