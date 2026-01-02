import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  return res.json({ balance: req.user.balance });
});

export default router;
