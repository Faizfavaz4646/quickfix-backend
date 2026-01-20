const mongoose = require("mongoose");


const commentSchema= new mongoose.schema(
    {
        postId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Post",
        required:true,
        },
        userId: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        text: {
            type:String,
            required:true,
        },
    },
{timestamps:true}
);
module.exports=mongoose.model("Comment",commentSchema)