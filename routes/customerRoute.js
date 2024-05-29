const express=require("express")
const {v4:uuidv4}=require('uuid')
const session=require("express-session")
const customer_route=express()
customer_route.use(session({
    secret:uuidv4(),
    saveUninitialized:false,
    resave:false
}))

const customerController=require("../controllers/customerController")
const passport = require("passport")
customer_route.use(passport.initialize());
customer_route.use(passport.session())

customer_route.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  
customer_route.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      successRedirect: "/auth/google/googleSuccess",
      failureRedirect: "/login",
    })
  );
  
customer_route.get("/auth/google/googleSuccess", customerController.googleSuccess);



customer_route.set('view engine','ejs')
customer_route.set('views','./views/customer')
const customerAuth=require("../middleware/customerAuth")
customer_route.get('/',customerAuth.noSession,customerController.loadPublicHome)
customer_route.get('/publicVeg',customerAuth.noSession,customerController.loadPublicVeg)
customer_route.get('/publicFruit',customerAuth.noSession,customerController.loadPublicFruit)

customer_route.get('/register',customerAuth.noSession,customerController.loadRegister)
customer_route.post('/register',customerAuth.noSession,customerController.insertCustomer)
customer_route.get('/otp',customerAuth.noSession,customerController.manageOtp)
customer_route.post('/otp',customerController.registerCustomer)
customer_route.get('/login',customerAuth.noSession,customerController.loadLogin)
customer_route.post('/login',customerController.loginCustomer)
customer_route.get('/customerHome',customerAuth.isSession,customerController.loadcustomerHome)
customer_route.get('/vegPage',customerAuth.isSession,customerController.loadcustomerVegPage)
customer_route.get('/fruitPage',customerAuth.isSession,customerController.loadcustomerFruitPage)
customer_route.get('/shopPage',customerAuth.isSession,customerController.loadcustomerShopPage)
customer_route.get('/productSearch',customerAuth.isSession,customerController.loadProductToShop)
customer_route.get('/productHome',customerAuth.isSession,customerController.loadProductToHome)

customer_route.get('/profile',customerAuth.isSession,customerController.loadProfile)
customer_route.get('/signout',customerAuth.isSession,customerController.signOut)
customer_route.get('/password_reset',customerAuth.noSession,customerController.loadresetPassword)
customer_route.post('/password_reset',customerController.otp_resetPassword)
customer_route.post('/p_reset_otp',customerController.resetPassword_otp_verify)
customer_route.post('/newPassword',customerController.updatePassword)
customer_route.get('/contact',customerController.loadlogedContact)
customer_route.get('/error',customerController.loadError)
customer_route.get('/publicContact',customerController.loadContact)
customer_route.get('/makeotp',customerController.reset_p_otp)
customer_route.get('/productPage',customerAuth.isSession,customerController.loadProductPage)
customer_route.get('/addToCart',customerAuth.isSession,customerController.addToCart)
customer_route.get('/addToWish',customerAuth.isSession,customerController.addToWish)
customer_route.get('/removeFromWish',customerAuth.isSession,customerController.removeFromWish)
customer_route.get('/cartPage',customerAuth.isSession,customerController.loadCart)
customer_route.get('/insertCart',customerAuth.isSession,customerController.insertCart)
customer_route.get('/incQuantity',customerAuth.isSession,customerController.incQuantity)
customer_route.get('/decQuantity',customerAuth.isSession,customerController.decQuantity)
customer_route.get('/removeItem',customerAuth.isSession,customerController.removeItem)
customer_route.get('/editProfile',customerAuth.isSession,customerController.loadeditProfile)
customer_route.post('/editProfile',customerAuth.isSession,customerController.editProfile)
customer_route.get('/changePassword',customerAuth.isSession,customerController.loadeChangePassword)
customer_route.post('/changePassword',customerAuth.isSession,customerController.ChangePassword)
customer_route.post('/checkout',customerAuth.isSession,customerController.loadCheckout)
customer_route.get('/checkout',customerAuth.isSession,customerController.loadCheckout)
customer_route.get('/checkQuantity',customerAuth.isSession,customerController.CheckQuantity)
customer_route.get('/wishList',customerAuth.isSession,customerController.loadWishList)
customer_route.get('/insertWish',customerAuth.isSession,customerController.insertWish)
customer_route.get('/removeWish',customerAuth.isSession,customerController.removeFromWish)
customer_route.get('/coupons',customerAuth.isSession,customerController.listCoupons)
customer_route.post('/checkCoupon',customerAuth.isSession,customerController.checkCoupon)

module.exports=customer_route;