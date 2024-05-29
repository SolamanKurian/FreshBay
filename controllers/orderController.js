const Customer= require('../models/customerModel')
const Product =require("../models/prodectmodel");
const Caregory=require("../models/categoryModel")
const mongoose = require('mongoose');
const Cart=require("../models/cartModel")
const Address=require("../models/addressModel")
const Order=require("../models/orderModel")
const Poffer=require("../models/productofferModel")
const Coffer=require("../models/categoryofferModel")
const Wallet=require("../models/walletModel")
const Razorpay=require("razorpay")
const RAZORPAY_ID_KEY=process.env.RAZORPAY_ID_KEY;
const RAZORPAY_SECRET_KEY=process.env.RAZORPAY_SECRET_KEY;
const razorpayInstance=new Razorpay({
  key_id:RAZORPAY_ID_KEY,
  key_secret:RAZORPAY_SECRET_KEY
})
const { ObjectId } = require('mongodb');



//to make order
const createOrder=async(req,res,next)=>{
    try {
      
      delete req.session.discount;
        const customer = req.session.customer_id;
        const cart = await Cart.findOne({ customerId: customer }).populate("items.productId")
        .populate({
          path: "items.productId",
          populate: {
            path: "Category",
            model: "Category",
          }})

          const addressId= new ObjectId(req.body.addressId)
          const addressArray = await Address.aggregate([
            { $unwind: "$address" },
            { $match: { "address._id": addressId } },
          ]);
          const deliveryAddress=addressArray[0].address

          const orderData=  new Order({
            orderId:Math.floor(100000 + Math.random() * 900000),
            userId:req.session.customer_id,
            paymentMethod: req.body.paymentMethod,
            orderPrice:req.body.amount,
            discount:req.body.disc,
            address: {
                name:deliveryAddress.name,
                mobile:deliveryAddress.mobile,
                pincode:deliveryAddress.pincode,
                house:deliveryAddress.house,
                locality:deliveryAddress.locality,
                city:deliveryAddress.city,
                state:deliveryAddress.state,
                
              },
              items:[]

          })
        
          for (const item of cart.items) {
            let pofferprice;
            let cofferprice;
            const poffer=await Poffer.findOne({productId:item.productId._id})
            if(poffer){
          
              let percentage=poffer.percentage;
              let offer=(item.productId.Price*percentage)/100;
               pofferprice=item.productId.Price-offer;
            }else{
              pofferprice=item.productId.Price
            };
            let category=String(item.productId.Category.Name)
            
          
            const coffer=await Coffer.find().populate('categoryId')
            const specificName = category;
const foundItem = coffer.find(item => item.categoryId.Name === specificName);

if (foundItem) {

  let percentage=foundItem.percentage;
  let offer=(item.productId.Price*percentage)/100;
   cofferprice=item.productId.Price-offer;
} else {
  cofferprice=item.productId.Price
}

            
            let offerprice=pofferprice>cofferprice?cofferprice:pofferprice;
          
            orderData.items.push({
              productId: item.productId._id,
              productName: item.productId.Name,
              categoryName: item.productId.Category.Name,
              image: item.productId.Image[0],
              quantity: item.quantity,
              price: item.productId.Price>offerprice?offerprice:item.productId.Price,
              offerDiscount:item.productId.Price-(item.productId.Price>offerprice?offerprice:item.productId.Price)

            })
            
        
            await Product.findByIdAndUpdate(
                { _id: item.productId._id },
                { $inc: { Quantity: -item.quantity } }
              )};
              if(req.body.paymentMethod=='COD' && req.body.addressId){
              req.session.orderData=orderData;
              const order= new Order(req.session.orderData)
              delete req.session.orderData;
              
              await Cart.deleteOne({customerId:req.session.customer_id})
              if(order){
                order.paymentStatus='Pending';
                 const updated=await order.save()
                 if(updated){
                  const addressList=await Address.findOne({customerId: req.session.customer_id})
              const orderedAddress = await addressList.address.find(item => item._id.toString() === req.body.addressId);
              
              res.json({neworder:orderedAddress,order:orderData });
                 }   
               }


              
              

            }else if(req.body.paymentMethod=='ONLINE' && req.body.addressId){
              req.session.orderData=orderData;
              req.session.order_id=orderData._id
            
              const addressList=await Address.findOne({customerId: req.session.customer_id})
              const orderedAddress = await addressList.address.find(item => item._id.toString() === req.body.addressId);
              const amount=req.body.amount*100
              const options={
                amount:amount,
                currency:'INR',
                receipt:'solamankurian.mec@gmail.com'
              }
              razorpayInstance.orders.create(options,(order)=>{
              
                  
               return res.json({
                    success:true,
                    msg:'Order Created',
                    order_id:order.id,
                    amount:amount,
                    key_id:RAZORPAY_ID_KEY,

                    neworder:orderedAddress,
                    order:orderData 

                  })
                

              })




              
            } else if(req.body.paymentMethod=='WALLET' && req.body.addressId){
              req.session.orderData=orderData;

              //to update the wallet
              let amount=req.body.amount;
              const customerId=req.session.customer_id
              const haveWallet= await Wallet.findOne({customerId:customerId})
              if(haveWallet){
                  let balance=haveWallet.balance;
                  let newbalance=balance-amount;
                  haveWallet.balance=newbalance;
                  haveWallet.history.push({
              type: 'Debit',
              amount: amount,
              balance: newbalance,
              about:'order Purchased' 
                  })
                  await haveWallet.save()
                }
                orderData.paymentStatus='Completed';
              req.session.orderData=orderData;
  
              const addressList=await Address.findOne({customerId: req.session.customer_id})
              const orderedAddress = await addressList.address.find(item => item._id.toString() === req.body.addressId);        
              res.json({neworder:orderedAddress,order:orderData});
            }
            else{
               res.json({success:false})
            }    
    } catch (error) {
        next(error)
    }
}
//to load orderplaced page
const loadOrderPlaced=async(req,res,next)=>{
  try {  
    let address=req.query;
    let orderId=req.query.orderId;
    const customer=await Customer.findOne({_id:req.session.customer_id});
    if(req.session.orderData){
    const order= new Order(req.session.orderData)
    delete req.session.orderData;
    await Cart.deleteOne({customerId:req.session.customer_id})
    if(order){
     order.paymentStatus='Completed';
      const updated=await order.save()
      if(updated){
       
       return res.render('orderPlaced',{customer:customer,neworder:address,order:order})
      }   
    }
    res.render('orderPlaced',{customer:customer,neworder:address,order:order})  

  }else{
    const order=await Order.findOne({_id:orderId})
    res.render('orderPlaced',{customer:customer,neworder:address,order:order})  
  }



  } catch (error) {
    next(error)
  }
}
//to load order page
const loadMyOrder=async(req,res,next)=>{
  try {

    const customer=await Customer.findOne({_id:req.session.customer_id})
    if(req.session.orderData){
      
      
      const order= new Order(req.session.orderData)
      if(order){
        order.paymentStatus='Pending';
      await order.save()
      }
      delete req.session.orderData;
      await Cart.deleteOne({customerId:req.session.customer_id})
    }

    res.render('orderPage',{customer:customer})
    
  } catch (error) {
    next(error)
  }
}

// to inser orders to page
const insertMyOrder=async(req,res,next)=>{
  try {

    const customer=req.session.customer_id
    const order=await Order.find({userId:customer}).sort({ date: -1 });
    
    if(order){
      
        res.json({order:order})
    }else{
        res.json(null)
    }
    
  } catch (error) {
    next(error)
  }
}


// to cancel the order

const cancelOrder=async(req,res,next)=>{
  
  try {
    const customer = req.session.customer_id;
    const order = await Order.findOne({ userId: customer, _id: req.query.Oid });
  
   
    if(order){
     
      const updated=await Order.updateOne({ userId: customer, _id: req.query.Oid }, { $set: { status: "Cancelled" } });
      if(updated){
         for(item of order.items) {item.itemStatus="Cancelled"}
        await order.save()
        // to update wallet if cancell the order
        const orderUpdated = await Order.findOne({ userId: customer, _id: req.query.Oid });
        if(orderUpdated.status=='Cancelled'&& order.paymentStatus=='Completed'){
          const customerId=req.session.customer_id;
          let amount=orderUpdated.orderPrice;
          const haveWallet= await Wallet.findOne({customerId:customerId})
          if(haveWallet){
              let balance=haveWallet.balance;
              let newbalance=balance+amount;
              haveWallet.balance=newbalance;
              haveWallet.history.push({
          type: 'Credit',
          amount: amount,
          balance: newbalance,
          about:'Order Cancelled'
              })
           const walletUpdated= await haveWallet.save()
           if(walletUpdated){
            const ordertochange= await Order.findOne({ userId: customer, _id: req.query.Oid });
            ordertochange.paymentStatus="Refunded";
            ordertochange.save();
           }
          }

      }




        const updatedorder = await Order.findOne({ userId: customer, _id: req.query.Oid });
        res.json({success:true,order:updatedorder})
      }
      
    }
   
    
  } catch (error) {
    next(error)
  }
}

// to view order
const loadViewOrder=async(req,res,next)=>{
  try {

    const customer=req.session.customer_id

    const order = await Order.findOne({ userId: customer, _id: req.query.viewOid });

    res.render('viewOrderPage',{customer:customer,viewOrder:order})
    
  } catch (error) {
    next(error)
  }
}

//to insert view order

const insertViewOrder=async(req,res,next)=>{
  try {
    const viewOrder = await Order.findOne({_id: req.query.Oid });
    if(viewOrder){
      res.json({viewOrder:viewOrder})
    }
  } catch (error) {
    next(error)
  }
}

// to cancel item from order

const cancelItem=async(req,res,next)=>{
  try {
    const customer = req.session.customer_id;
    const order = await Order.findOne({ userId: customer, _id: req.query.orderId });
    const itemToCancel = await order.items.find(item => item._id.toString() === req.query.itemId);
    if(itemToCancel){
      itemToCancel.itemStatus='Cancelled'
      const updated=await order.save()

        //updating the wallet if cancelled if payment was done
        if(updated && order.paymentStatus=='Completed'){
          const order = await Order.findOne({_id: req.query.orderId });
          const itemDelivered = await order.items.find(item => item._id.toString() === req.query.itemId);
          if(itemDelivered.itemStatus=='Cancelled'){
              const customerId=req.session.customer_id;
              let amount=itemDelivered.price*itemDelivered.quantity;
              const haveWallet= await Wallet.findOne({customerId:customerId})
              if(haveWallet){
                  let balance=haveWallet.balance;
                  let newbalance=balance+amount;
                  haveWallet.balance=newbalance;
                  haveWallet.history.push({
              type: 'Credit',
              amount: amount,
              balance: newbalance,
              about:'Order Cancelled'
                  })
                await haveWallet.save()
              }
          }
        }
      let flag=0
      for(item of order.items){
        if(item.itemStatus=='Cancelled'){
          flag=1
        }else{
          flag=0
        }
      }
      if(flag==1){
        order.status='Cancelled'
        order.save()
      }

      const itemUpdated = await order.items.find(item => item._id.toString() === req.query.itemId);
    res.json({success:true,item:itemUpdated })
  
    }
 }

catch (error) {
    next(error)
  }
}

// to retun item

const returnItem=async(req,res,next)=>{
  try {
    const Reason = req.query;
    const customer = req.session.customer_id;
    const order = await Order.findOne({ userId: customer, _id: Reason.orderId });
    const itemToCancel = await order.items.find(item => item._id.toString() === Reason.itemId);
    if(itemToCancel){
      itemToCancel.itemStatus='Return requested'
      itemToCancel.reason=Reason.Reason
      await order.save()
      let flag=0
      for(item of order.items){
        if(item.itemStatus=='Return requested'){
          flag=1
        }else{
          flag=0
        }
      }
      if(flag==1){
        order.status='Return requested'
        order.save()
      }

      const itemUpdated = await order.items.find(item => item._id.toString() === Reason.itemId);
    res.json({success:true,item:itemUpdated })
  
    }

  } catch (error) {
    next(error)
  }
}

// paynow

const payNow=async(req,res,next)=>{
 
  try {
    const order= await Order.findOne({_id:req.query.oid})
    if(order){
    const amount=order.orderPrice*100;
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
                 oid:req.query.oid

               })

           })}else{
            res.json({success:false})
           }

  } catch (error) {
    next(error)
  }
}

// to update now paid

const nowPaid=async(req,res,next)=>{
  try {
    const order = await Order.findOne({ _id:req.query.oid });
    if(order){
      order.paymentStatus="Completed";
      order.status="Ordered"
      await order.save();
    }
    res.redirect('/order/myOrders')
    
  } catch (error) {
    next(error)
  }
}


module.exports={
 createOrder,
 loadMyOrder,
 insertMyOrder,
 cancelOrder,
 loadViewOrder,
 insertViewOrder,
 cancelItem,
 returnItem,
 loadOrderPlaced,
 payNow,
 nowPaid
}