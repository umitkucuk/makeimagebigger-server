import express from 'express'
import bodyParser from 'body-parser'
import socket from 'socket.io'
import cors from 'cors'

import channelRouter from './routes/channelRouter'

let channels = []

const app = express()
app.use(bodyParser.json())
app.use(cors())

// 192.168.1.101

const server = app.listen(4000, '0.0.0.0', () => {
  console.log('Server is running on port', server.address().port)
})

const io = socket(server)

app.use((req, res, next) => {
  req.io = io
  next()
})

app.get('/', (req, res) => {
  res.send('hello world')
})

app.use('/channel', channelRouter)

io.on('connection', socket => {
  socket.on('connect', channelId => {
    io.emit('CONNECTION', 'hello')
    console.log(channelId)
  })

  socket.on('CREATE_CHANNEL', data => {
    if (!data.channelId) return null

    const channel = {
      channel_id: data.channelId,
      users: [data.username],
    }

    socket.join(data.channelId, () => {})

    channels.push(channel)
  })

  socket.on('JOIN_CHANNEL', channelId => {
    if (!channelId) return null

    const channel = channels.find(channel => channel.channel_id === channelId)

    // if channel has already 2 connections
    if (channel.users.length > 1) {
      throw new Error('Channel is full')
    }

    socket.join(channelId, () => {
      socket.emit('connect', channelId)
    })
  })

  socket.on('LEAVE_CHANNEL', channelId => {
    console.log(channelId)
    io.to(channelId).emit('LEAVE_CHANNEL', true)
  })

  socket.on('SEND_IMAGE', data => {
    io.to(data.channel_id).emit('SEND_IMAGE', data.image)
  })

  socket.on('disconnect', () => {
    console.log('user disconnect')
    io.emit('disconnect', true)
  })
})
