
const roleAuth = (allowedRoles)=>{
    return (req , res , next)=>{
        if(!req.user){
            return res.status(401).json({error:"Unauthorized"})
        }
        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({message:"Access denied: insufficient permissions"})

        }
        next();
    };
};
module.exports =roleAuth;