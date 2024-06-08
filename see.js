
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/Product Images"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, 'cropped-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ storage: storage });
  
  product_route.post('/upload-cropped-image', upload.single('croppedImage'), (req, res) => {
    res.json({ filePath: `/public/Product Images/${req.file.filename} `});
  });
  
  product_route.get("/", productController.loadProducts);
  product_route.get("/addProduct", productController.loadAddProduct);
  product_route.get("/checkAlready",productController.checkAlready)
  product_route.post("/addProduct", upload.array("images"), productController.addProduct);