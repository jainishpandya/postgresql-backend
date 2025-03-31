const crypto = require('crypto');
const { Sequelize } = require("sequelize");
const user = require("../db/models/user")
const bcrypt = require('bcrypt');
const { param } = require("../route/authRoute");
const { transporter, mailOptions } = require('../config/nodemailer');
const { verificationCode, setupaccount } = require('../templates/emailtemplates');
const { generateToken } = require('../jwt');

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

    const setPasswordToken = await crypto.randomBytes(32).toString("hex");

    newUser.setPasswordToken = setPasswordToken;
    newUser.setPasswordTokenExpiry = Date.now() + 24 * 60 * 60 * 1000

    const emailOptions = mailOptions(
        newUser.email,
        "Welcome to BookCircle",
        `Your Account is Created in BookCircle Application. Set Your Password to Login`,
        setupaccount(process.env.FRONTEND_URL + '/set-password?token='+ setPasswordToken)
    );
    transporter.sendMail(emailOptions, (error, info) => {
        if (error) {
            return console.log(`Error occured`, error);
        }
        console.log("Email Sent Successfully", info.response);
    })
    // verificationToken = await Math.floor(100000 + Math.random() * 900000).toString()

    // newUser.verificationToken = verificationToken;
    // newUser.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000

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
    try {
        const { password } = req.body;
        const token = req.query.token;


        const result = await user.findOne({
            where: {
                setPasswordToken: token,
                setPasswordTokenExpiry: {
                    [Sequelize.Op.gt]: Date.now()
                }
            }
        })

        if (!result) {
            console.error('set-Password Error: ');
            res.status(500).json({ message: 'Internal Server error' })
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        result.password = hashedPassword;
        result.setPasswordToken = null;
        result.setPasswordTokenExpiry = null;

        const response = await result.save();

        if (response) {
            res.status(200).json({ success: true, message: "password set Successful " });
        } else {
            res.status(400).json({ success: true, message: "Internal Server Error" });
        }

    } catch (error) {
        console.error('Set Password Error : ', error);
        res.status(500).json({ message: 'Server error' })
    }
}

function generate6DigitRandomNumber() {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        const result = await user.findOne({
            where: {
                email: email
            }
        });

        if (result) {
            const passwordMatch = await bcrypt.compare(password, result.password);

            if (passwordMatch) {
                const verificationToken = await generate6DigitRandomNumber().toString()
                const response = await user.findByPk(result.id)

                if (response) {
                    const newData = await user.update({
                        verificationToken: verificationToken,
                        verificationTokenExpiry: Date.now() + 24 * 60 * 60 * 1000
                    }, {
                        where: {
                            id: result.id
                        }
                    })
                    if (newData) {
                        const emailOptions = mailOptions(
                            response.email,
                            "Verification Code",
                            `Your verification token is ${verificationToken}`,
                            verificationCode(verificationToken)
                        );
                        transporter.sendMail(emailOptions, (error, info) => {
                            if (error) {
                                return console.log(`Error occured`, error);
                            }
                            console.log("Email Sent Successfully", info.response);
                        })
                        res.status(200).json({
                            message: "Login Successful",
                            userId: response.id,
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

const mfa = async (req, res) => {
    try {

        const { id, token } = req.body;

        const result = await user.findOne({
            where: {
                id: id,
                verificationToken: token,
                verificationTokenExpiry: {
                    [Sequelize.Op.gt]: Date.now()
                }
            }
        })
        if (result) {
            
            result.verificationToken = null;
            result.verificationTokenExpiry = null;
            
            const response = await result.save();
            
            if (response) {

                const payload = {
                    id: result.id,
                    email: result.email
                }
                const token = await generateToken(payload)

                res.status(200).json({ success: true, message: "Login Successful ", token: token, user: result });
            } else {
                res.status(400).json({ success: true, message: "Internal Server Error" });
            }
        } else {
            res.status(400).json({ success: true, message: "incorrect code" });
        }

    } catch (error) {
        console.error('mfa Error : ', error);
        res.status(500).json({ message: 'Server error' })
    }
}


module.exports = { signup, login, setPassword, mfa }; 