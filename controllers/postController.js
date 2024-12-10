const { default: mongoose } = require("mongoose");
const cloudinary = require('cloudinary').v2;
const Post = require("../models/Post");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// Create a new post
exports.createPost = asyncHandler(async (req, res) => {
  const { caption, hobby } = req.body;
  const image = req.file ? req.file.path : null;

  if (!caption || !image) {
    return res.status(400).json({ message: "Caption and image are required." });
  }

  // Upload image to Cloudinary
  try {
    const cloudinaryResponse = await cloudinary.uploader.upload(image, {
      folder: 'posts', // You can change this to organize the images in Cloudinary
    });

    // Save the post with the Cloudinary URL
    const newPost = new Post({
      caption,
      hobby,
      image: cloudinaryResponse.secure_url, // Use the URL returned by Cloudinary
      user: req.user.id,
    });

    await newPost.save();
    res.status(201).json({
      post: newPost,
      imageUrl: cloudinaryResponse.secure_url, // Ensure the image URL is part of the response
    });
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

// Get all posts
exports.getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate("user", "name profilePicture")
    .populate("comments.user", "name profilePicture")
    .sort({ createdAt: -1 });

  res.status(200).json(posts);
});

// Like or unlike a post
exports.likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: "Post not found." });
  }

  const isLiked = post.likes.includes(req.user.id);

  if (isLiked) {
    post.likes = post.likes.filter((userId) => userId.toString() !== req.user.id);
  } else {
    post.likes.push(req.user.id);
  }

  await post.save();
  res.status(200).json({ likes: post.likes.length, liked: !isLiked });
});

// Add a comment to a post
exports.commentPost = asyncHandler(async (req, res) => {
  const { comment } = req.body;

  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found." });
  }

  const newComment = {
    user: req.user.id,
    comment,
  };

  post.comments.push(newComment);
  await post.save();

  const updatedPost = await Post.findById(req.params.id)
    .populate("comments.user", "name profilePicture");

  res.status(200).json({ comments: updatedPost.comments });
});

// Delete a post
exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: "Post not found." });
  }

  if (post.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "You can only delete your own posts." });
  }

  await post.remove();
  res.status(200).json({ message: "Post deleted successfully." });
});

// Get posts by user ID
exports.getPostsByUserId = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Ensure the userId is valid
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  try {
    // Find all posts associated with the given user ID
    const posts = await Post.find({ user: userId })
      .populate("user", "name profilePicture")
      .populate("comments.user", "name profilePicture")
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: "No posts found for this user." });
    }

    // Log the fetched posts for debugging
    console.log(posts);

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});


