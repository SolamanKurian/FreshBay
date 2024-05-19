const express=require("express")
const order_route=express()


const orderController=require("../controllers/orderController")

order_route.set('view engine','ejs')
order_route.set('views','./views/customer')
const customerAuth=require("../middleware/customerAuth")

order_route.post('/createOrder',customerAuth.isSession,orderController.createOrder)
order_route.get('/orderplaced',customerAuth.isSession,orderController.loadOrderPlaced)

order_route.get('/myOrders',customerAuth.isSession,orderController.loadMyOrder)
order_route.get('/insertOrders',customerAuth.isSession,orderController.insertMyOrder)
order_route.get('/cancelOrder',customerAuth.isSession,orderController.cancelOrder)
order_route.get('/viewOrder',customerAuth.isSession,orderController.loadViewOrder)
order_route.get('/insertViewOrder',customerAuth.isSession,orderController.insertViewOrder)
order_route.get('/cancelItem',customerAuth.isSession,orderController.cancelItem)
order_route.get('/returnItem',customerAuth.isSession,orderController.returnItem)
order_route.get('/payNow',customerAuth.isSession,orderController.payNow)
order_route.get('/nowPaid',customerAuth.isSession,orderController.nowPaid)

module.exports=order_route;