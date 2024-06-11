const Customer= require('../models/customerModel')
const Category=require("../models/categoryModel")
const Product =require("../models/prodectmodel");
const Cart=require("../models/cartModel")
const Wish=require('../models/wishModel')
const Wallet=require('../models/walletModel')
const Coupon=require("../models/couponModel")
const nodemailer=require("nodemailer")
const bcrypt=require("bcrypt")
const passport=require("passport")
const axios=require("axios");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// to secure the password
const securePassword=async (password)=>{

    try {
       const passwordHash =await bcrypt.hash(password ,10);
       return passwordHash;
    } catch (error) {
        console.log(error.message);
    }

}


// Generate a random OTP (6 digits)
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000);
}

// Function to send OTP email
const sendOTPEmail = (recipientEmail, otp) => {
    // Email content
    
    const mailOptions = {
        from: process.env.user,
        to: recipientEmail,
        subject: 'FreshBay registration OTP',
        text: `Your OTP code is: ${otp}`
    };
// Create a transporter object using SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587, // Port for Gmail with 2FA
    secure: true, // Use a secure connection
    auth: {
        user: process.env.user,
        pass: process.env.pass
    }
});

    // Sending email
    transporter.sendMail(mailOptions, (error, info) => {
        
        if (error) {
            console.log('Error occurred:', error.message);
        } else {
            console.log('Email sent successfully!', info.response);
        }
    });
}

// to render the registratioin page
const loadRegister=async(req,res,next)=>{
try {
    if(req.query.referal){
        req.session.referal_id=req.query.referal;
        if(req.session.message){
            const message=req.session.message;
            delete req.session.message;
            res.render('registration',{message:message})
        }else{
            res.render('registration')
        }
       
    }else{
        if(req.session.message){
            const message=req.session.message;
            res.render('registration',{message:message})
        }else{
            res.render('registration')
        }
    }

} catch (error) {
    next(error);
}
}

//to register before otp
const insertCustomer=async(req,res,next)=>{
try {
    const spassword = await securePassword(req.body.password);

    const existingUser=await Customer.findOne({Email:req.body.email});
    if(existingUser){
        req.session.message="Sorry.. this email already exists";
        return res.redirect("/register")
    }

req.session.newUser={ 
        Name:req.body.name,
        Phone:req.body.phone,
        Email:req.body.email,
        Password:spassword
    }
if(req.session.newUser){
    res.redirect(`/otp`)
}

} catch (error) {
    next(error);
}

}

//to render otp page and send otp and 

const manageOtp=async(req,res,next)=>{


try {

const recipientEmail = req.session.newUser.Email;
const otp = generateOTP();
req.session.otp=otp;
await sendOTPEmail(recipientEmail, otp);

res.render('./otppage')
    
} catch (error) {

    next(error);

}

}


//register customer to database after verify otp
const registerCustomer=async(req,res,next)=>{
    
    try {



        if(req.body.otp==req.session.otp){
            
            const customer=new Customer({
    Name: req.session.newUser.Name,
    Phone: req.session.newUser.Phone,
    Email:  req.session.newUser.Email,
    Password:  req.session.newUser.Password,
            })
            const customerData= await customer.save()
            if(customerData){

                let emailofnewcustomer=customerData.Email

                delete req.session.newUser
                delete req.session.otp
 
                const customer=await Customer.findOne({Email:emailofnewcustomer})
                req.session.customer_id=customer._id
               
                const wallet=new Wallet({
                    customerId:req.session.customer_id,
                    balance:'0',
                    history:[]
                })
                await wallet.save()
                const referedcustomer=await Customer.findOne({Referal:req.session.referal_id})
                if(referedcustomer){
                    delete req.session.referal_id;
                    // to credit wallet of refered customer
                    const referedWallet= await Wallet.findOne({customerId:referedcustomer._id})
                   
        if(referedWallet){
            let amount=10;
            let balance=referedWallet.balance;
            let newbalance=balance+amount;
            referedWallet.balance=newbalance;
            referedWallet.history.push({
        type: 'Credit',
        amount: amount,
        balance: newbalance,
        about:'Referal earning'
            })
        await referedWallet.save()
        }
// to credit the wallet of new customer comes with referal
        const newWallet= await Wallet.findOne({customerId: req.session.customer_id})
        if(newWallet){
            let amount=10;
            let balance=newWallet.balance;
            let newbalance=balance+amount;
            newWallet.balance=newbalance;
            newWallet.history.push({
        type: 'Credit',
        amount: amount,
        balance: newbalance,
        about:'Referal earning'
            })
        await newWallet.save()
    }
                }
                res.json({success:true ,message:"You Entered Wrong OTP"})
            }else{
            }

        }

//if otp is wrong
        else{
            
            res.json({success:false ,message:"You Entered Wrong OTP"})
        }
    } catch (error) {
        next(error);
    }

}
//load login page

const loadLogin=async(req,res,next)=>{

    try {
        
        res.render('login')


    } catch (error) {
        next(error);
    }
}

//login customer
const loginCustomer=async(req,res,next)=>{
  
    try {
        const email=req.body.email
        const password=req.body.password

        const customerData=await Customer.findOne({Email:email})

        if(customerData && customerData.Password){
            const passMatch= await bcrypt.compare(password,customerData.Password)
            if(passMatch){              
                if(customerData.Is_blocked==false){
                    req.session.customer_id=customerData._id;
                    res.redirect('/customerHome')
                }else{
                    res.render('login',{message:"You are blocked"})
                }
               
            }
            else{
                res.render('login',{message:"Password incorrect"})
            }
        }
        else{
            res.render('login',{message:"User not found"})
        }

    } catch (error) {
        next(error);
    }


}
// google verify

passport.use(new GoogleStrategy({
    clientID:process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: process.env.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  
  const googleSuccess = async (req, res) => {
    try {
      let customerData = await Customer.findOne({ Email: req.user.emails[0].value });
      if (!customerData) {
        customerData = new Customer({
          Name: req.user.displayName,
          Email: req.user.emails[0].value,
        });
        await customerData.save();
      }
      req.session.customer_id = customerData._id;
      const wallet=new Wallet({
        customerId:req.session.customer_id,
        balance:'0',
        history:[]
    })
    await wallet.save()
      res.redirect("/customerHome");
    } catch (error) {
      res.send(error.message);
    }
  };


//load customer home
const loadcustomerHome=async(req,res,next)=>{

try {
    
    const cust=req.session.customer_id
    const wish=await Wish.findOne({customerId:cust}).populate('items.productId')
    if(wish){
        const products = await Product.find({Is_delete:false}).populate({
            path: 'Category',
            match: { Is_delete: false }}).exec()
         
            const filteredProducts = products.filter(product => product.Category && product.Category.Is_delete===false);
    
        const customer=await Customer.findOne({_id:req.session.customer_id})
        res.render('customerHome',{customer:customer,products:filteredProducts,wish:wish})
    }else{
        const products = await Product.find({Is_delete:false}).populate({
            path: 'Category',
            match: { Is_delete: false }}).exec()
            const filteredProducts = products.filter(product => product.Category && product.Category.Is_delete===false);
    
        const customer=await Customer.findOne({_id:req.session.customer_id})
        res.render('customerHome',{customer:customer,products:filteredProducts,wish:wish})

    }
 


   
} catch (error) {
    next(error);
}

}


//load customer vegPage
const loadcustomerVegPage=async(req,res,next)=>{

    try {
        
        const products = await Product.find({Is_delete:false}).populate({
            path: 'Category',
            match: { Is_delete: false }}).exec()
            const filteredProducts = products.filter(product => product.Category && product.Category.Is_delete===false);
    
        const customer=await Customer.findOne({_id:req.session.customer_id})
        res.render('customerVeg',{customer:customer,products:filteredProducts})
    
    
       
    } catch (error) {
        next(error);
    }
    
    }
 

//load customer fruitPage
const    loadcustomerFruitPage=async(req,res,next)=>{
    try {
        const products = await Product.find({Is_delete:false}).populate({
            path: 'Category',
            match: { Is_delete: false }}).exec()
            const filteredProducts = products.filter(product => product.Category && product.Category.Is_delete===false);
        const customer=await Customer.findOne({_id:req.session.customer_id})
        res.render('customerFruit',{customer:customer,products:filteredProducts})
    } catch (error) {
        next(error);
    }
    }
    //load customer shop Page
const    loadcustomerShopPage=async(req,res,next)=>{
    try {
        const category=await Category.find()
        const customer=await Customer.findOne({_id:req.session.customer_id})
        res.render('shopPage',{customer:customer,category:category})     
    } catch (error) {
        next(error);
    }
    }

// to load products to the shope page

  const loadProductToShop = async (req, res, next) => {
    try {
      
        const filter=req.query.filter;
        const sort=req.query.sort
        let page ;
        let limit = 6; 
        let search = "";
        if(req.query.q){
            search=req.query.q;
            console.log("two");
        };
       if(req.query.cp){
        
        page=req.query.cp;
       }else{
        page=1;
       };
        
   
        const customer=req.session.customer_id
        const wish=await Wish.findOne({customerId:customer}).populate('items.productId')
        
        
        if (req.query.q || req.query.filter || req.query.sort ||req.query.cp ) {
            
           
            if (sort == 'ztoa') {
                const productData = await Product.find({ $or: [{ Name: { $regex: ".*" + search + ".*", $options: "i" } }] })
                    .populate('Category');
        
                const filteredData =req.query.filter? productData.filter(product => filter.includes(product.Category._id.toString())):productData
                const sortedData = filteredData.sort((a, b) => b.Name.localeCompare(a.Name)); 
                const finalData = sortedData.slice((page - 1) * 8, page * 8);

                res.json({ products: finalData,wish:wish });
            }else if (sort == 'atoz') {
                const productData = await Product.find({ $or: [{ Name: { $regex: ".*" + search + ".*", $options: "i" } }] })
                    .populate('Category');
        
                const filteredData =req.query.filter? productData.filter(product => filter.includes(product.Category._id.toString())):productData
                const sortedData = filteredData.sort((a, b) => a.Name.localeCompare(b.Name)); 
                const finalData = sortedData.slice((page - 1) * 8, page * 8);

                res.json({ products: finalData,wish:wish  });
            }
            else if (sort == 'ltoh') {
                const productData = await Product.find({ $or: [{ Name: { $regex: ".*" + search + ".*", $options: "i" } }] })
                    .populate('Category');
            
                const filteredData = req.query.filter ? productData.filter(product => filter.includes(product.Category._id.toString())) : productData;
                const sortedData = filteredData.sort((a, b) => a.Price - b.Price); 
                const finalData = sortedData.slice((page - 1) * 8, page * 8);
            
                res.json({ products: finalData,wish:wish  });
            } else if (sort == 'htol') {
                const productData = await Product.find({ $or: [{ Name: { $regex: ".*" + search + ".*", $options: "i" } }] })
                    .populate('Category');
            
                const filteredData = req.query.filter ? productData.filter(product => filter.includes(product.Category._id.toString())) : productData;
                const sortedData = filteredData.sort((a, b) => b.Price - a.Price); 
                const finalData = sortedData.slice((page - 1) * 8, page * 8);
            
                res.json({ products: finalData,wish:wish  });
            }else {
                
                const productData = await Product.find({ $or: [{ Name: { $regex: ".*" + search + ".*", $options: "i" } }] })
                    .populate('Category');
            if(req.query.filter){
                const productData = await Product.find({ $or: [{ Name: { $regex: ".*" + search + ".*", $options: "i" } }] })
                    .populate('Category');
                const filteredData =  productData.filter(product => filter.includes(product.Category._id.toString()));

                const finalData = filteredData.slice((page - 1) * 8, page * 8);
                
                res.json({ products:finalData,wish:wish });
            }else{
                
                const productData = await Product.find({ $or: [{ Name: { $regex: ".*" + search + ".*", $options: "i" } }] })
                    .populate('Category');
                const finalData = productData.slice((page - 1) * 8, page * 8);
                
                res.json({ products:finalData,wish:wish });
            }
                    
                 
            }
            
            
        }
         else {
            
            const productData = await Product.find({})
                .populate('Category')
                .skip((page - 1) * 8) 
                .limit(8); 

            res.json({ products: productData,wish:wish });
        }

    } catch (error) {
        next(error);
    }
}

//load product to home
const loadProductToHome = async (req, res, next) => {
    try {
        let page ;
       if(req.query.cp){
        page=req.query.cp;
       }else{
        page=1;
       }

        const customer=req.session.customer_id
        const wish=await Wish.findOne({customerId:customer}).populate('items.productId')
                const productData = await Product.find()
                    .populate('Category');
                const finalData = productData.slice((page - 1) * 8, page * 8);
                
                res.json({ products:finalData,wish:wish });

    } catch (error) {
        next(error);
    }
}






//load customer profile
const loadProfile=async(req,res,next)=>{

    try {
        const customer=await Customer.findOne({_id:req.session.customer_id})
        res.render('profile',{customer:customer})

        
    } catch (error) {
        next(error);
    }
    
    }
    //signout customer profile

const signOut=async(req,res,next)=>{

    try {
        req.session.destroy();
        res.redirect('/login')
        
    } catch (error) {
        next(error);
    }
    
    }

    //load publicHome
const loadPublicHome=async(req,res,next)=>{

    try {
        const products = await Product.find({Is_delete:false}).populate({
            path: 'Category',
            match: { Is_delete: false }}).exec()
            const filteredProducts = products.filter(product => product.Category && product.Category.Is_delete===false);
        
        res.render('publicHome',{products:filteredProducts})
        
    } catch (error) {
        next(error);
    }
    
    }
        //load publicVeg
const  loadPublicVeg=async(req,res,next)=>{

    try {
        const products = await Product.find({Is_delete:false}).populate({
            path: 'Category',
            match: { Is_delete: false }}).exec()
            const filteredProducts = products.filter(product => product.Category && product.Category.Is_delete===false);
        
        res.render('publicVeg',{products:filteredProducts})
        
    } catch (error) {
        next(error);
    }
    
    }
        //load publicFruit
        const  loadPublicFruit=async(req,res,next)=>{

            try {
                const products = await Product.find({Is_delete:false}).populate({
                    path: 'Category',
                    match: { Is_delete: false }}).exec()
                    const filteredProducts = products.filter(product => product.Category && product.Category.Is_delete===false);
                
                res.render('publicFruit',{products:filteredProducts})
                
            } catch (error) {
                next(error);
            }
            
            }
        

    
    // to reset the password

    const loadresetPassword= async(req,res,next)=>{

        try {

            res.render('passwordReset')

            
        } catch (error) {
            next(error);
        }
    }


    // otp for reseting password
    const otp_resetPassword=async(req,res,next)=>{

        try {
            const customer=await Customer.findOne({Email:req.body.email})
            if(customer){

            req.session.customer_email=customer.Email;
            res.redirect('/makeotp')
            }
            else{
                res.render('passwordReset',{message:"No profile exist with this email"})
            }
                
            } catch (error) {
            
                next(error);
            
            }
        
    }
//to make reset otp
const reset_p_otp=async(req,res,next)=>{
try {
const recipientEmail = req.session.customer_email;
            const otp = generateOTP();
            req.session.otp=otp;
            setTimeout(()=>{
                delete req.session.otp
            },60000)
            sendOTPEmail(recipientEmail, otp);

            res.render('p_reset_otp')
} catch (error) {
    res.redirect('/error')
}
    }
// to verify the reset password otp

    const resetPassword_otp_verify=async(req,res)=>{
try {
    if(req.body.otp==req.session.otp){
        res.render('newPassword')
    }
    else{
        res.render('./p_reset_otp',{message:"You Entered Wrong OTP"})
    }


    
} catch (error) {
    next(error);
}

    }
//to update password

const updatePassword=async(req,res,next)=>{

try {
    
const spassword= await securePassword(req.body.password)

const customerData=await Customer.updateOne({Email:req.session.customer_email},{$set:{Password:spassword}})

if(customerData){
    delete req.session.customer_email
    res.redirect('/login')
}

} catch (error) {
    next(error);
}

}

//to load loged contact

const loadlogedContact=async(req,res,next)=>{
try {
    const customer=await Customer.findOne({_id:req.session.customer_id})
    res.render('contact',{customer:customer})

} catch (error) {
    next(error);
}
}

// to load error page
const loadError=async(req,res,next)=>{
    try {
        const customer=await Customer.findOne({_id:req.session.customer_id})
        res.render('error',{customer:customer})   
    } catch (error) {
        next(error);
    }
    }






// to load public contact
const loadContact=async(req,res,next)=>{
    try {
        res.render('publicContact')
    } catch (error) {
        next(error);
    }
    }

// to load product Page

const loadProductPage=async(req,res,next)=>{
try {
    const product=await Product.findOne({_id:req.query.pid}).populate('Category')
    const customer=await Customer.findOne({_id:req.session.customer_id})
    const products=await Product.find({Is_delete:false}).populate('Category')

    res.render('productPage',{customer:customer,product:product,products:products})



} catch (error) {
    next(error);
}
}

// to add product to cart

const addToCart= async(req,res,next)=>{
try {
const customerId=req.session.customer_id
const productId=req.query.proId
const haveCart=await Cart.findOne({customerId:customerId})
if(haveCart){
    let check=0;
    haveCart.items.forEach(item=>{
        
        if(item.productId==productId){

            check=1;
        }

    })
if(check==0){
    await haveCart.updateOne({$push:{items:{productId:productId}}})
    res.json({success:true, message:"Added to Cart"})
}else{
    res.json({success:false, message:"Already in Cart"})
}
}

else{
    const cart=new Cart({
        customerId: customerId,
        items: [{productId:productId}]      
      })
      const cartData= await cart.save()
      if(cartData){

        res.json({success:true, message:"Added to Cart"})

      }

}


    
} catch (error) {
    next(error);
}
}
// to load cart page
const loadCart=async(req,res,next)=>{

    try {
        const customer=await Customer.findOne({_id:req.session.customer_id})
        res.render('cartPage',{customer:customer})

        
    } catch (error) {
        next(error);
    }
    
    }

    // to insert cart to page

    const insertCart=async(req,res,next)=>{

        try {

            const customer=req.session.customer_id
            const cart=await Cart.findOne({customerId:customer}).populate('items.productId')
           
            if(cart){
                res.json({cart:cart})
            }else{
                res.json(null)
            }

        } catch (error) {
            next(error)
        }

    }

    // to increment quantity
    

    const incQuantity = async (req, res, next) => {
        try {
            let flag=0;
            const customer = req.session.customer_id;
            const cart = await Cart.findOne({ customerId: customer }).populate('items.productId');
            if (cart) {
                const itemToUpdate = cart.items.find(item => item.productId._id.toString() === req.query.Pid);
                if (itemToUpdate) {
                    if(itemToUpdate.quantity<itemToUpdate.productId.Quantity && itemToUpdate.quantity<10){
                    await Cart.updateOne(
                        { 'items._id': itemToUpdate._id },
                        { $inc: { 'items.$.quantity': 1 } }
                    )} else{
                       flag=1
                    }
    
                    // Fetch the updated cart to get the latest quantity
                    const updatedCart = await Cart.findOne({ customerId: customer }).populate('items.productId');
                    const updatedItem = updatedCart.items.find(item => item._id.equals(itemToUpdate._id));
                    const updatedQuantity = updatedItem ? updatedItem.quantity : null;

                    //to calculate total cost
                    const cost=updatedItem.quantity*(updatedItem.productId.Offerprice?updatedItem.productId.Offerprice:updatedItem.productId.Price)

                    if(updatedItem.quantity<=itemToUpdate.productId.Quantity){
                        if(flag==0){
                            res.json({ newQuantity: updatedQuantity, cost:cost,item:updatedItem});
                        }else{
                            res.json({ newQuantity: updatedQuantity, cost:cost,item:updatedItem,success:true});
                        }
                    
                    }else{
                        res.json({ newQuantity: updatedQuantity, cost:cost,item:updatedItem,success:true});
                    }
                } 
            } 
        } catch (error) {
            console.error('Error updating quantity:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
    


    //to decrement quantity

  
    const decQuantity = async (req, res, next) => {
        try {
            let flag=0;
            const customer = req.session.customer_id;
            const cart = await Cart.findOne({ customerId: customer }).populate('items.productId');
            if (cart) {
                const itemToUpdate = cart.items.find(item => item.productId._id.toString() === req.query.Pid);
                if (itemToUpdate) {
                    if(itemToUpdate.quantity>1){
                    await Cart.updateOne(
                        { 'items._id': itemToUpdate._id },
                        { $inc: { 'items.$.quantity': -1 } }
                    )} else{
                        flag=1
                    }
    
                    // Fetch the updated cart to get the latest quantity
                    const updatedCart = await Cart.findOne({ customerId: customer }).populate('items.productId');
                    const updatedItem = updatedCart.items.find(item => item._id.equals(itemToUpdate._id));
                    const updatedQuantity = updatedItem ? updatedItem.quantity : null;
                   //to calculate total cost
                    const cost=updatedItem.quantity*(updatedItem.productId.Offerprice?updatedItem.productId.Offerprice:updatedItem.productId.Price);
                    
                    if(updatedItem.quantity){
                        if(flag==0){
                            res.json({ newQuantity: updatedQuantity, cost:cost,item:updatedItem})
                        }else{
                            res.json({ newQuantity: updatedQuantity, cost:cost,item:updatedItem,success:true})
                        }
                }else{
                    res.json({ newQuantity: updatedQuantity, cost:cost,item:updatedItem,success:true})
                }
                } 
            } 
        } catch (error) {
            console.error('Error updating quantity:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
    
    //to remove Item from Cart
    const removeItem= async (req,res,next)=>{
        try {
            const customer = req.session.customer_id;
            const cart = await Cart.findOne({ customerId: customer }).populate('items.productId');
            const itemToDelete = cart.items.find(item => item.productId._id.toString() === req.query.Pid);
            await Cart.updateOne(
                { customerId: customer },
                { $pull: { items: { "productId": req.query.Pid } } }
              );
              res.json({success:true,item:itemToDelete})
           
            
        } catch (error) {
            next(error)
        }

    }

//add to wishlist

const addToWish= async(req,res,next)=>{
    try {
    const customerId=req.session.customer_id
    const productId=req.query.proId
    const haveWish=await Wish.findOne({customerId:customerId})
    if(haveWish){
        await haveWish.updateOne({$push:{items:{productId:productId}}})
        res.json({success:true, message:"Added to Wishlist"})
    } 
    else{
        const wish=new Wish({
            customerId: customerId,
            items: [{productId:productId}]      
          })
          const wishData= await wish.save()
          if(wishData){
            res.json({success:true, message:"Added to Wishlist"})
          }   
    }
    
    } catch (error) {
        next(error);
    }
    }


// to remove from wishlist

const removeFromWish=async(req,res,next)=>{
    try {

                const customer = req.session.customer_id;
                const wish = await Wish.findOne({ customerId: customer }).populate('items.productId');
                const itemToDelete = wish.items.find(item => item.productId._id.toString() === req.query.proId);
                await Wish.updateOne(
                    { customerId: customer },
                    { $pull: { items: { "productId": req.query.proId } } }
                  );
                  res.json({success:true,item:itemToDelete,message:"Removed from Wishlist"})
               
  
    } catch (error) {
        next(error)
    }
}






    // to loadf edit profile page
    const loadeditProfile=async(req,res,next)=>{
        try {

            const customer=await Customer.findOne({_id:req.session.customer_id})
            res.render('editProfile',{customer:customer})
            
        } catch (error) {
            next(error)
        }
    }
// to edit and update profile

const editProfile=async(req,res,next)=>{
    try {
        const updatedCustomer=await Customer.findByIdAndUpdate({_id:req.session.customer_id},{$set:{

            Name:req.body.name,
            Phone:req.body.phone,
            

        }})
        if(updatedCustomer){
            res.redirect('/profile')
        }
        
    } catch (error) {
        next(error)
    }
}

//to load change password page

const loadeChangePassword=async(req,res,next)=>{
    try {

        const customer=await Customer.findOne({_id:req.session.customer_id})
            res.render('changePassword',{customer:customer})

        
    } catch (error) {
        next(error)
    }
}

//to change the password
const ChangePassword=async(req,res,next)=>{
try {

    const password=req.body.oldpassword
    const customer=await Customer.findOne({_id:req.session.customer_id})
    if(customer){
        const passMatch= await bcrypt.compare(password,customer.Password)
        if(passMatch){
            const spassword= await securePassword(req.body.password)

const customerData=await Customer.updateOne({_id:req.session.customer_id},{$set:{Password:spassword}})
if(customerData){
    res.redirect('/profile')
}
        }else{
            res.render('changePassword',{message:"You entered wrong password",customer:customer})
        }
    }

} catch (error) {
    next(error)
}
}
//to load checkout page

const loadCheckout=async(req,res,next)=>{
    try {
        if(req.body.coupon){
            let coupon=await Coupon.findOne({couponcode:req.body.coupon});
                let value=coupon.percentage;
                let maxOffer=coupon.maxlimit;

        req.session.discount=value;
        req.session.maxOffer=maxOffer;
        }
        let coupon=req.session.discount?req.session.discount:0;
        let maxOffer=req.session.maxOffer?req.session.maxOffer:0;
        const wallet= await Wallet.findOne({customerId:req.session.customer_id})
        const customer=await Customer.findOne({_id:req.session.customer_id})
            res.render('checkoutPage',{customer:customer,wallet:wallet,coupon:coupon,maxOffer:maxOffer})
        
    } catch (error) {
        next(error)
    }
}
// to check quantity before cart proceed

const CheckQuantity = async (req, res, next) => {
  try {
    const customer = req.session.customer_id;
    const cart = await Cart.findOne({ customerId: customer }).populate('items.productId');
    
    let allItemsInStock = true; 

    for(let item of cart.items) {
        if(item.productId.Quantity===0){
            allItemsInStock = false; 
        }

      else if (item.quantity > item.productId.Quantity) {
        item.quantity=item.productId.Quantity;
       await cart.save();
        allItemsInStock = false; 
      }
    };

    if (allItemsInStock) {
      res.json({ success: true, message: "All items are in stock" });
    } else {
      res.json({ success: false, message: "Some items are out of stock" });
    }
  } catch (error) {
    next(error);
  }
};

// to load wishlist page
const loadWishList=async(req,res,next)=>{

    try {
        const customer=await Customer.findOne({_id:req.session.customer_id})
        res.render('wishList',{customer:customer})

        
    } catch (error) {
        next(error);
    }
    
    }

 // to insert wish to page

 const insertWish=async(req,res,next)=>{

    try {

        const customer=req.session.customer_id
        const wish=await Wish.findOne({customerId:customer}).populate('items.productId')
       
        if(wish){
            res.json({wish:wish})
        }else{
            res.json(null)
        }

    } catch (error) {
        next(error)
    }

}
// to list the coupons
const listCoupons=async(req,res,next)=>{
    try {
        
        const coupons=await Coupon.find()
        if(coupons){
            res.json({coupons:coupons})
        }
        
    } catch (error) {
        next(error)
    }
}
// to check the coupon

const checkCoupon= async(req,res,next)=>{
try {

let couponCode=req.body.couponCode;

const machedCoupon=await Coupon.findOne({couponcode:couponCode})
if(machedCoupon){
    res.json({success:true,percentage:machedCoupon.percentage,maxlimit:machedCoupon.maxlimit,minlimit:machedCoupon.minlimit})
}else{
    res.json({success:false})
}
 
} catch (error) {
    next(error)
}

}
module.exports={
    loadRegister,
    insertCustomer,
    manageOtp,
    registerCustomer,
    loadLogin,
    loginCustomer,
    loadcustomerHome,
    loadProfile,
    signOut,
    loadPublicHome,
    loadresetPassword,
    otp_resetPassword,
    resetPassword_otp_verify,
    updatePassword,
    loadContact,
    loadlogedContact,
    reset_p_otp,
    loadProductPage,
    loadError,googleSuccess,
    addToCart,
    loadCart,
    insertCart,
    incQuantity,
    decQuantity,
    removeItem,
    loadeditProfile,
    editProfile,
    loadeChangePassword,
    ChangePassword,
    loadCheckout,
    CheckQuantity,
    loadcustomerVegPage,
    loadcustomerFruitPage,
    loadcustomerShopPage,
    loadProductToShop,
    addToWish,
    removeFromWish,
    loadWishList,
    insertWish,
    listCoupons,
    checkCoupon,
    loadProductToHome,
    loadPublicVeg,
    loadPublicFruit
   
}