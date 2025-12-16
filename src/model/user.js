const mongoose = require("mongoose");

const validator = require("validator");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken")

const userSchema = new mongoose.Schema({

    name :{
        type:String,
        required:true,
        minLength:4,
        maxLength:16,

    },
    emailId :{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        validate: {
            validator(value){
                if(!validator.isEmail(value)){
                    throw new Error("Invalid Email address" + value)
                }
            }
        }

    },
    password : {
        type:String,
        required:true,
        minLength:8,
        maxLength:64
    },
    role:{
        type :String,
        required : true,
        enum: ['client', 'worker', 'admin'], 
         default: 'client',
    },
      status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  }

},{timestamps:true})

userSchema.methods.validatePassword = async function(passwordInputByUser){
    const user =this;
    const passwordHash = user.password
    const isPasswordValid = await bcrypt.compare(passwordInputByUser,passwordHash)
    return isPasswordValid

}
userSchema.methods.getJwt = async function (){
    const user = this;
    const token = await jwt.sign({_id:user._id},process.env.JWT_SECRET,{expiresIn :process.env.JWT_EXPIRES_IN})
return token


}
module.exports = mongoose.model("User",userSchema);