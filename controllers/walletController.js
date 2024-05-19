


const Customer= require('../models/customerModel')
const Order=require('../models/orderModel')
const axios=require("axios")
const Swal=require("sweetalert2")
const Wallet=require("../models/walletModel")
const Razorpay=require("razorpay")
const {RAZORPAY_ID_KEY="rzp_test_tpxAgS1qkPohwa",RAZORPAY_SECRET_KEY="FbXyKB01agAAbmXGkIe6xcFd"}=process.env;
const razorpayInstance=new Razorpay({
  key_id:RAZORPAY_ID_KEY,
  key_secret:RAZORPAY_SECRET_KEY
})


//to create wallet and  load wallet page 
const loadWallet=async(req,res,next)=>{
    try {
        const customerId=req.session.customer_id
        const haveWallet= await Wallet.findOne({customerId:customerId})
        const customer=await Customer.findOne({_id:req.session.customer_id})
        if(haveWallet){
            res.render('wallet',{customer:customer,wallet:haveWallet})
        }else{
            const wallet=new Wallet({
                customerId:req.session.customer_id,
                balance:'0',
                history:[]
            })
            const walletData= await wallet.save()
            if(walletData){
                const newWallet= await Wallet.findOne({customerId:customerId})
                res.render('wallet',{customer:customer,wallet:newWallet})
            }
        }
    
        
    } catch (error) {
        next(error)
    }
}


// to add money to wallet

const addMoney=async(req,res,next)=>{
    try {
        const customerId=req.session.customer_id
        const haveWallet= await Wallet.findOne({customerId:customerId})
        if(haveWallet){
        const amount=req.query.amount*100
              const options={
                amount:amount,
                currency:'INR',
                receipt:'solamankurian.mec@gmail.com'
              }
              razorpayInstance.orders.create(options,(order)=>{
              
                  
                return res.json({
                     success:true,
                     msg:'Money Added',
                     order_id:order.id,
                     amount:amount,
                     key_id:RAZORPAY_ID_KEY,
                     

                   })

               })}else{
                res.json({success:false})
               }
        
    } catch (error) {
        next(error)
    }
}
// to add money to wallet
const addMoneyToWallet=async(req,res,next)=>{
   
    try {
        let amount=req.query.amount/100;
        const customerId=req.session.customer_id
        const haveWallet= await Wallet.findOne({customerId:customerId})
        if(haveWallet){
            let balance=haveWallet.balance;
            let newbalance=balance+amount;
            haveWallet.balance=newbalance;
            haveWallet.history.push({
        type: 'Credit',
        amount: amount,
        balance: newbalance,
        about:'Bank credit'
        
            })
            const updated=await haveWallet.save()
            if(updated){
                res.redirect('/wallet/walletPage')
            }
        }
       
        
    } catch (error) {
        next(error)
    }
}
//to load the history page
const history= async (req,res,next)=>{
try {
    const customerId=req.session.customer_id
    const customer=await Customer.findOne({_id:req.session.customer_id})
    const haveWallet= await Wallet.findOne({customerId:customerId})
    res.render('walletHistory',{customer:customer,wallet:haveWallet})

} catch (error) {
    next(error)
}
}
module.exports={
    loadWallet,
    addMoney,
    addMoneyToWallet,
    history

  
}