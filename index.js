const multer = require("multer");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");
const { log } = require("console");

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/hhmart");

app.get("/", (req, res) => {
    res.send("Express is running");
});
// Image storage Engine
const storage = multer.diskStorage({
    destination: "./upload/images",
    filename: (req, file, cb) => {
        return cb(
            null,
            `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
        );
    },
});
const port = 4000;
const upload = multer({ storage });

app.use("/images", express.static("upload/images"));
// Creating upload endpoint
app.post("/upload", upload.single("product"), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`,
    });
});

// Schema for creating products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
});

app.post("/addProduct", async (req, res) => {
    let id;
    const { name, image, category, new_price, old_price } = req.body;
    let products = await Product.find({});
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    } else {
        id = 1;
    }
    const product = new Product({
        id: id,
        name,
        image,
        category,
        new_price,
        old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success: true,
        name,
    });
});

app.post("/removeProduct", async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("removed!");
    res.json({
        success: true,
    });
});

//Creating APIs for Getting all products
app.get("/allProducts", async (req, res) => {
    let products = await Product.find({});
    console.log("all products fetched");
    res.send(products);
});

// Schema for Users
const Users = mongoose.model("User", {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

// Creating endpoint for registering user
app.post("/signup", async (req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check)
        return res
            .status(400)
            .json({ success: false, error: "Existing User found" });
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const { name, email, password, cartData } = req.body;
    const user = new Users({
        name,
        email,
        password,
        cartData,
    });
    await user.save();

    const data = {
        user: {
            id: user.id,
        },
    };
    const token = jwt.sign(data, "secret_ecom");
    res.json({ success: true, token });
});

//Creating endpoint for user login
app.post("/login", async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id,
                },
            };
            const token = jwt.sign(data, "secret_ecom");
            res.json({ success: true, token });
        } else {
            res.json({ success: false, error: "Wrong Password" });
        }
    } else {
        res.json({ success: false, error: "Wrong Email Id" });
    }
});

// Creating endpoint for new Collection data
app.get("/newCollection", async (req, res) => {
    let products = await Product.find({});
    let newCollection = products.slice(1).slice(-8);
    console.log("NewCollection fetched");
    res.send(newCollection);
});
app.listen(4000);
