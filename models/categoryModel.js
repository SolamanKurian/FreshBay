const mongoose=require("mongoose")

const categorySchema= mongoose.Schema({

    Name: { type: String, required: true },
    
    Is_delete: { type:Boolean, default:0},
})

module.exports=mongoose.model('Category',categorySchema)