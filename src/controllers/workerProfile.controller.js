const WorkerProfile = require("../model/workerProfile");

exports.upsertWorkerProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await WorkerProfile.findOneAndUpdate(
      { userId },
      { $set: req.body },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      profile
    });
  } catch (err) {
    console.error("Worker profile upsert failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getWorkerProfile = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({
      userId: req.user._id
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (err) {
    console.error("Fetch worker profile failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.searchWorkers =async(req,res)=>{
    try {
        const {profession, location}=req.query

        const query ={};
        if(profession) query.profession = new RegExp(profession,"i");
        if(location){
            query.$or =[
                {city: new RegExp(location,"i")},
                {district: new RegExp(location,"i")},
                {state: new RegExp(location,"i")},
            ];
        }

        const workers = await WorkerProfile.find(query)
        .populate("userId", "name profilePic",);
        res.json(workers)

    }catch(err){
        res.status(500).json({message:"Search failed"})

    }
}