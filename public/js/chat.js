const socket = io()

//DOMelements
const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messageFormButton = messageForm.querySelector('button')
const sendLocationButton = document.querySelector('#send-location')
const messages = document.querySelector('#messages')
const sidebar = document.querySelector('#sidebar')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

//Sockets
socket.emit('join', {username,room}, (error) => {
    if (error){
        alert(error)
        location.href= '/'
    }
})

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (locationMessage) => {
    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('HH:mm')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData', ({room,users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    sidebar.innerHTML = html
})

//Listeners
messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    messageFormButton.setAttribute('disabled','disabled')
    const message = e.target.elements.message.value

    socket.emit('sendMessage',message, (error) => {
        messageFormButton.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()

        if (error){
            return console.log(error)
        }
        console.log('Message Delivered!')
    })
})

sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }
    sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition( (position) => {
        const location = {
            lat: position.coords.latitude,
            long: position.coords.longitude,
        }
        socket.emit('sendLocation',location, () => {
            console.log('Location shared!')
            sendLocationButton.removeAttribute('disabled')
        })
    })
})

//functions
const autoscroll = () => {
    const newMessage = messages.lastElementChild

    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin
    const visibleHeight = messages.offsetHeight
    const containerHeight = messages.scrollHeight
    const scrollOffSet = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffSet){
        messages.scrollTop = messages.scrollHeight
    }

}