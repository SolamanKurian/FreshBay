
const Admin= require('../models/adminModel')
const Customer= require('../models/customerModel')
const Category=require('../models/categoryModel')
const Order=require('../models/orderModel')
const Wallet=require("../models/walletModel")
const Poffer=require("../models/productofferModel")
const Coffer=require("../models/categoryofferModel")
const Product=require("../models/prodectmodel")
const Coupon=require("../models/couponModel")
const bcrypt=require("bcrypt")
const mongoose = require('mongoose');
const axios=require("axios")
const Swal=require("sweetalert2")

// to load admin login page
const loadLogin=async(req,res)=>{

try {
    res.render('login')
} catch (error) {
    res.redirect('/admin/error')
}

}

//to verify admin
const verifyAdmin=async(req,res)=>{
    try {
        const email=req.body.email
        const adminData= await Admin.findOne({Email:email})
        if(adminData){
           
            const passMatch= await bcrypt.compare(req.body.password,adminData.Password)
            if(passMatch){
                
                req.session.admin_id=adminData._id;
                res.redirect('/admin/adminHome')
                
            }else{
                res.render('login',{message:"Password incorrect"})
            }
        }    else{
            
            res.render('login',{message:"Password incorrect"})
        }
    } catch (error) {
        res.redirect('/admin/error')
    }
    }
// const load adminhome
const loadHome=async(req,res)=>{

try {
    const orders=await Order.find()
    if(orders){
        let count=0;
        let revenue=0;
        let discount=0;
        for(let i=0;i<orders.length;i++){
            if(orders[i].paymentStatus=='Completed'){
                count=count+1;
                revenue=revenue+orders[i].orderPrice;
                discount=discount+orders[i].discount;
            }
        }
    
        res.render('Home',{count:count,revenue:revenue,discount:discount})
    }else{
        res.render('Home')
    }
} catch (error) {
    res.redirect('/admin/error')
}
}

//to provide top
const takeTop=async(req,res,next)=>{
    try {
        let topProducts = await Order.aggregate([
            { $match: { paymentStatus: "Completed" } },
            { $unwind: "$items" },
            { $group: { 
                _id: "$items.productName",
                totalQuantity: { $sum: "$items.quantity" },
                image: { $first: "$items.image" }
            }},
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            { $project: { 
                productName: "$_id",
                totalQuantity: 1,
                image: 1 
            }}
        ]);
        
        let topCategory= await Order.aggregate([{ $match: { paymentStatus: "Completed" } },{$unwind:"$items"},{$group:{_id:"$items.categoryName",totalQuantity:{$sum:"$items.quantity"},
        }},{$sort:{totalQuantity:-1}},{$limit:5},{$project:{categorytName:"$_id",totalQuantity:1,image:1}}]);
    
        res.json({topP:topProducts,topC:topCategory})

        
    } catch (error) {
        next(error)
    }
}

// to load error page
const loadError=async(req,res)=>{
    try {
        res.render('error')
    } catch (error) {
        res.redirect('/admin/error')
    }
}


// to load users page
const loadUserspage=async(req,res)=>{
try {
    res.render('users')
} catch (error) {
    res.redirect('/admin/error')
}
    
}

// load user with search

const loadUsers= async(req,res)=>{


    try {
        let page ;
        if(req.query.cp){
            page=req.query.cp;
           }else{
            page=1;
           }
        let search="";
        if(req.query.q){
            
            search=req.query.q;
            const userData= await Customer.find({$or:[{Name:{$regex:".*"+search+".*",$options:"i"}},{paymentMethod:{$regex:".*"+search+".*",$options:"i"}},
            {Email:{$regex:".*"+search+".*",$options:"i"}}]})
            let finaluserData=userData.slice((page - 1) * 5, page * 5);
            res.json({users:finaluserData})
        }else{
            const userData=await Customer.find({})
            let finaluserData=userData.slice((page - 1) * 5, page * 5);
            res.json({users:finaluserData})
        }
       
    
    } catch (error) {
        res.redirect('/admin/error')
    }

}

//admin logout
const adminLogout=async(req,res)=>{
try {
    delete req.session.admin_id;
    res.redirect('/admin')
} catch (error) {
    res.redirect('/admin/error')
}
}
//block user
const blockUser=async(req,res)=>{
    
try {
    const userId=req.body.userid
    const userData=await Customer.findOne({_id:userId})
   
    if(userData.Is_blocked){

     await Customer.updateOne({_id:userId},{$set:{Is_blocked:0}})
      res.json({success:true,message:"Unlocked"})
    }
    else{
     await Customer.updateOne({_id:userId},{$set:{Is_blocked:1}})
   
      res.json({success:true,message:"Blocked"})
    }

} catch (error) {
    res.redirect('/admin/error')
}
}

//to load order page

const loadOrderPage=async(req,res,next)=>{
    try {
        res.render('orders')
        
    } catch (error) {
        next(error)
    }
}
// to load orders to order page

const loadOrders=async(req,res,next)=>{
    try {
        let page ;
         
        if(req.query.cp){
            page=req.query.cp;
           }else{
            page=1;
           }
        let search="";
        if(req.query.q){
            search=req.query.q;
            const orderData= await Order.find({$or:[{status:{$regex:".*"+search+".*",$options:"i"}},{paymentMethod:{$regex:".*"+search+".*",$options:"i"}},
            {paymentStatus:{$regex:".*"+search+".*",$options:"i"}},
            {orderId:{$regex:".*"+search+".*",$options:"i"}}]}).populate('userId').sort({ date: -1 });
            let finalorderData=orderData.slice((page - 1) * 10, page * 10);
             res.json({orders:finalorderData})
        }else{
            const orderData=await Order.find().populate('userId').sort({ date: -1 });
            let finalorderData=orderData.slice((page - 1) * 10, page * 10);
            res.json({orders:finalorderData})
        }


    } catch (error) {
        next(error)
    }
}
//to load vieworder page

const loadViewOrder=async(req,res,next)=>{
    try {

        const order = await Order.findOne({ _id: req.query.viewOid });

        res.render('viewOrder',{viewOrder:order})


        
    } catch (error) {
        next(error)
    }
}

// to insert products to view order in detail

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
// to mark as delivered

const markAsDelivered=async(req,res,next)=>{
    try {
       
        const order = await Order.findOne({_id: req.query.orderId });
        const itemDelivered = await order.items.find(item => item._id.toString() === req.query.itemId);
        if(itemDelivered){
            itemDelivered.itemStatus='Delivered'
          await order.save()
          let flag=0
          for(item of order.items){
            if(item.itemStatus=='Delivered'){
              flag=1
            }else{
              flag=0
            }
          }
          if(flag==1){
            order.status='Delivered'
            order.paymentStatus='Completed'
            order.save()
          }
    
          const itemUpdated = await order.items.find(item => item._id.toString() === req.query.itemId);
        res.json({success:true,item:itemUpdated })
        }

    } catch (error) {
        next(error)
    }
}
const markAsCancelled=async(req,res,next)=>{
    // try {
    //     const order = await Order.findOne({ _id: req.query.orderId});
    //     if(order){
    //     //   const updated=await Order.updateOne({ _id: req.query.orderId }, { $set: { status: "Cancelled" } });
    //         // if(updated){
    //          for(item of order.items) {item.itemStatus="Cancelled"}
    //         await order.save()
    //         // to update wallet if cancell the order
    //         const orderUpdated = await Order.findOne({ _id: req.query.orderId });
    //         if(orderUpdated.status=='Cancelled'&& order.paymentStatus=='Completed'){
    //           const customerId=order.userId;
    //           let amount=orderUpdated.orderPrice;
    //           const haveWallet= await Wallet.findOne({customerId:customerId})
    //           if(haveWallet){
    //               let balance=haveWallet.balance;
    //               let newbalance=balance+amount;
    //               haveWallet.balance=newbalance;
    //               haveWallet.history.push({
    //           type: 'Credit',
    //           amount: amount,
    //           balance: newbalance,
    //           about:'Order Cancelled'
    //               })
    //            const walletUpdated= await haveWallet.save()
    //            if(walletUpdated){
    //             const ordertochange= await Order.findOne({ _id: req.query.orderId});
    //             ordertochange.paymentStatus="Refunded";
    //             ordertochange.save();
    //            }
    //           }
    //     //   }
    //         const updatedorder = await Order.findOne({  _id: req.query.orderId});  
    //         res.json({success:true,order:updatedorder})
    //       }    
    //     }
    // } catch (error) {
    //     next(error)
    // }
    try {
        

        const order = await Order.findOne({_id: req.query.orderId });
        const itemOrdered = await order.items.find(item => item._id.toString() === req.query.itemId);
        if(itemOrdered){
            itemOrdered.itemStatus='Cancelled'
          let updated=await order.save()
          //updating the wallet if return received
          if(updated){
            const order = await Order.findOne({_id: req.query.orderId });
            const itemOrdered = await order.items.find(item => item._id.toString() === req.query.itemId);
            if(itemOrdered.itemStatus=='Cancelled'){
                const customerId=order.userId;
                let amount=itemOrdered.price*itemOrdered.quantity;
                const haveWallet= await Wallet.findOne({customerId:customerId})
                if(haveWallet){
                    let balance=haveWallet.balance;
                    let newbalance=balance+amount;
                    haveWallet.balance=newbalance;
                    haveWallet.history.push({
                type: 'Credit',
                amount: amount,
                balance: newbalance,
                about:'Returned a product'
                
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
    
          const updatedorder = await Order.findOne({  _id: req.query.orderId});  
                  res.json({success:true,order:updatedorder,item:req.query.itemId})
        }



    } catch (error) {
        next(error)
    }





}

// to mark as shipped

const markAsShipped=async(req,res,next)=>{
    try {
        
        const order = await Order.findOne({_id: req.query.orderId });
        const itemDelivered = await order.items.find(item => item._id.toString() === req.query.itemId);
        if(itemDelivered){
            itemDelivered.itemStatus='Shipped'
          await order.save()
          let flag=0
          for(item of order.items){
            if(item.itemStatus=='Shipped'){
              flag=1
            }else{
              flag=0
            }
          }
          if(flag==1){
            order.status='Shipped'
            order.save()
          }
    
          const itemUpdated = await order.items.find(item => item._id.toString() === req.query.itemId);
        res.json({success:true,item:itemUpdated })
        }
        
    } catch (error) {
        next(error)
    }
}

// to mark as approved return

const markAsReturnApproved=async(req,res,next)=>{
    try {

        const order = await Order.findOne({_id: req.query.orderId });
        const itemDelivered = await order.items.find(item => item._id.toString() === req.query.itemId);
        if(itemDelivered){
            itemDelivered.itemStatus='Return approved'
          await order.save()
          let flag=0
          for(item of order.items){
            if(item.itemStatus=='Return approved'){
              flag=1
            }else{
              flag=0
            }
          }
          if(flag==1){
            order.status='Return approved'
            order.save()
          }
    
          const itemUpdated = await order.items.find(item => item._id.toString() === req.query.itemId);
        res.json({success:true,item:itemUpdated })
        }
        
    } catch (error) {
        next(error)
    }
}
// to mark as return rejected

const markAsReturnRejected=async(req,res,next)=>{
    try {
        const order = await Order.findOne({_id: req.query.orderId });
        const itemDelivered = await order.items.find(item => item._id.toString() === req.query.itemId);
        if(itemDelivered){
            itemDelivered.itemStatus='Return rejected'
          await order.save()
          let flag=0
          for(item of order.items){
            if(item.itemStatus=='Return rejected'){
              flag=1
            }else{
              flag=0
            }
          }
          if(flag==1){
            order.status='Return rejected'
            order.save()
          }
    
          const itemUpdated = await order.items.find(item => item._id.toString() === req.query.itemId);
        res.json({success:true,item:itemUpdated })
        }


    } catch (error) {
        next(error)
    }
}

// to mark as return received

const markAsReturnReceived=async(req,res,next)=>{
    try {
        

        const order = await Order.findOne({_id: req.query.orderId });
        const itemDelivered = await order.items.find(item => item._id.toString() === req.query.itemId);
        if(itemDelivered){
            itemDelivered.itemStatus='Return received'
          let updated=await order.save()
          //updating the wallet if return received
          if(updated){
            const order = await Order.findOne({_id: req.query.orderId });
            const itemDelivered = await order.items.find(item => item._id.toString() === req.query.itemId);
            if(itemDelivered.itemStatus=='Return received'){


                const customerId=order.userId;
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
                about:'Returned a product'
                
                    })
                  await haveWallet.save()
                }
            }
          }





          let flag=0
          for(item of order.items){
            if(item.itemStatus=='Return received'){
              flag=1
            }else{
              flag=0
            }
          }
          if(flag==1){
            order.status='Return received'
            order.save()
          }
    
          const itemUpdated = await order.items.find(item => item._id.toString() === req.query.itemId);
        res.json({success:true,item:itemUpdated })
        }



    } catch (error) {
        next(error)
    }
}
// to load product offers page

const loadProductOffers=async(req,res,next)=>{
    try {
        const poffers=await Poffer.find().populate('productId')
        res.render('productoffer',{poffers:poffers})
        
    } catch (error) {
        next(error)
    }
}

// to load add product offers page

const loadAddProductOffers=async(req,res,next)=>{
    try {
        const product= await Product.find()

        res.render('addProductoffer',{product:product})
        
    } catch (error) {
        next(error)
    }
}

// to add product offer


 

  const addProductOffers=async(req,res)=>{
    try {
        const already=await Poffer.findOne({productId:req.body.name})
        if(already){
           return res.render('addProductoffer',{message:'The product have an offer aldeady '})
        }
            const poffer= new Poffer({       
                productId: req.body.name,
                percentage:req.body.percentage,
                date:req.body.tillDate
                })
        const pofferData=await poffer.save()
    if(pofferData){
        const offerok= await checkAndApplayOffer(req.body.name,null);
        if(offerok=='ok'){
            res.redirect('/admin/productOffers')
        }
    }
    } catch (error) {
        console.log(error.message);
    }
        }


    // to delete poffer
   
    const deleteProductOffers=async(req,res)=>{
        
        try {
            const pofferId=req.body.pofferid
            const pofferData=await Poffer.findOne({_id:pofferId})
            if(pofferData){
               const product=await Product.findOne({_id:pofferData.productId._id})
               if(product){
                
                    if (product.Offerprice !== undefined) { 
                        await Product.findOneAndUpdate(
                            { _id: pofferData.productId._id },
                            { $unset: { Offerprice: 1 } },
                            { new: true }
                        );
                    } 
               
            await Poffer.findOneAndDelete({ _id: pofferId });
              res.json({success:true})
            }
            else{
              res.json({success:false})
            }
        } 
        } catch (error) {
            console.log(error.message);
        }
        }


//to load edit poffer
const loadEditpoffer=async(req,res)=>{
        
    try {
        const pofferData=await Poffer.findOne({_id:req.query.pofferid}).populate('productId')
    if(pofferData){
       
        const product=await Product.find()
        
        res.render('editProductOffer',{poffer:pofferData,product:product})
    }    
    } catch (error) {
        console.log(error.message);
    }
}





        //to edit poffer

        const editpoffer=async(req,res)=>{
            try {
                const pId=req.body.pid;
                const poffer = await Poffer.findOne({ _id: pId })
                if(poffer){
                    poffer.productId= req.body.name,
                    poffer.percentage=req.body.percentage,
                    poffer.date=req.body.tillDate
                const updated=await poffer.save()    
                if(updated){
                    const offerok= await checkAndApplayOffer(poffer.productId,null);
                    if(offerok=='ok'){
                        res.redirect('/admin/productOffers')
                    }
                }
                   
                }
            } catch (error) {
                console.log(error.message);
            }
            
            }

    // to load category offers page

const loadCategoryOffers=async(req,res,next)=>{
    try {
        const coffers=await Coffer.find().populate('categoryId')
        res.render('categoryOffers',{coffers:coffers})
        
    } catch (error) {
        next(error)
    }
}
// to load category offer add page
   
const loadAddCategoryOffers =async(req,res,next)=>{
    try {
        const category= await Category.find()

        res.render('addCategoryOffer',{category:category})
        
    } catch (error) {
        next(error)
    }
}

// to add category offer


const addCategoryOffers=async(req,res)=>{
    try {
        const already=await Poffer.findOne({productId:req.body.name})
        if(already){
           return res.render('addCategoryOffer',{message:'Category name already exists'})
        }
            const coffer= new Coffer({
                
                categoryId: req.body.name,
                percentage:req.body.percentage,
                date:req.body.tillDate
 
                })
        const cofferData=await coffer.save()
    
    
        if(cofferData){
            const offerok= await checkAndApplayOffer(null,req.body.name);
            if(offerok=='ok'){
               
    res.redirect('/admin/categoryOffers')
            }
        }


    
    } catch (error) {
        console.log(error.message);
    }
        }

    // to delete category offer
    const deleteCategoryOffers=async(req,res)=>{
        
        try {
            const cofferId=req.body.cofferid
            const cofferData=await Coffer.findOne({_id:cofferId})
           
            if(cofferData){

                await Product.updateMany(
                    { Category:cofferData.categoryId, Offerprice: { $exists: true } },
                    { $unset: { Offerprice: 1 } }
                );
                
               
            await Coffer.findOneAndDelete({ _id: cofferId });

              res.json({success:true})
            }
            else{
              res.json({success:false})
             
            }
        
        } catch (error) {
            console.log(error.message);
        }
        }
//to load edit category offer 
const loadEditcoffer=async(req,res)=>{
        
    try {
        const cofferData=await Coffer.findOne({_id:req.query.cofferid}).populate('categoryId')
    if(cofferData){
       
        const category=await Category.find()
        res.render('editCategoryOffer',{coffer:cofferData,category:category})
    }    
    } catch (error) {
        console.log(error.message);
    }
}




// to edit category offer

        
        const editcoffer=async(req,res)=>{
            try {
                const cId=req.body.cid;
                const coffer = await Coffer.findOne({ _id: cId })
                if(coffer){
                    coffer.categoryId= req.body.name,
                    coffer.percentage=req.body.percentage,
                    coffer.date=req.body.tillDate
                const updated=await coffer.save()    
                if(updated){
                    const offerok= await checkAndApplayOffer(null,coffer.categoryId);
                    if(offerok=='ok'){
            res.redirect('/admin/categoryOffers')
                    }
                }       
                }
            } catch (error) {
                console.log(error.message);
            }
            }


// function to check the offers and make change in price

async function checkAndApplayOffer(productId,categoryId){
try {
    
const newpoffer= await Poffer.findOne({productId:productId})?await Poffer.findOne({productId:productId}):0;
const newcoffer= await Coffer.findOne({categoryId:categoryId})?await Coffer.findOne({categoryId:categoryId}):0;
const a=newcoffer.percentage?newcoffer.percentage:0;
    const b=newpoffer.percentage?newpoffer.percentage:0;
   
if(b>=a){
const product= await Product.findOne({_id:productId})
if(product){
    let price=product.Price;
    let offerpercentage=newpoffer.percentage;
    let offer=(offerpercentage*price)/100;
    let offerprice=price-offer;
   let updated= await Product.findOneAndUpdate(
        { _id: productId }, 
        { $set: { Offerprice: offerprice } } 
    );
    return "ok";
}else{
    return "not ok";
}
}else if(b<a){
   
    const products= await Product.find({Category:categoryId})
    if(products){
        for(let i=0;i<products.length;i++){
            let price=products[i].Price;
            let offerpercentage=newcoffer.percentage;
            let offer=(offerpercentage*price)/100;
            let offerprice=price-offer;
                await Product.findOneAndUpdate(
                    { _id: products[i]._id }, 
                    { $set: { Offerprice: offerprice } }      
                )
        }
        return "ok"
    }else{
        return "not ok"
    }
}
} catch (error) {
    console.log(error);
}
}
// to load coupon page

const loadCoupons=async(req,res,next)=>{
    try {
        const coupons=await Coupon.find()
        res.render('coupons',{coupons:coupons})
        
    } catch (error) {
        next(error)
    }
}

// to load add coupon page
const loadAddCoupon =async(req,res,next)=>{
    try {
       

        res.render('addCoupon')
        
    } catch (error) {
        next(error)
    }
}

  // to add coupon to db

  const addCoupon=async(req,res)=>{
    try {
        const already=await Coupon.findOne({couponcode:req.body.code})
        if(already){
           return res.render('addCoupon',{message:'The coupon code already exists'})
        }
            const coupon= new Coupon({       
                couponcode: req.body.code,
                percentage:req.body.percentage,
                maxlimit:req.body.maxlimit,
                minlimit:req.body.minlimit,
                date:req.body.tillDate
                })
        const couponData=await coupon.save()
    if(couponData){
            res.redirect('/admin/coupons')
    }
    } catch (error) {
        console.log(error.message);
    }
        }

// to delete coupon
const deleteCoupon=async(req,res)=>{
        
    try {
        const couponId=req.body.couponId
        const couponData=await Coupon.findOne({_id:couponId})
        if(couponData){

        await Coupon.findOneAndDelete({ _id:couponId });
          res.json({success:true})
        }
        else{
          res.json({success:false})
        }
    
    } catch (error) {
        console.log(error.message);
    }
    }

//to load edit coupon
const loadEditCoupon=async(req,res)=>{
        
    try {
        const couponData=await Coupon.findOne({_id:req.query.couponId})
    if(couponData){
  
        res.render('editCoupon',{coupon:couponData})
    }    
    } catch (error) {
        console.log(error.message);
    }
}

// to edit coupon
const editCoupon=async(req,res)=>{
    try {
        const couponId=req.body.cid;
        const coupon = await Coupon.findOne({ _id: couponId })
        if(coupon){

            coupon.couponcode= req.body.code,
                coupon.percentage=req.body.percentage,
                coupon.maxlimit=req.body.maxlimit,
                coupon.minlimit=req.body.minlimit,
                coupon.date=req.body.tillDate

        const updated=await coupon.save()    
        if(updated){
                res.redirect('/admin/coupons')
        }
        }
    } catch (error) {
        console.log(error.message);
    }
    
    }

//to load report page
const loadReport=async(req,res,next)=>{
    try {
        res.render('report')
        
    } catch (error) {
        next(error)
    }
}

// to insert report details

const reportTopage=async(req,res,next)=>{
    try {
        
        const now = new Date();
        
        const lastDayStart = new Date(now);
        lastDayStart.setDate(now.getDate() - 1);

        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - 7);

        const lastMonthStart = new Date(now);
        lastMonthStart.setMonth(now.getMonth() - 1);

        const lastYearStart = new Date(now);
        lastYearStart.setFullYear(now.getFullYear() - 1);
        
        let search="";
        if(req.query.q && !(req.query.from && req.query.to)){
            
            search=req.query.q;
            
            const orderData= await Order.find({$or:[{status:{$regex:".*"+search+".*",$options:"i"}},{paymentMethod:{$regex:".*"+search+".*",$options:"i"}},
            {paymentStatus:{$regex:".*"+search+".*",$options:"i"}},
            {orderId:{$regex:".*"+search+".*",$options:"i"}}]}).populate('userId').sort({ date: -1 });
            if(req.query.filter==='thisWeek'){
                filteredOrders = orderData.filter(order => new Date(order.date) >= lastWeekStart);
                res.json({orders:filteredOrders})
            }else if(req.query.filter==='thisMonth'){
                filteredOrders = orderData.filter(order => new Date(order.date) >= lastMonthStart);
                res.json({orders:filteredOrders})
            }else if(req.query.filter==='thisDay'){
                filteredOrders = orderData.filter(order => new Date(order.date) >= lastDayStart);
                res.json({orders:filteredOrders})
            }else if(req.query.filter==='thisYear'){
                filteredOrders = orderData.filter(order => new Date(order.date) >= lastYearStart);
                res.json({orders:filteredOrders})
            }
            else{
                res.json({orders:orderData})
            }
            
             
        }else if(req.query.from && req.query.to){
            const fromDate = new Date(req.query.from);
            let toDate = new Date(req.query.to);
            toDate.setHours(23, 59, 59, 999);
           
            const orderData = await Order.find({ date: { $gte: fromDate, $lte: toDate } }).populate('userId').sort({ date: -1 });

            res.json({orders:orderData})
            
             
        }else{
            const orderData=await Order.find().populate('userId').sort({ date: -1 });

            if(req.query.filter==='thisWeek'){
                filteredOrders = orderData.filter(order => new Date(order.date) >= lastWeekStart);
                res.json({orders:filteredOrders})
            }else if(req.query.filter==='thisMonth'){
                filteredOrders = orderData.filter(order => new Date(order.date) >= lastMonthStart);
                res.json({orders:filteredOrders})
            }else if(req.query.filter==='thisDay'){
                filteredOrders = orderData.filter(order => new Date(order.date) >= lastDayStart);
                res.json({orders:filteredOrders})
            }else if(req.query.filter==='thisYear'){
                filteredOrders = orderData.filter(order => new Date(order.date) >= lastYearStart);
                res.json({orders:filteredOrders})
            }
            else{
                res.json({orders:orderData})
            }
            
            
        }


    } catch (error) {
        next(error)
    }
}
//to feed the growth rate
const growthSearch=async(req,res,next)=>{
    
    try {
        if(req.query.filter=="monthly"){
            const currentDate = new Date();
const lastYearStart = new Date(currentDate);
lastYearStart.setMonth(lastYearStart.getMonth() - 11);

let monthlyRevenue = await Order.aggregate([
    { 
        $match: { 
            paymentStatus: "Completed",
            date: { 
                $gte: lastYearStart,
                $lte: currentDate 
            }
        }
    },
    { 
        $group: {
            _id: { 
                year: { $year: "$date" },
                month: { $month: "$date" }
            },
            totalRevenue: { $sum: "$orderPrice" }
        }
    },
    { 
        $sort: { "_id.year": 1, "_id.month": 1 }
    },
    { 
        $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            totalRevenue: 1
        }
    }
]);

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const lastTwelveMonthsRevenue = [];

for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(currentDate.getMonth() - i);

    const monthRevenue = monthlyRevenue.find(d =>
        d.year === date.getFullYear() &&
        d.month === date.getMonth() + 1
    );

    lastTwelveMonthsRevenue.push({
        day: monthNames[date.getMonth()],
        totalRevenue: monthRevenue ? monthRevenue.totalRevenue : 0
    });
}

res.json({ growth: lastTwelveMonthsRevenue });

        }else if (req.query.filter === "yearly") {
            const currentDate = new Date();
          
            const lastFiveYearsStart = new Date(currentDate);
            lastFiveYearsStart.setFullYear(lastFiveYearsStart.getFullYear() - 4);
        
            let yearlyRevenue = await Order.aggregate([
                {
                    $match: {
                        paymentStatus: "Completed",
                        date: {
                            $gte: lastFiveYearsStart,
                            $lte: currentDate
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$date" }
                        },
                        totalRevenue: { $sum: "$orderPrice" }
                    }
                },
                {
                    $sort: { "_id.year": 1 }
                },
                {
                    $project: {
                        _id: 0,
                        year: "$_id.year",
                        totalRevenue: 1
                    }
                }
            ]);
        
            const lastFiveYearsRevenue = [];
        
            for (let i = 4; i >= 0; i--) {
                const year = currentDate.getFullYear() - i;
        
                const yearRevenue = yearlyRevenue.find(d => d.year === year);
        
                lastFiveYearsRevenue.push({
                    day: year,
                    totalRevenue: yearRevenue ? yearRevenue.totalRevenue : 0
                });
            }
        
            res.json({ growth: lastFiveYearsRevenue });
        }else{
   
        const currentDate = new Date();
        const lastWeekStart = new Date(currentDate);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);

        let dailyRevenue = await Order.aggregate([
            { 
                $match: { 
                    paymentStatus: "Completed",
                    date: { 
                        $gte: lastWeekStart,
                        $lte: currentDate 
                    }
                }
            },
            { 
                $group: {
                    _id: { 
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        day: { $dayOfMonth: "$date" },
                        dayOfWeek: { $dayOfWeek: "$date" }
                    },
                    totalRevenue: { $sum: "$orderPrice" }
                }
            },
            { 
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            },
            { 
                $project: {
                    _id: 0,
                    date: {
                        $dateFromParts: { 
                            year: "$_id.year", 
                            month: "$_id.month", 
                            day: "$_id.day" 
                        }
                    },
                    dayOfWeek: "$_id.dayOfWeek",
                    totalRevenue: 1
                }
            }
        ]);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const lastSevenDaysRevenue = [];

        for (let i = 6; i>= 0; i--) {
            const day = new Date(currentDate);
            day.setDate(currentDate.getDate() - i);

            const dayRevenue = dailyRevenue.find(d =>
                d.date.getFullYear() === day.getFullYear() &&
                d.date.getMonth() === day.getMonth() &&
                d.date.getDate() === day.getDate()
            );
            lastSevenDaysRevenue.push({
                day: dayNames[day.getDay()],
                totalRevenue: dayRevenue ? dayRevenue.totalRevenue : 0
            });
   
        }
        res.json({growth:lastSevenDaysRevenue})
    }
 
    } catch (error) {
        next(error)
    }
}



module.exports={
    loadLogin,
    verifyAdmin,
    loadHome,
    loadUsers,
    adminLogout,
    blockUser,
    loadUserspage,
    loadError,
    loadOrderPage,
    loadOrders,
    loadViewOrder,
    insertViewOrder,
    markAsDelivered,
    markAsShipped,
    markAsReturnApproved,
    markAsReturnRejected,
    markAsReturnReceived,
    loadProductOffers,
    loadAddProductOffers,
    addProductOffers,
    deleteProductOffers,
    editpoffer,
    loadEditpoffer,
    loadCategoryOffers,
    loadAddCategoryOffers,
    addCategoryOffers,
    deleteCategoryOffers,
    editcoffer,
    loadEditcoffer,
    loadCoupons,
    loadAddCoupon,
    addCoupon,
    deleteCoupon,
    loadEditCoupon,
    editCoupon,
    loadReport,
    reportTopage,
    takeTop,
    growthSearch,
    markAsCancelled
   
  
}