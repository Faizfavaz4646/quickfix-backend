require("dotenv").config();
const connectDB = require("./config/database");
const app = require("./app");

const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => {
    console.log("Database connection established..!!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected..!!", err);
  });
