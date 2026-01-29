const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
require('dotenv').config();

// Ensure the path to your User model is correct
const User = require('../model/user'); 

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    const adminEmail = process.env.INIT_ADMIN_EMAIL;
    const adminPassword = process.env.INIT_ADMIN_PASSWORD;

    console.log("1. Checking .env variables...");
    if (!mongoUri || !adminEmail || !adminPassword) {
      throw new Error("Missing .env variables! Check MONGO_URI and INIT_ADMIN_PASSWORD");
    }

    console.log("2. Attempting to connect to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    console.log("3. Checking if Admin already exists...");
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log("⚠️ Admin already exists with email:", adminExists.emailId);
      process.exit(0);
    }

    console.log("4. Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    console.log("5. Creating admin object...");
    const adminUser = new User({
      name: 'Admin', // Changed from 'System Administrator' to stay under 16 chars
      emailId: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });

    console.log("6. Saving to database...");
    const result = await adminUser.save();
    
    console.log("-----------------------------------------");
    console.log(" SUCCESS! ADMIN CREATED");
    console.log("ID:", result._id);
    console.log("Email:", adminEmail);
    console.log("-----------------------------------------");

  } catch (error) {
    console.error(" SEEDING FAILED AT STEP:", error.message);
  } finally {
    console.log("7. Closing connection...");
    await mongoose.connection.close();
    process.exit();
  }
};

seedAdmin();