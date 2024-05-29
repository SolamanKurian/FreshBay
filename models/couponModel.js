const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const couponSchema= mongoose.Schema({

    couponcode: { type: String},
    percentage: { type: Number  },
    maxlimit: { type: Number  },
    minlimit: { type: Number},
    date:{ type: Date, index:{expires:0} }

})

module.exports=mongoose.model('Coupon',couponSchema)