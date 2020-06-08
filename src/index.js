import express from 'express'
import bodyParser from 'body-parser'
import socket from 'socket.io'
import cors from 'cors'
import multer from 'multer'
import morgan from 'morgan'
import fs from 'fs'
import path from 'path'

let channels = []

const app = express()
app.use(cors('*'))
app.use(bodyParser.json())
app.use(morgan('dev'))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads')
  },
  filename: (req, file, cb) => {
    // const uniqueSuffix = Math.round(Math.random() * 1e9)
    // cb(null, file.originalname + '-' + uniqueSuffix)
    cb(null, file.originalname)
  },
})

const upload = multer({
  storage: storage,
  limits: {
    files: 5,
    // fieldSize: 2 * 1024 * 1024, // 2 MB (max file size)
  },
  fileFilter: (req, file, cb) => {
    // allow images only
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image are allowed.'), false)
    }
    cb(null, true)
  },
})

app.use((req, res, next) => {
  req.io = io
  next()
})

app.get('/', (req, res) => {
  res.send('hello from the server')
})

app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const image = req.file
    if (!image) {
      res.status(400).send({
        status: false,
        data: 'No file is selected.',
      })
    } else {
      res.send({
        status: true,
        message: 'File is uploaded.',
        data: {
          name: image.originalname,
          mimetype: image.mimetype,
          size: image.size,
        },
      })
    }
  } catch (error) {
    res.status(500).send(error)
  }
})

app.get('/get-image', (req, res) => {
  const imageName = req.query.imageName
  res.sendFile(path.join(__dirname, '../uploads/' + imageName))
})

app.post('/delete-images', (req, res) => {
  const images = req.body.images

  images.forEach((image) => {
    fs.stat('./server/upload/my.csv', function (err, stats) {
      if (err) {
        return console.error(err)
      }

      fs.unlink(`./uploads/${image}`, (err) => {
        if (err) {
          throw err
        } else {
          return
          console.log('Successfully deleted files.')
        }
      })
    })
  })

  return true
})

const server = app.listen(process.env.PORT || 8000, () => {
  console.log('Server is running on port', server.address().port)
})

const io = socket(server)

io.on('connection', (socket) => {
  socket.on('connect', (channelId) => {
    io.emit('CONNECTION', 'hello')
    console.log(channelId)
  })

  socket.on('CREATE_CHANNEL', (data) => {
    if (!data.channelId) return null

    const channel = {
      channel_id: data.channelId,
      users: [data.username],
    }

    socket.join(data.channelId, () => {})

    channels.push(channel)
  })

  socket.on('JOIN_CHANNEL', (channelId) => {
    if (!channelId) return null

    const channel = channels.find((channel) => channel.channel_id === channelId)

    // if channel has already 2 connections
    if (channel.users.length > 1) {
      throw new Error('Channel is full')
    }

    socket.join(channelId, () => {
      socket.emit('connect', channelId)
    })
  })

  socket.on('LEAVE_CHANNEL', (channelId) => {
    io.to(channelId).emit('LEAVE_CHANNEL', true)
  })

  socket.on('SEND_IMAGE', (data) => {
    io.to(data.channel_id).emit('SEND_IMAGE', data.image)
  })

  socket.on('disconnect', () => {
    io.emit('disconnect', true)
  })
})
