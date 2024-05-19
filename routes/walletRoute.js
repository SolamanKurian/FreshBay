const express=require("express")
const {v4:uuidv4}=require('uuid')
const session=require("express-session")
const wallet_route=express()
wallet_route.use(session({
    secret:uuidv4(),
    saveUninitialized:false,
    resave:false
}))

const walletController=require("../controllers/walletController")


wallet_route.set('view engine','ejs')
wallet_route.set('views','./views/customer')
const customerAuth=require("../middleware/customerAuth")

wallet_route.get('/walletPage',customerAuth.isSession,walletController.loadWallet)
wallet_route.get('/addMoney',customerAuth.isSession,walletController.addMoney)
wallet_route.get('/addMoneyToWallet',customerAuth.isSession,walletController.addMoneyToWallet)
wallet_route.get('/history',customerAuth.isSession,walletController.history)



module.exports=wallet_route;