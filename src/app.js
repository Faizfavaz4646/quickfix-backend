require("dotenv").config();
const connectDB = require("./config/database");
const express = require("express");
const cors =require("cors")
const app = express()
const cookieParser = require("cookie-parser");

app.use(cookieParser()); 


app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json())

const authRouter= require("./routes/auth");
const ClientProfileRouter = require("./routes/client")

app.use("/auth",authRouter)
app.use("/client",ClientProfileRouter)


connectDB()
.then(()=>{
    console.log("database connection established..!!");

    app.listen(process.env.PORT || 5001,()=>{
   console.log(`Server running on port ${process.env.PORT || 5001}`)
    
})    
})
.catch((err)=>{
    console.error("Database cannot be connected..!!",err);
    
})
