const dotenv = require('dotenv');
dotenv.config();
const Key = require('./src/models/Key');
const express = require('express');
const cors = require('cors'); 
const connectDB = require('./src/config/db')
const keyRoutes = require('./src/routes/keyRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/keys', keyRoutes);

//check every 10 seconds
const AUTO_UNBLOCK_INTERVAL = 10000;

//blocked for 60 seconds
const BLOCK_TIMEOUT = 60000;

// background job
setInterval(async () => {
    try {
        const sixtySecondsAgo =new Date(Date.now() - BLOCK_TIMEOUT);
        
        const result = await Key.updateMany(
            { 
                isBlocked: true, 
                blockedAt: { $lt: sixtySecondsAgo } 
            },
            { 
                $set: { isBlocked: false },
                $unset: { blockedAt: "" } 
            }
        );
        if (result.modifiedCount>0) {
            console.log(`Auto-unblocked ${result.modifiedCount} keys.`);
        }
    }catch (error) {
        console.error('Error auto-unblocking keys:', error);
    }
}, AUTO_UNBLOCK_INTERVAL);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
