const Customer= require('../models/customerModel')
const Product =require("../models/prodectmodel");
const Cart=require("../models/cartModel")
const Address=require("../models/addressModel")

const axios=require("axios");


// to secure the password

    //to render manage address page
    const loadManageAddress = async (req,res,next)=>{
        try {

            const customer=await Customer.findOne({_id:req.session.customer_id})
            res.render('address',{customer:customer})
            
        } catch (error) {
            next(error)
        }
    }

// to add adress to db
const addAddress=async(req,res,next)=>{
    
    
    
try {
    const customerId=req.session.customer_id
    const haveAddress= await Address.findOne({customerId:customerId})
    if(haveAddress){
        haveAddress.address.push({name:req.body.name,
            mobile:req.body.mobile,
            pincode:req.body.pincode,
            house:req.body.house,
            street:req.body.street,
            city:req.body.city,
            state:req.body.state})
        const addressData= await haveAddress.save()
    if(addressData){
        res.redirect('/address//manageAddress')
    }
    }else{
    const address=new Address({
        customerId:req.session.customer_id,
        address:[]
    })
    address.address.push({name:req.body.name,
        mobile:req.body.mobile,
        pincode:req.body.pincode,
        house:req.body.house,
        street:req.body.street,
        city:req.body.city,
        state:req.body.state})
    const addressData= await address.save()
if(addressData){
    res.redirect('/address//manageAddress')
}
}

}


catch (error) {
    next(error)
}



}

// to load existing address

const loadExistingAddress=async(req,res,next)=>{
    try {
        const customer=req.session.customer_id
        const address=await Address.findOne({customerId:customer})
        if(address){
            res.json({address:address})
        }else{
            res.json({success:false})
        }



    } catch (error) {
        next(error)
    }
}
// to load edit address

const loadEditAddress=async(req,res,next)=>{
    try {
        const Aindex=req.query.Aid
        
        const customer=await Customer.findOne({_id:req.session.customer_id})
        const addressOfCustomer=await Address.findOne({customerId:req.session.customer_id})

        const addressToEdit=addressOfCustomer.address[Aindex]
        
            res.render('editAddress',{customer:customer,add:addressToEdit})

        
    } catch (error) {
        next(error)
    }
}

//to edit and update address

const editAddress=async(req,res,next)=>{
try {
const address=await Address.findOne({customerId:req.session.customer_id})

if (address) {
    const addressToEdit = address.address.find(item => item._id.toString() === req.body.id);
if(addressToEdit){
    
    const updated=await Address.updateOne({'address._id':addressToEdit._id},{$set:{
        'address.$.name': req.body.name,
        'address.$.mobile': req.body.mobile,
         'address.$.pincode': req.body.pincode,
        'address.$.house': req.body.house,
        'address.$.street': req.body.street,
         'address.$.city': req.body.city,
         'address.$.state': req.body.state
}});
if(updated){
    res.redirect("/address/manageAddress")
}}}} catch (error) {
    next(error)
}}

//to remove address
const removeAddress=async(req,res,next)=>{
try {
    const customer = req.session.customer_id;
    const address = await Address.findOne({ customerId: customer })
    const addressToDelete = address.address.find(item => item._id.toString() === req.query.Aid);
    if(addressToDelete){
    await Address.updateOne(
        { customerId: customer },
        { $pull: { address: { "_id": req.query.Aid } } }
      );
      res.json({success:true,add:addressToDelete})
    }
} catch (error) {
    next(error)
}
}

// to add address from cart
const addAddressFromCart=async(req,res,next)=>{
    try {
        const customerId=req.session.customer_id
        const haveAddress= await Address.findOne({customerId:customerId})
        if(haveAddress){
            haveAddress.address.push({name:req.body.name,
                mobile:req.body.mobile,
                pincode:req.body.pincode,
                house:req.body.house,
                street:req.body.street,
                city:req.body.city,
                state:req.body.state})
            const addressData= await haveAddress.save()
        if(addressData){
            res.redirect('/checkout')
        }
        }else{
        const address=new Address({
            customerId:req.session.customer_id,
            address:[]
        })
        address.address.push({name:req.body.name,
            mobile:req.body.mobile,
            pincode:req.body.pincode,
            house:req.body.house,
            street:req.body.street,
            city:req.body.city,
            state:req.body.state})
        const addressData= await address.save()
    if(addressData){
        res.redirect('/checkout')
    }
    }
    } catch (error) {
        next(error)
    }
}


module.exports={
    loadManageAddress,
    addAddress,
    loadExistingAddress,
    loadEditAddress,
    editAddress,
    removeAddress,addAddressFromCart
}