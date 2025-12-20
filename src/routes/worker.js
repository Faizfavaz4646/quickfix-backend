const express = require("express");
const WorkerProfile = require("../model/workerProfile");
const userAuth = require("../middlewares/auth");
const roleAuth = require("../middlewares/role");
const {validateWorkerProfileData} = require("../utils/validation")

const workerProfileRouter = express.Router();

//create & update profile
workerProfileRouter.post(
  "/profile",
  userAuth,
  roleAuth(["worker"]),
  async (req, res) => {
    try {
        const isValid =validateWorkerProfileData(req.body)
        if(!isValid){
            return res.status(400).json({
                message:"Invalid fields in worker profile data"
            })
        }
      const profile = await WorkerProfile.findOneAndUpdate(
        { userId: req.user._id },
        { ...req.body, userId: req.user._id },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      res.status(200).json(profile);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);



workerProfileRouter.get(
  "/profile",
  userAuth,
  roleAuth(["worker"]),
  async (req, res) => {
    try {
      const profile = await WorkerProfile.findOne({
        userId: req.user._id,
      });

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.status(200).json(profile);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = workerProfileRouter;
