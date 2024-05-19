const mongoose=require("mongoose")

const generateRandomString = () => {
    
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 10;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

const customerSchema= mongoose.Schema({

    Is_verified: { type: Boolean, required: true,default:0 },
    Is_Active: { type: Boolean, required: true,default:0 },
    Name: { type: String, required: true },
    Phone: { type: Number},
    Email: { type: String, required: true },
    Password: { type: String},
    Is_blocked: { type: Boolean, required: true,default:0 },
    Propic: { type: String },
    Referal: { type: String, default: generateRandomString },

})

module.exports=mongoose.model('Customer',customerSchema)