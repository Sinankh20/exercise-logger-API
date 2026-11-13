import bcrypt from "bcryptjs";
import {prisma} from "../db.js"; 
import generateToken from "../utils/generateToken.js";
import fail from "../utils/fail.js";

// helpers
const text = (item) => (typeof item === "string" ? item.trim() : "");
const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
});

// register user
const register = async (req, res) => {
  const { password } = req.body ?? {};
  const email = text(req.body?.email).toLowerCase();
  const name = text(req.body?.name);

  // checks
  if (!email || !name) throw fail(400, "email and name are required");

  const userExists = await prisma.user.findUnique({
    where: { email: email },
  });
  if (userExists) {
    return res
      .status(400)
      .json({ error: "User already exists with this email address." });
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 72
  ) {
    throw fail(400, "Password must be 8 to 72 characters");
  }

  // create first routine
  const firstRoutine = {
    id: `routine-${Date.now()}`,
    name: "My Routine",
    isTemplate: true,
    workouts: [],
  };

  // hashing password
  const salt = await bcrypt.genSalt(10);
  const passwordHashed = await bcrypt.hash(password, salt);

  // user create
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: passwordHashed,
      routines: [firstRoutine],
    },
  });
  // token generation
  const token = generateToken(user, res);
  res.status(201).json({ token: token, user: publicUser(user) });
};

// login user
const login = async (req, res) => {
  const email = text(req.body?.email).toLowerCase();

  // check user exist
  const user = await prisma.user.findUnique({
    where: { email: email },
  });
  if (!user) {
    console.log("hello")
    throw fail(401, "Invalid Email or Password");
  }

  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  // password validation
  const isPassValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPassValid) {
    console.log("hello")
    throw fail(401, "Invalid Email or Password");
  }
  // token generation
  const token = generateToken(user, res);
  res.status(201).json({ token: token, user: publicUser(user) });
};

const logout = async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({
    status: "success",
    message: "Logged out",
  });
};

export {
  register,
  login,
  logout,
};