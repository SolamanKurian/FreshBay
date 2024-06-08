const express=require("express")
const {v4:uuidv4}=require('uuid')
const session=require("express-session")
const multer=require("multer")
const path=require("path")
const product_route=express()
product_route.use(session({
    secret:uuidv4(),
    saveUninitialized:false,
    resave:false
}))
//settings for file upload storage

const productstore=multer.diskStorage({destination:(req,file,cb)=>{
    cb(null,path.join(__dirname, '../public/productimages'))
}, filename:(req,file,cb)=>{
    const unique=Date.now()+"-"+Math.round(Math.random()*1e9);
const name=file.originalname+"-"+unique;
cb(null,name)
}});
const upload=multer({storage:productstore})
//upto here






product_route.set('view engine','ejs')
product_route.set('views','./views/product')
const productController=require("../controllers/productController")
const adminAuth=require("../middleware/adminAuth")


product_route.get('/',adminAuth.isSession,productController.loadProductsPage)
product_route.get('/productSearch',adminAuth.isSession,productController.loadProducts)
product_route.get('/deletedProducts',adminAuth.isSession,productController.loadDeletedProducts)
product_route.post('/delete-product',adminAuth.isSession,productController.deletedProducts)
product_route.get('/AddProduct',adminAuth.isSession,productController.loadAddProduct)
product_route.get('/editProduct',adminAuth.isSession,productController.loadEditProduct)
product_route.post('/editProduct',adminAuth.isSession,upload.array('images'),productController.editProduct)
product_route.post('/AddProduct',adminAuth.isSession,upload.array('images'),productController.addProduct)
product_route.get('/category',adminAuth.isSession,productController.loadCategory)
product_route.get('/editCategory',adminAuth.isSession,productController.loadEditCategory)
product_route.post('/editCategory',adminAuth.isSession,productController.editCategory)
product_route.get('/addCategory',adminAuth.isSession,productController.loadAddCategory)
product_route.post('/addCategory',adminAuth.isSession,productController.addCategory)
product_route.get('/subCategory',adminAuth.isSession,productController.loadSubCategory)
product_route.get('/addSubCategory',adminAuth.isSession,productController.loadAddSubCategory)
product_route.post('/unlist-category',adminAuth.isSession,productController.unlistCategory)
product_route.get('/unlistedCategory',adminAuth.isSession,productController.loadUnlistedCategory)
product_route.post('/addSubCategory',adminAuth.isSession,productController.addSubCategory)
product_route.post('/unlist-subcategory',adminAuth.isSession,productController.unlistSubCategory)
product_route.get('/unlistedSubCategory',adminAuth.isSession,productController.loadUnlistedSubCategory)






product_route.get('*',(req,res)=>{

    res.redirect('/product')

})

module.exports=product_route