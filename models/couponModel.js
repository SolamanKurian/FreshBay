const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const couponSchema= mongoose.Schema({

    couponcode: { type: String, required: true},
    percentage: { type: Number, required: true },
    maxlimit: { type: Number, required: true },
    minlimit: { type: Number, required: true },
    date:{ type: Date, index:{expires:0} }

})

module.exports=mongoose.model('Coupon',couponSchema)