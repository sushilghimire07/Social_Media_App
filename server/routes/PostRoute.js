import express from 'express'
import { upload } from '../configs/multer.js'
import { addPost, getFeedPost, likePost } from '../controllers/PostController.js'
import { protect } from '../middleware/auth.js'

const postRounter = express.Router()

postRounter.post('/add',upload.array('images',4),protect,addPost)
postRounter.get('/feed',protect,getFeedPost)
postRounter.get('/feed',protect,likePost
)


export default postRounter