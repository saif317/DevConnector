// Dependencies
import express from 'express';

export const router = express.Router();

// @route     GET api/posts
// @desc      Test route
// @access    Public
router.get('/', (req, res) => res.send('Posts Route'));
