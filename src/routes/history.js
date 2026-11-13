import { Router } from "express";
import {prisma} from "../db.js";
import fail from "../utils/fail.js";
import requireLogin from "../utils/requireLogin.js";

const router = Router();

router.use(requireLogin);


const toItem = (row) => ({ ...row.data, id: row.id });

/**
 * @openapi
 * /api/history:
 *   get:
 *     tags: [History]
 *     summary: Get workout history
 *     description: Returns every finished workout of the signed-in user, newest date first.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved workouts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workout'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// newest first
router.get("/", async (req, res) => {
  const rows = await prisma.workout.findMany({
    where: { userId: req.userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  res.json(rows.map(toItem));
});

/**
 * @openapi
 * /api/history:
 *   post:
 *     tags: [History]
 *     summary: Save a finished workout
 *     description: |
 *       Stores one finished workout. `title` (string) and `date` (`YYYY-MM-DD`) are required;
 *       everything else in the object is saved unchanged.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutInput'
 *     responses:
 *       201:
 *         description: Saved. Returns the workout with its database `id`.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workout'
 *       400:
 *         description: Missing title or badly formatted date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example: { error: "Send the workout object (it needs a title and a date like 2026-11-12)" }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// body = the `thisWorkout` object from handleFinish
router.post("/", async (req, res) => {
  const w = req.body;
  if (
    !w ||
    typeof w.title !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(w.date)
  ) {
    throw fail(
      400,
      "Send the workout object (it needs a title and a date like 2026-11-12)",
    );
  }
  const row = await prisma.workout.create({
    data: { userId: req.userId, date: w.date, data: w },
  });
  res.status(201).json(toItem(row));
});

export default router;
