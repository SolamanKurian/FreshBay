const Admin= require('../models/adminModel')
const Customer= require('../models/customerModel')
const Category=require('../models/categoryModel')
const Product=require('../models/prodectmodel')
const Poffer=require("../models/productofferModel")
const Coffer=require("../models/categoryofferModel")
const sharp=require('sharp')
const fs=require("fs")
const path=require('path')
const bcrypt=require("bcrypt")
const axios=require("axios")
const Swal=require("sweetalert2")
const { error } = require('console')





// load products page

const loadProductsPage=async(req,res)=>{
    try {
        res.render('products')
    } catch (error) {
        console.log(error.message);
    }  
    }
// load products page with search
    const loadProducts= async(req,res)=>{
        
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
                const productData= await Product.find({$or:[{Name:{$regex:".*"+search+".*",$options:"i"}}]}).populate('Category').sort({ Date: -1 });
                let finalproductData=productData.slice((page - 1) * 5, page * 5);
                res.json({products:finalproductData})
            }else{
                const productData=await Product.find({}).populate('Category').sort({ Date: -1 });
                let finalproductData=productData.slice((page - 1) * 5, page * 5);
                res.json({products:finalproductData})
            }
        } catch (error) {
            console.log(error.message)
        }
    }

// to load deleted product page

const loadDeletedProducts=async(req,res)=>{
try {
    res.render('unlistedProducts')
    
} catch (error) {
    console.log(error.message);
}



}

//to  soft delete product

const deletedProducts=async(req,res)=>{
try {
    const productId=req.body.productid
  
    const productData=await Product.findOne({_id:productId})
   
   
    if(productData.Is_delete){
        
     await Product.updateOne({_id:productId},{$set:{Is_delete:0}})
      res.json({success:true,message:"Retrived"})
    }
    else{
        await Product.updateOne({_id:productId},{$set:{Is_delete:1}})
      res.json({success:true,message:"Deleted"})
    }
    
} catch (error) {
    console.log(error.message);
}

}



// to render add product page


const loadAddProduct=async(req,res)=>{
    try {
        const categoryData=await Category.find({})
    res.render('addProduct',{cat:categoryData})
    } catch (error) {
        console.log(error.message);
    }
    }


// to render category page

const loadCategory=async(req,res)=>{

try {
const categories=await Category.find({})
    
    res.render('category',{categories:categories})
    
} catch (error) {
    console.log(error.message);
}

}
// to render category add page

const loadAddCategory=async(req,res)=>{

    try {
    
        res.render('addCategory')
        
    } catch (error) {
        console.log(error.message);
    }
    
    }

    // to add category to db

    const addCategory=async(req,res)=>{
try {
    
    const already = await Category.findOne({ Name: { $regex: new RegExp('^' + req.body.name + '$', 'i') } });

    if(already){

       return res.render('addCategory',{message:'Category name already exists'})
    }
        const category= new Category({
            Name: req.body.name,
            })
    const categoryData=await category.save()

if(categoryData){

res.redirect('/product/category')
}
} catch (error) {
    console.log(error.message);
}
    }
// to render sub category page

const loadSubCategory=async(req,res)=>{
    try {
        const categories=await Category.find({})
  
            res.render('subCategory',{categories:categories})

    } catch (error) {
        console.log(error.message);
    }
    
        }

    // to render add sub category page

    const loadAddSubCategory=async(req,res)=>{
        try {

            const categories=await Category.find({})
    
            res.render('addSubCategory',{categories:categories})
            
            
        } catch (error) {
            console.log(error.message);
        }

    }
// to unlist category
    const unlistCategory=async(req,res)=>{
        
        try {
            const categoryId=req.body.catid
          
            const catData=await Category.findOne({_id:categoryId})
           
            if(catData.Is_delete){
        
             await Category.updateOne({_id:categoryId},{$set:{Is_delete:0}})
              res.json({success:true,message:"Unlisted"})
            }
            else{
                await Category.updateOne({_id:categoryId},{$set:{Is_delete:1}})
              res.json({success:true,message:"Listed"})
             
            }
        
        } catch (error) {
            console.log(error.message);
        }
        }

    // to load unlisted category page

    const loadUnlistedCategory=async(req,res)=>{

        try {

            const categories=await Category.find({})
    
            res.render('unlistedCategory',{categories:categories})
            
        } catch (error) {
            console.log(error.message);
        }

    }
// to add sub catagory to db

const addSubCategory=async(req,res)=>{
try {
    const subCat=req.body
    const subCatData=await Category.updateOne({Name:req.body.category},{$addToSet:{SubCategory:{subc:req.body.name,Is_dlt:0}}})
    if(subCatData){
        
        res.redirect('/product/subCategory')
    }

    
} catch (error) {
    console.log(error.message);
}


}

// to unlist sub category

const unlistSubCategory=async(req,res)=>{
    
try {
    
    const subcName=req.body.subc
    // const subCatData=await Category.findOne({"SubCategory.subc":subcName} )
    const subCatData=await Category.aggregate([{$unwind:"$SubCategory"},{$match:{"SubCategory.subc":subcName}}])

  
    if(subCatData[0].SubCategory.Is_dlt){
        

     await  Category.updateOne({"SubCategory.subc":subcName}, { $set: { "SubCategory.$.Is_dlt": 0 } } )
    
      res.json({success:true,message:"Unlisted"})
    }
    else{
        await  Category.updateOne({"SubCategory.subc":subcName}, { $set: { "SubCategory.$.Is_dlt": 1 } } )
    
      res.json({success:true,message:"Unlisted"})
     
    }

    
} catch (error) {
    console.log(error.message);
}
}
// to load unlisted subcategory

const loadUnlistedSubCategory=async(req,res)=>{

try {
    const categories=await Category.find({})
  
            res.render('unlistedSubCategory',{categories:categories})
    
} catch (error) {
    console.log(error.message);
}


}
// to add product to db

const addProduct=async(req,res)=>{
try {

    const already = await Product.findOne({ Name: { $regex: new RegExp('^' + req.body.name + '$', 'i') } });

    if(already){
        const categoryData=await Category.find({})
       return res.render('addProduct',{message:'Product name already exists',cat:categoryData})
    }


   
    const category=await Category.findOne({Name:req.body.category})
    const product=new Product({
        Name: req.body.name ,
        Price:req.body.price ,
        Quantity:req.body.quantity ,
        Category:category._id ,
        Pdesc:req.body.description,
        Date: new Date(),
    })
    
    for(let i=0;i<req.files.length;i++){
        product.Image.push(req.files[i].filename);
    }
    //to check the offer price
    const coffer = await Coffer.find().populate('categoryId');
    const isCatOffer = coffer.find(item => item.categoryId._id.toString() === category._id.toString());
    
    if (isCatOffer) {
       
        let percentage=isCatOffer.percentage;
        let offer=(req.body.price*percentage)/100;
         cofferprice=req.body.price-offer;
         product.Offerprice=cofferprice;
      } 
      
    const productData=await product.save()
    
    if(productData){

        for (let j = 0; j < req.files.length; j++) {
            const filePath = `./public/productimages/${req.files[j].originalname}`;
            try {
                fs.unlinkSync(filePath);
                
            } catch (error) {
                // error ocuuring while unlink, issue with permission need to clarify
                
            }
        }
        
        

        res.redirect('/product')

    }
} catch (error) {
    console.log(error.message);
}
}
// to load edit product

const loadEditProduct=async(req,res)=>{
try {
    const category=await Category.find({Is_delete:false})
    const pid=req.query.pid
    const productData=await Product.findOne({_id:pid}).populate('Category')
    if(productData){
        res.render('productEdit',{product:productData,cat:category})
    }
} catch (error) {
    console.log(error.message);
}
}

// to edit/update product

const editProduct=async(req,res)=>{
try {

    const pid = req.query.pid;


    const existingProduct = await Product.findOne({ Name: { $regex: new RegExp('^' + req.body.name + '$', 'i') } });
    if (existingProduct && existingProduct._id.toString() !== pid) {
      const categories = await Category.find({ Is_delete: false });
      const productData = await Product.findById(pid);
      return res.render('productEdit', { message: 'Product name already exists', product: productData, cat: categories });
    }
    const category=await Category.findOne({Name:req.body.category})

const product=await Product.findByIdAndUpdate({_id:pid},{$set:{

    Name:req.body.name,
    Price:req.body.price,
    Quantity:req.body.quantity,
    Category:category._id ,
    Pdesc:req.body.description
}});

if(req.body.deletedIndices){
    
const deletedIndices=JSON.parse(req.body.deletedIndices)

for(let index of deletedIndices){
     
     const deletedImage = product.Image[Number(index)];

     // Remove the image file from the file system
     fs.unlinkSync(`./public/productimages/${deletedImage}`);
    product.Image.splice(Number(index),1)
}

}

    for(let i=0;i<req.files.length;i++){
        product.Image.push(req.files[i].filename);
    }


  //to check the offer price
  const coffer = await Coffer.find().populate('categoryId');
  const isCatOffer = coffer.find(item => item.categoryId._id.toString() === category._id.toString());
  
  if (isCatOffer) {
     
      let percentage=isCatOffer.percentage;
      let offer=(req.body.price*percentage)/100;
       cofferprice=req.body.price-offer;
       product.Offerprice=cofferprice;
    } 
const productData=await product.save()
if(productData){
    res.redirect('/product')
}   
} catch (error) {
    console.log(error.message);
}
}
//to load edit category
const loadEditCategory=async(req,res)=>{
        
    try {
        const categoryData=await Category.findOne({_id:req.query.cid})
    if(categoryData){
        res.render('editCategory',{cat:categoryData})
    }    
    } catch (error) {
        console.log(error.message);
    }
}
// to edit category in to db

const editCategory=async(req,res)=>{
try {
    const already = await Category.findOne({ Name: { $regex: new RegExp('^' + req.body.name + '$', 'i') } });
    if(already){
       
        const categoryData=await Category.findOne({_id:req.query.cid})
       return res.render('editCategory',{message:'Category name already exists',cat:categoryData})
    }
    const cid=req.query.cid;
    const category=await Category.findByIdAndUpdate({_id:cid},{$set:{
        Name:req.body.name,
    }});
    if(category){
        res.redirect('/product/category')
    }
} catch (error) {
    console.log(error.message);
}

}
module.exports={
    loadProductsPage,
    loadAddProduct,
    loadCategory,
    loadAddCategory,
    addCategory,
    loadSubCategory,
    loadAddSubCategory,
    unlistCategory,
    loadUnlistedCategory,
    addSubCategory,
    unlistSubCategory,
    loadUnlistedSubCategory,
    addProduct,
    loadProducts,
    loadDeletedProducts,
    deletedProducts,
    loadEditProduct,
    editProduct,
    loadEditCategory,
    editCategory
}