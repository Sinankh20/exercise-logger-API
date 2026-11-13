import jwt from "jsonwebtoken";
import fail from "./fail.js";

export default function requireLogin(req, _res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    next(fail(401, "Please log in"));
  }
}