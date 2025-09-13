const mongoose = require('mongoose');

console.log("test 1");

const keySchema = new mongoose.Schema({
    keyId: {
        type: String,
        unique: true,
        index: true,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },

    expiresAt: {
        type: Date,
        required: true,
    },

    isBlocked: {
        type: Boolean,
        default: false,
        required: true,
    },

    blockedAt: {
        type: Date,
    }
});

keySchema.index({"expiresAt": 1}, {expireAfterSeconds: 0});

keySchema.index({isBlocked: 1});

const Key = mongoose.model('Key', keySchema);

console.log("test 2");
module.exports = Key;