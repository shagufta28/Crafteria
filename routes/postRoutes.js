const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const { createPost, getPosts, likePost, commentPost, deletePost , getPostsByUserId } = require("../controllers/postController");

const router = express.Router();

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Directory for uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Routes
router.route("/")
  .get(protect, getPosts)
  .post(protect, upload.single("image"), createPost);

router.route("/:id")
  .delete(protect, deletePost);

router.route("/:id/like").put(protect, likePost);
router.route("/:id/comment").post(protect, commentPost);
router.route("/user/:userId").get(protect, getPostsByUserId);


module.exports = router;
