const path = require('path')
const { randomNumber }= require('../helpers/libs')
const fs = require('fs-extra')
const md5 = require('md5')
const { Image , Comment } = require('../models/index')
const sidebar = require('../helpers/sidebar')

const ctrl = {}

ctrl.index = async (req,res) =>{
    let viewModel = { image: {} , comments: {}}
    //con la siguiente consulta nos devuelve un valor null debido a que no tiene la extension del archivo
    //const image = await Image.findOne({filename: req.params.image_id})
    //para ello vamos a utilizar una expresion regular {$regex ... }
    const image = await Image.findOne({filename: {$regex: req.params.image_id}})
    if (image){
        image.views = image.views + 1
        viewModel.image = image
        await image.save()
        const comments = await Comment.find({image_id : image._id})
        viewModel.comments = comments
        viewModel = await sidebar(viewModel)
        console.log(image)
        console.log(comments)
        res.render('image', viewModel )    
    } else {
        res.redirect('/')
    }
}

ctrl.create = (req,res) =>{    
    const saveImage = async () =>{
        const imgUrl = randomNumber()
        const images = await Image.find({filename: imgUrl})
        if (images.length > 0){
            saveImage()
        } else{
            console.log(imgUrl)
            const imageTempPath = req.file.path
            const ext = path.extname(req.file.originalname).toLowerCase()
            const targetPath = path.resolve(`src/public/upload/${imgUrl}${ext}`)
        
            if (ext === '.png' || ext === '.jpg' || ext === 'jpeg' || ext === '.gif'){
                await fs.rename(imageTempPath, targetPath)
                const newImg = new Image({
                    title: req.body.title,
                    filename: imgUrl + ext,
                    description: req.body.description
                })
                const imageSaved = await newImg.save()
                res.redirect('/images/' + imgUrl)
        
            } else {
                await fs.unlink(imageTempPath)
                res.status(500).json({error: 'Extension de archivo no permitida'})
            }
        }

    }

    // validamos si existe la imagen en la bd, Nota: vamos a usar recursion
    saveImage()

    //console.log(req.file)  
}

ctrl.like = async (req,res) =>{
    const image = await Image.findOne({filename:{$regex: req.params.image_id}})
    if(image){
        image.likes = image.likes + 1
        await image.save()
        res.json({likes : image.likes})
    } else {
        res.status(500).json({error : 'Internal Error'})
    }   
}

ctrl.comment = async (req,res) =>{
    const image = await Image.findOne({filename:{$regex: req.params.image_id}})
    if(image){
        const newComment = new Comment(req.body)
        newComment.gravatar = md5(newComment.email)
        newComment.image_id = image._id
        console.log(newComment)
        await newComment.save()
        res.redirect('/images/'+ image.uniqueId)
        //res.send('comentario recibido')         
    } else {
        res.redirect('/')
    }
}

ctrl.remove = async (req,res) =>{
    //console.log(request.params.image_id)
    const image = await Image.findOne({
        filename : {$regex: req.params.image_id}
    })
    if(image){
        await fs.unlink(path.resolve('./src/public/upload/'+image.filename))
        await Comment.deleteOne({
            image_id : image._id
        })
        await image.remove()
        res.json(true)    
    }else{
        console.log('Imagen no encontrada, msg desde el controller')
    }
}

module.exports = ctrl