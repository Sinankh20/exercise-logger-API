import jwt from "jsonwebtoken"

export default function generateToken (user,res) {
   const token=jwt.sign({}, process.env.JWT_SECRET, {
    subject: user.id,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  res.cookie("jwt",token,{
    httpOnly:true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: (1000 * 60 *60 *24)* 7 // in ms
  })
  return token
};
