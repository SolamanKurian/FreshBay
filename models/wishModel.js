const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const wishSchema= mongoose.Schema({

    customerId: { type: ObjectId, required: true },
    items: [{
        productId:{type:ObjectId,required:true,ref:'Product'},
        
    }]
   

})

module.exports=mongoose.model('Wish',wishSchema)