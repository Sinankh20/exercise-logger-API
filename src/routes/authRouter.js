import { Router } from "express";
import jwt from "jsonwebtoken";
import { register, login, logout } from "../controllers/authController.js";
import requireLogin from "../utils/requireLogin.js";

const authRouter = Router();


/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new account
 *     description: |
 *       Creates a user with one empty starter routine ("My Routine"), then logs them in.
 *       Returns a JWT and also sets it as an httpOnly `jwt` cookie (valid 7 days).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Account created and logged in
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly `jwt` cookie containing the same token
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing name or email, password not 8 to 72 characters, or email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingFields:
 *                 summary: Missing name or email
 *                 value: { error: "email and name are required" }
 *               emailTaken:
 *                 summary: Email already registered
 *                 value: { error: "User already exists with this email address." }
 *               badPassword:
 *                 summary: Password length
 *                 value: { error: "Password must be 8 to 72 characters" }
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// register route
authRouter.post("/register", register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in
 *     description: |
 *       Checks the email and password. On success returns a JWT and sets it as an httpOnly `jwt` cookie.
 *       Copy the `token` and use the **Authorize** button to call protected routes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       201:
 *         description: Logged in
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly `jwt` cookie containing the same token
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Wrong email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example: { error: "Invalid Email or Password" }
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// login route
authRouter.post("/login", login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out
 *     description: |
 *       Clears the `jwt` cookie. The token itself stays valid until it expires,
 *       so the frontend should also delete any token it stored.
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 */
// logout route
authRouter.post("/logout", logout);

export { authRouter };