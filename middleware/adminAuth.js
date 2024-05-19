

const isSession=async(req,res,next)=>{
    try {
    if(req.session.admin_id){
        next();
    }
    else{
        res.redirect('/admin')
    }
    
       
    } catch (error) {
      console.log(error.message);
    }
    }
    

    const noSession=async(req,res,next)=>{
    
        try {
          
            if(req.session.admin_id){
                res.redirect('/admin/adminHome')
                
            }else{
                
                next()
            }
    
    
        
    } catch (error) {
        console.log(error.message);
    }
    
    }
    
    module.exports={
        isSession,
        noSession
    }