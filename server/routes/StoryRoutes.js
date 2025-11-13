import express from 'express'
import { upload } from '../configs/multer.js'
import { protect } from '../middleware/auth.js'
import { addUserStory, getStories } from '../controllers/StoryController.js'
const stroyRouter = express.Router()

stroyRouter.post('/create',upload.single('media'),protect,addUserStory)
stroyRouter.get('/get',protect,getStories)


export default stroyRouter