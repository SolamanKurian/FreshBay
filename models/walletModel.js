const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const walletSchema= mongoose.Schema({

    customerId: { type: ObjectId, required: true },
    balance: { type: Number, required: true },
    history: [{
        date: { type: Date, default:Date.now },
        type: { type: String, required: true },
        amount: { type: Number, required: true },
        balance: { type: Number, required: true },
        about: { type: String },
        
    }]
   

})

module.exports=mongoose.model('Wallet',walletSchema)