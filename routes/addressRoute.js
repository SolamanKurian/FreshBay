const express=require("express")
const {v4:uuidv4}=require('uuid')
const session=require("express-session")
const address_route=express()
address_route.use(session({
    secret:uuidv4(),
    saveUninitialized:false,
    resave:false
}))

const addressController=require("../controllers/addressController")


address_route.set('view engine','ejs')
address_route.set('views','./views/customer')
const customerAuth=require("../middleware/customerAuth")

address_route.get('/manageAddress',customerAuth.isSession,addressController.loadManageAddress)
address_route.post('/addAddress',customerAuth.isSession,addressController.addAddress)
address_route.get('/loadExistingAddress',customerAuth.isSession,addressController.loadExistingAddress)
address_route.get('/editAddress',customerAuth.isSession,addressController.loadEditAddress)
address_route.post('/editAddress',customerAuth.isSession,addressController.editAddress)
address_route.get('/removeAddress',customerAuth.isSession,addressController.removeAddress)
address_route.post('/addAddressFromCart',customerAuth.isSession,addressController.addAddressFromCart)





module.exports=address_route;