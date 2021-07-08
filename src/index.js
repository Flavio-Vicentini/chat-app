const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/message.js')
const {addUser,getUser,getUsersInRoom,removeUser} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')
const PORT = process.env.PORT || 3000

app.use(express.static(publicDirectoryPath))



io.on('connection', (socket)=> {    
    socket.on('join', (credentials, callback) => {
        const {error, user} = addUser({id: socket.id, ...credentials})
        if(error){
            return callback(error) 
        }
        const {username, room} = user
        socket.join(room)
        socket.emit('message', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(room).emit('message', generateMessage('Admin',`${username} has joined!`))
        io.to(room).emit('roomData',{
            room,
            users: getUsersInRoom(room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        if (filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }
        const { username,room } = getUser(socket.id)
        io.to(room).emit('message', generateMessage(username,message))
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const { username,room } = getUser(socket.id)
        io.to(room).emit('locationMessage', generateLocationMessage(username,`https://google.com/maps?q=${location.lat},${location.long}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(PORT,() => {
    console.log('Server is running on port',PORT)
})