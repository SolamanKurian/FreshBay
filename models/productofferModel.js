const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const pofferSchema= mongoose.Schema({

    productId: { type: ObjectId, required: true,ref: 'Product'},
    percentage: { type: Number, required: true },
    date:{ type: Date, index:{expires:0} }

})

module.exports=mongoose.model('Poffer',pofferSchema)