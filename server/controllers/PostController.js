import fs from 'fs'
import imagekit from '../configs/imageKit.js'
import Post from '../models/Post.js'
import User from '../models/User.js';

export const addPost = async (req,res)=> {

    try {

        const {userId} = req.auth();
        const {content,post_type} = req.body;
        const images = req.files

        let image_urls = []
        if(images && images.length){
            image_urls = await Promise.all(
                images.map(async (image)=>{
                    const fileBuffer = fs.readFileSync(image.path)
                    const response = await imagekit.upload({
                        file:fileBuffer,
                        fileName:image.originalname,
                        folder:"posts"
                    })
                    const url = imagekit.url({
                        path:response.filePath,
                        transformation:[
                            {width:'1280'},
                            {quality:'auto'},
                            {format:'webp'}
                        ]
                    })
                    return url
                })
            )
        }

        await Post.create({
            user:userId,
            content,
            image_urls,
            post_type
        })

        res.json({success:true,message:"Post created successfully"})
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


// get feed posts
export const getFeedPost = async(req,res)=>{
    try {
        const {userId} = req.auth()
        const user = await User.findById(userId)

        const userIds = [userId, ...user.connections, ...user.following]

        const posts = await Post.find({ user: { $in: userIds } })
        .populate('user')
        .sort({ createdAt:-1 })

        res.json({success:true, posts})
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


// like / unlike post
export const likePost = async(req,res)=>{
    try {
        const {userId} = req.auth()
        const {postId} = req.body;

        const post = await Post.findById(postId)

        if(!post) return res.json({success:false,message:"Post not found"})

        if(post.likes.includes(userId)){
            // unlike
            post.likes = post.likes.filter(u => u.toString() !== userId)
            await post.save()
            res.json({success:true,message:"Post Unliked"})
        }else{
            // like
            post.likes.push(userId)
            await post.save()
            res.json({success:true,message:"Post Liked"})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}
