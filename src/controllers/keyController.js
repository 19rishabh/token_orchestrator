console.log("test 3");
const Key = require('../models/Key');
console.log("test 4");
const { v4: uuidv4 } = require('uuid');

//5 minute life
const KEY_LIFESPAN = 5*60*1000;

// Create key with expiry 5 minutes to deletion unless kept alive by user
exports.generateKey = async (req, res) => {
    try{
        const newKey = new Key({
            keyId: uuidv4(),
            expiresAt: new Date(Date.now()+KEY_LIFESPAN)
        });
        await newKey.save();
        res.status(201).json({ keyId: newKey.keyId});
    }
    catch(error)
    {
        console.error(error.message);
        res.status(500).send('Internal server error');
    }
};

// Retrive randomly available key for user if unblocked and block it
exports.getAvailableKey = async (req, res) =>{
    try{
        const keyDoc = await Key.findOneAndUpdate(
            { isBlocked: false },
            {
                $set: {
                    isBlocked: true,
                    blockedAt: new Date(),
                    expiresAt: new Date(Date.now() + KEY_LIFESPAN),
                }
            },
            { new: true } 
        );
        if(!keyDoc)
        {
            return res.status(404).json("No available keys");
        }
        return res.status(200).json({keyId: keyDoc.keyId});
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json("Internal server error");
    }
};

//Provide all info about this key
exports.getKeyInfo = async( req, res) =>{
    try{
        const keyDoc = await Key.findOne({ keyId: req.params.id });
        if(!keyDoc)
        {
            return res.status(404).json({ msg: " Key not found"});
        }
        res.status(200).json({
                isBlocked: keyDoc.isBlocked,
                blockedAt: keyDoc.blockedAt || null,
                createdAt: keyDoc.createdAt,
                expiresAt: keyDoc.expiresAt
            });
    }
    catch(error)
    {
        console.log(error.message);
        res.status(500).json("Internal server error");
    }
}

//Permanently delete this key from db
exports.deleteKey  = async( req, res) =>{
    try{
        const keyDoc = await Key.findOneAndDelete({ keyId: req.params.id });
        if(!keyDoc)
        {
            return res.status(404).json({ msg: " Key not found"});
        }
        res.status(200).json({msg: "Key deleted successfully"});
    }
    catch(error)
    {
        console.log(error.message);
        res.status(500).json("Internal server error");
    }
}

//Unblock previously assigned key for usage
exports.unblockKey  = async( req, res) =>{
    try{
        const keyDoc = await Key.findOneAndUpdate(
            { keyId: req.params.id },
            {
                $set: { isBlocked: false},
                $unset: { blockedAt: ""}
            }
        );
        if(!keyDoc)
        {
            return res.status(404).json({ msg: " Key not found"});
        }
        res.status(200).json({msg: "Key unblocked successfully"});
    }
    catch(error)
    {
        console.log(error.message);
        res.status(500).json("Internal server error");
    }
}


// If signalled key is kept alive for 5 more minutes
exports.keepAlive = async( req, res) =>{
    try{
        const keyDoc = await Key.findOneAndUpdate(
            { keyId: req.params.id, isBlocked: true },
            {
                $set: { 
                    blockedAt: new Date(),
                    isBlocked: true
                }
            }
        );
        if(!keyDoc)
        {
            return res.status(404).json({ msg: "Key not valid or not in use"});
        }
        res.status(200).json({msg: "Key lifespan extended"});
    }
    catch(error)
    {
        console.log(error.message);
        res.status(500).json("Internal server error");
    }
};

