const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const productSchema= mongoose.Schema({

    
    Name: { type: String, required: true },
    Price: { type: Number, required: true },
    Quantity: { type: Number, required: true },
    Category: { type: ObjectId, required: true, ref: 'Category'},
    Image:[{type:String}],
    Is_delete: { type: Boolean, required: true,default:0 },
    Pdesc: { type: String },
    Date:{type:Date},
    Offerprice:{type:Number}
    

})

module.exports=mongoose.model('Product',productSchema)