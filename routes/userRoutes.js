const express = require("express");
const { updateProfile, followUser, getProfile , isFollowing} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/profile").get(protect, getProfile).put(protect, updateProfile);
router.route("/:id/follow").put(protect, followUser);
router.route("/:id/isFollowing").get(protect, isFollowing);

module.exports = router;
