
//connecting database, named database as freshbay
require("dotenv").config()
const mongoose=require("mongoose");
mongoose.connect(process.env.mongoconnect).then(()=>{console.log("DB Connected");}).catch((err)=>{console.log("DB Not connected",err);})

const express=require("express")
const nocache=require("nocache")
const cors = require('cors');
app.use(cors());
const axios=require("axios")
const Swal=require("sweetalert2")



const app=express()
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(nocache())
const path=require("path")
// app.use("/css",express.static(path.join(__dirname,"public/css")))
// app.use("/img",express.static(path.join(__dirname,"public/img")))
// app.use("/js",express.static(path.join(__dirname,"public/js")))
// app.use("/lib",express.static(path.join(__dirname,"public/lib")))
// app.use("/scss",express.static(path.join(__dirname,"public/scss")))
// app.use('/assets',express.static(path.join(__dirname,"public/adminAssets")))
app.use(express.static('public'));




//customer route
const customerRoute=require("./routes/customerRoute")
app.use('/',customerRoute)

//admin route
const adminRoute=require("./routes/adminRoute")
app.use('/admin',adminRoute)

//product route
const productRoute=require("./routes/productRoute")
app.use('/product',productRoute)

//address route
const addressRoute=require("./routes/addressRoute")
app.use('/address',addressRoute)

//order route
const orderRoute=require("./routes/orderRoute")
app.use('/order',orderRoute)

//order route
const walletRoute=require("./routes/walletRoute")
app.use('/wallet',walletRoute)

// error handling, keep bottom of all routes
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.redirect('/error');
});

const PORT=process.env.PORT||3000
app.listen(PORT,()=>{console.log("Running");})
