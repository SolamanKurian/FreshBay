const customerController=require("../controllers/customerController")
const Customer= require('../models/customerModel')


const isSession=async(req,res,next)=>{
try {
if(req.session.customer_id){
    const userData=await Customer.findOne({_id:req.session.customer_id})
    if(userData.Is_blocked == false){
    next();
}else{
delete req.session.customer_id;
res.redirect('/login')
}}
else{
    res.redirect('/login')
}

   
} catch (error) {
  console.log(error.message);
}
}


const noSession=async(req,res,next)=>{

    try {
        if(req.session.user_id){
            res.redirect('/customerHome')
        }else{
            next()
        }


    
} catch (error) {
    console.log(error.message);
}

}

module.exports={
    isSession,
    noSession
}