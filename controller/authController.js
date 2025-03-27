const user = require("../db/models/user")
const bcrypt = require('bcrypt');

const signup = async (req, res, next) => {
    const body = req.body;

    if (!['1', '2'].includes(body.userType)) {
        return res.status(400).json({
            status: 'fail',
            message: "Invalid user Types"
        });
    }

    const response = await user.findOne({
        where: {
            email: body.email    
        } 
    });

    console.log(response);
    
    if (response) {
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

    if (!newUser) {
        return res.status(400).json({
            status: "fail",
            message: "failed to create the user",
        });
    }

    verificationToken = await Math.floor(100000 + Math.random() * 900000).toString()

    newUser.verificationToken = verificationToken;
    newUser.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000

    const verify = newUser.save();

    if (!verify) {
        res.status(400).json({ status: "fail", message: "Internal Server Error" });
    }


    return res.status(201).json({
        status: "success",
        message: 'User Created Successfully',
        data: newUser
    })
}

const setPassword = async (req, res) => {
    const { id, password } = req.body;

    const result = await user.findOne({ id })

    if (!result) {
        console.error('set-Password Error: ');
        res.status(500).json({ message: 'Internal Server error' })
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    result.password = hashedPassword;
    result.verificationToken = undefined;
    result.verificationTokenExpiry = undefined;

    const response = await result.save();

    if (response) {
        res.status(200).json({ success: true, message: "password set Successful " });
    } else {
        res.status(400).json({ success: true, message: "Internal Server Error" });
    }
}

const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        const result = await user.findOne({ email: email });

        if (result) {
            const passwordMatch = await bcrypt.compare(password, result.password);

            if (passwordMatch) {
                const verificationToken = await Math.floor(10000 + Math.random() * 900000).toString()
                const response = await user.findByPk(result.id)

                if (response) {
                    const newData = user.update({
                        verificationToken: verificationToken,
                        verificationTokenExpiry: Date.now() + 24 * 60 * 60 * 1000
                    })
                    if (newData) {
                        res.status(200).json({
                            message: "Login Successful",
                            success: true,
                        })
                    } else {
                        res.status(500).json({ message: 'Server Error ' })
                        console.error('Email verification Error')
                    }
                } else {
                    res.status(500).json({ message: 'Server Error ' })
                    console.error('Email verification Error')
                }
            } else {
                res.status(403).json({ message: "Invalid Credentials 1" })
            }
        } else {
            res.status(403).json({ message: "Invalid Credentials 2" })
        }
    } catch (error) {
        console.error('Login Error : ', error);
        res.status(500).json({ message: 'Server error' })
    }
}

module.exports = { signup, login, setPassword }; 