const express=require("express")
const {v4:uuidv4}=require('uuid')
const session=require("express-session")
const admin_route=express()
admin_route.use(session({
    secret:uuidv4(),
    saveUninitialized:false,
    resave:false
}))

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')
const adminController=require("../controllers/adminController")
const adminAuth=require("../middleware/adminAuth")


admin_route.get('/',adminAuth.noSession,adminController.loadLogin)
admin_route.post('/',adminController.verifyAdmin)
admin_route.get('/adminHome',adminAuth.isSession,adminController.loadHome)
admin_route.get('/takeTop',adminAuth.isSession,adminController.takeTop)

admin_route.get('/users',adminAuth.isSession,adminController.loadUserspage)
admin_route.get('/admin/error',adminAuth.isSession,adminController.loadError)

admin_route.get('/usersSearch',adminAuth.isSession,adminController.loadUsers)
admin_route.get('/logout',adminAuth.isSession,adminController.adminLogout)
admin_route.post('/block-user',adminAuth.isSession,adminController.blockUser)

admin_route.get('/orders',adminAuth.isSession,adminController.loadOrderPage)
admin_route.get('/orderSearch',adminAuth.isSession,adminController.loadOrders)
admin_route.get('/viewOrder',adminAuth.isSession,adminController.loadViewOrder)
admin_route.get('/insertViewOrder',adminAuth.isSession,adminController.insertViewOrder)
admin_route.get('/delivered',adminAuth.isSession,adminController.markAsDelivered)
admin_route.get('/cancel',adminAuth.isSession,adminController.markAsCancelled)
admin_route.get('/shipped',adminAuth.isSession,adminController.markAsShipped)
admin_route.get('/approve',adminAuth.isSession,adminController.markAsReturnApproved)
admin_route.get('/reject',adminAuth.isSession,adminController.markAsReturnRejected)
admin_route.get('/receive',adminAuth.isSession,adminController.markAsReturnReceived)
admin_route.get('/productOffers',adminAuth.isSession,adminController.loadProductOffers)
admin_route.get('/addProductOffer',adminAuth.isSession,adminController.loadAddProductOffers)
admin_route.post('/addProductOffer',adminAuth.isSession,adminController.addProductOffers)
admin_route.post('/deletePoffer',adminAuth.isSession,adminController.deleteProductOffers)
admin_route.get('/editPoffer',adminAuth.isSession,adminController.loadEditpoffer)
admin_route.post('/editPoffer',adminAuth.isSession,adminController.editpoffer)
admin_route.get('/categoryOffers',adminAuth.isSession,adminController.loadCategoryOffers)
admin_route.get('/addCategoryOffer',adminAuth.isSession,adminController.loadAddCategoryOffers)
admin_route.post('/addCategoryOffer',adminAuth.isSession,adminController.addCategoryOffers)
admin_route.post('/deleteCoffer',adminAuth.isSession,adminController.deleteCategoryOffers)
admin_route.get('/editCoffer',adminAuth.isSession,adminController.loadEditcoffer)
admin_route.post('/editCoffer',adminAuth.isSession,adminController.editcoffer)
admin_route.get('/coupons',adminAuth.isSession,adminController.loadCoupons)
admin_route.get('/addCoupon',adminAuth.isSession,adminController.loadAddCoupon)
admin_route.post('/addCoupon',adminAuth.isSession,adminController.addCoupon)
admin_route.post('/deleteCoupon',adminAuth.isSession,adminController.deleteCoupon)
admin_route.get('/editCoupon',adminAuth.isSession,adminController.loadEditCoupon)
admin_route.post('/editCoupon',adminAuth.isSession,adminController.editCoupon)
admin_route.get('/report',adminAuth.isSession,adminController.loadReport)
admin_route.get('/reportSearch',adminAuth.isSession,adminController.reportTopage)
admin_route.get('/growthSearch',adminAuth.isSession,adminController.growthSearch)



admin_route.get('*',(req,res)=>{

    res.redirect('/admin')

})

module.exports=admin_route