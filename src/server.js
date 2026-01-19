require("dotenv").config();
const http =require("http");
const {Server}= require("socket.io")
const connectDB = require("./config/database");
const app = require("./app");
const notifications = require("./model/notifications");

const PORT = process.env.PORT || 5001;

//track online users
const onlineUsers ={};


connectDB()
  .then(() => {
    console.log("Database connection established..!!");

    //HTTP Server for socket.io

    const server =http.createServer(app);
    const io = new Server(server,{
     cors:{origin: process.env.CLIENT_URL, credentials:true},
    });
    io.on("connection",(socket)=>{
      console.log("User connected",socket.id);

      //client sends userId after login

      socket.on("register",(userId)=>{
        onlineUsers[userId]=socket;
        socket.userId =userId;
      });
      socket.on("disconnect",()=>{
        if(socket.userId) delete onlineUsers[socket.userId];
        console.log("User disconnected",socket.userId);
        
      });
      
    });

    //Helper to emit notifications

    global.SendNotificationRealTime =(notification)=>{
      const socket =onlineUsers[notification.userId.toString()];
      if(socket && socket.connected){
        socket.emit("notification",notification)
      }
    };

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected..!!", err);
  });
