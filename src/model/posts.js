const { ref } = require("joi");
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        authorId: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        authorRole: {
            type:String,
            enum:["client","worker"],
            required:true
        },
        postType: {
            type:String,
            enum:["job","portfolio"],
            required:true
        },
        title: {
            type:String,
            trim:true
        },
        content: {
            type:String,
            required :true
        },
        images:[
            {
            type:String,

        },

        ],
        likes:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            },
        ],
        
    },
    {timestamps:true}
);
module.exports = mongoose.model("Post",postSchema)