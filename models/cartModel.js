const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const cartSchema= mongoose.Schema({

    customerId: { type: ObjectId, required: true },
    items: [{
        productId:{type:ObjectId,required:true,ref:'Product'},
        quantity: {type:Number,required:true,default:1}
    }]
   

})

module.exports=mongoose.model('Cart',cartSchema)