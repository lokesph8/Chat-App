import bcrypt from "bcryptjs"
import User from "../models/User.js";
import { generateToken } from "../lib/utilis.js";
import cloudinary from "../lib/cloudinary.js";

//Sign up a new user
export const signup = async (req,res) => {
    const { fullName, email, password, bio } = req.body;

    try{
        if(!fullName || !email || !password || !bio){
            return res.status(400).json({success: false, message: "Missing Dteails"})
        }
        const user = await User.findOne({email});

        if(user){
            return res.status(400).json({success: false, message: "Account already exists"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        });

        const token = generateToken(newUser._id);

        res.status(201).json({success: true, userData: newUser, token, message: "Account created successfully"})
    } catch (error){
        console.log(error.message);
         res.status(500).json({success: false, message: error.message})
    }
}

//controller to login a user
export const login = async (req, res) => {
    try{
        const { email, password } = req.body;
        const userData = await User.findOne({email})

        if (!userData) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);

        if (!isPasswordCorrect){
            return res.status(400).json({success: false, message: "Invalid credentials"});
        }

        const token = generateToken(userData._id)

        res.json({success: true, userData, token, message: "Login successful"})
    } catch (error){
        console.log(error.message);
        res.status(500).json({success: false, message: error.message})
    }
}

//Controller to check if user is authenticated
export const checkAuth = (req, res)=> {
    res.json({success: true, user: req.user});
}

//controller to update user profile details
export const updateProfile = async (req,res) =>{
    try {
        const { profilePic, bio, fullName } = req.body;

        const userId = req.user._id;

       


        let updateUser;

        if(!profilePic){
            console.log("No profile picture uploaded, updating only text fields...");
            updateUser = await User.findByIdAndUpdate(userId, {bio, fullName}, {new: true});
        } else{
             console.log("Uploading image to Cloudinary...");
            const upload = await cloudinary.uploader.upload(profilePic);
             console.log("Cloudinary upload success:", upload.secure_url);

            updateUser = await User.findByIdAndUpdate(userId, {profilePic: upload.secure_url, bio, fullName}, {new: true});
        }
        console.log("MongoDB updated user:", updateUser);
        res.json({success: true, user: updateUser})

    } catch (error) {
        console.log("Error in updateProfile",error.message);
        res.status(500).json({success: false, message: error.message})
    }
}