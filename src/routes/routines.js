import { Router } from "express";
import {prisma} from "../db.js";
import fail from "../utils/fail.js";
import requireLogin from "../utils/requireLogin.js";

const router = Router();

router.use(requireLogin);

/**
 * @openapi
 * /api/routines:
 *   get:
 *     tags: [Routines]
 *     summary: Get all routines
 *     description: Returns the signed-in user's whole routines array.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The routines array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Routine'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { routines: true } });
  res.json(user.routines);
});

/**
 * @openapi
 * /api/routines:
 *   put:
 *     tags: [Routines]
 *     summary: Replace all routines
 *     description: |
 *       Replaces the user's **entire** routines array with the one sent.
 *       Send the full list every time (add, edit and delete are all done this way).
 *       Sending `[]` deletes every routine.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Routine'
 *     responses:
 *       200:
 *         description: Saved. Returns the same array that was sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Routine'
 *       400:
 *         description: Body is not an array
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example: { error: "Send the full routines array" }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/", async (req, res) => {
  if (!Array.isArray(req.body)) throw fail(400, "Send the full routines array");
  await prisma.user.update({ where: { id: req.userId }, data: { routines: req.body } });
  res.json(req.body);
});

export default router;