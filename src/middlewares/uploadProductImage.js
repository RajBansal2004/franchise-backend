const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({

 destination:(req,file,cb)=>{
   cb(null,"uploads/products");
 },

 filename:(req,file,cb)=>{
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null,uniqueName);
  }

});

const fileFilter = (req,file,cb)=>{

 const allowed = ["image/png","image/jpeg","image/jpg","image/webp"];

 if(allowed.includes(file.mimetype)){
   cb(null,true);
 }else{
   cb(new Error("Only images allowed"),false);
 }

};

const upload = multer({ storage, fileFilter });

module.exports = upload;