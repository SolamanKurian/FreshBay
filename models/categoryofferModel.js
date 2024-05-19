const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const cofferSchema= mongoose.Schema({

    categoryId: { type: ObjectId, required: true,ref: 'Category'},
    percentage: { type: Number, required: true },
    date:{ type: Date, index:{expires:0} }

})

module.exports=mongoose.model('Coffer',cofferSchema)