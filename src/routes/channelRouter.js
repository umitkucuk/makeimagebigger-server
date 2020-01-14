import express from 'express'
import uuid from 'uuid/v4'

const router = express.Router()

router.get('/', (req, res) => {
  res.send('GET channelRouter')
})

router.get('/create', (req, res) => {
  let channelName = uuid() // generates random id for channel name

  // req.io.emit('createChannel', channelName)

  res.send(channelName)
})

export default router
