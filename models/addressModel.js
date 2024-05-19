const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const addressSchema= mongoose.Schema({

    customerId: { type: ObjectId },
    address:[{name:{ type: String },
        mobile:{ type: String },
        pincode:{ type: String },
        house:{ type: String },
        street:{ type: String },
        city:{ type: String },
        state:{ type: String }
    }] 
})

module.exports=mongoose.model('Address',addressSchema)