const user = require("../db/models/user")

const signup = async (req, res, next) => {
   const body = req.body;

   if(!['1', '2'].includes(body.userType)){
    return res.status(400).json({
        status: 'fail',
        message: "Invalid user Types"
    });
   }

   const response = await user.findOne({email: body.email});

   if(response){
    return res.status(409).json({
        status: "fail",
        message: "User Already Exists"
    });
   }

   const newUser = await user.create({
    userType: body.userType,
    name: body.name,
    email: body.email,
   })

   if(!newUser){
    return res.status(400).json({
        status: "fail",
        message: "failed to create the user",
    });
   }

   return res.status(201).json({
        status: "success",
        message: 'User Created Successfully',
        data: newUser
   })
}

module.exports = { signup }; 