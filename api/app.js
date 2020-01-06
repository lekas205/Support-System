const express = require(`express`);
const mongoose = require(`mongoose`);
const app = express();
const path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(server);
const socket =require('socket.io')

// Models
const Chat = require('./model/chat'),
      User = require('./model/register'),
      RandomStr = require('../validation/randomString');

//This has the db URL
const { getSecrets } = require('./secret');

//Db connection
mongoose
    .connect(
        getSecrets('dbUrl'),
        { useNewUrlParser: true
        })
    .then(
        () => {
        console.log('Connected to mongoDB');
        },
        (err) => console.log('Error connecting to mongoDB', err)
    );

// Routes
app
    .use(express.static(path.join(__dirname,'public')))
    .get(`/admin`, (req,res)=>{
        res.sendfile('admin.html')
    })

var server=app.listen(3000,()=>{
    console.log(`app working on port 3000`);
})



// Socket chats
var io= socket(server);
var storeUsers=[];
// on connection
io.on('connection', function(socket) {
    
    // when user has already register
    socket.on('registered', async (data)=>{
        let user = await User.findOne({username: data.username});
        if(user){
            socket.join(data.username);
            socket.username = data.username;
            socket.uniqueId = user.uniqueString;
            storeUsers.push({username:data.username, uniqueId :user.uniqueString});
            
        }
     
    })
    socket.on('return', async (data)=>{
        io.sockets.emit('returned',data)
    })
    socket.on('subscribe', function(room) {
        console.log('joining room', room);
        socket.join(room);
        
        
    });

    // registration 
    socket.on('new user', (data, callback)=>{
        if(storeUsers.some(user => user.username === data.username)){
            callback(false)
        }else{
            
            const string = RandomStr(10)
            socket.username = data.username;
            socket.uniqueId = string;
            storeUsers.push({username:socket.username, uniqueId :socket.uniqueId});
            if(data.domain == 'http://localhost:3000/'){
               // saving user data to the DB
                var user = new User({username: data.username, uniqueString: string})
            }else{
                var user = new User({username: data.username, uniqueString: string, status: '1'})
            }

            user.save();
            callback(true);
        }
    })

    // confirming client status
    socket.on('confirmStatus', async (data, callback)=>{
        let confirmStatus = await Chat.findOne({username: data.clientId});
        if(confirmStatus){
            let activeAdmin = confirmStatus.adminString;
            /// it to check if an admin that is crrenly engaging a 
            //customer is still online
            let adminOnline = storeUsers.find(function(contact) {
                return contact.uniqueId === activeAdmin;
            });
            if(activeAdmin === 'unattended'){
                Chat.findOneAndUpdate({username: data.clientId},{$set : {adminString: socket.uniqueId}})
                .then(data => console.log('accepted.....'))
                return callback(true)
            }
            else if(socket.uniqueId === activeAdmin){
            return callback(true)
            }
            else if(!adminOnline && socket.uniqueId !== activeAdmin ){
                Chat.findOneAndUpdate({username: data.clientId},{$set : {adminString: socket.uniqueId}})
                .then(data => console.log('accepted______'))
                return callback(true)
            }else{
                console.log('hello');
                
                return callback(false)
            }
            
        }else{
            callback(false);
        }
    })

    // Clients message to the admin
    socket.on('send_admin',async (data)=>{
        let d = new Date();
        let date = d.toLocaleDateString();
        let time = d.toLocaleTimeString();
        let conversation =  await Chat.findOne({senderString: socket.uniqueId });
        // packaging the message and its details in an object
        let messageInfo = {clientName: socket.username, clientMessage: data.msg, date, time}
        
        if(!conversation){
            let chat = new Chat({username: socket.username, senderString: socket.uniqueId, chatMessages:[messageInfo]});
            chat.save()
        }else{
            await Chat.findOneAndUpdate({senderString: socket.uniqueId},{'$push': {chatMessages:messageInfo}},{new: true})
            .then(data =>{console.log('message sent');
            })
        }
        io.sockets.emit('send_admins',data)
    });

    // Admin message to the client
    socket.on('send_clients',async (data)=>{
        let conversation = await Chat.findOne({username:data.clientName});
        if(conversation){
            conversation.chatMessages.forEach(e =>{
                if(e.responded === undefined){ 
                    let unattended = e,
                        getIndex = conversation.chatMessages.indexOf(e)
                    conversation.chatMessages.splice(getIndex, 1);

                    //assigning admin id to unresponded chat
                    unattended.responded = socket.uniqueId;
                    conversation.chatMessages[getIndex] = unattended;
                }
            })
        }
        
        // saving admin's message to the DB
        let d = new Date();
        let date = d.toLocaleDateString();
        let time = d.toLocaleTimeString();
        // packaging the message and its details in an object
        let messageInfo = {responded: socket.uniqueId, adminMessage: data.msg, date, time};
        conversation.chatMessages.push(messageInfo);
        conversation.save();

        // sending admin message to client
        io.sockets.to(data.clientName).emit('send_cmsg',data.msg);
    });

    // fetching clients chats for the admin
    socket.on('fetchChats', async (data, callback) =>{
        let getChats = await Chat.findOne({username: data.clientId});
        let conversation = []

        if(getChats){
            getChats.chatMessages.forEach(e=>{
                if(e.responded === socket.uniqueId ||  e.responded === undefined){
                    conversation.push(e)
                }
            })
            callback(conversation)
            console.log(conversation);
            
        }else{
            callback(false)
        }
    })

    // fetching clients chats with admin for client
    socket.on('fetchallChats', async (data, callback) =>{
        let getChats = await Chat.findOne({username: data.clientId});
 
        if(getChats){
            let conversation = getChats.chatMessages
            callback(conversation)
        }else{
            callback(false)
        }
    })

    // fetching amdin chat with client onload
    socket.on('fetchAdminChats', async (data, callback) =>{
        let getChats = await Chat.findOne({username: data.clientName}),
            getAdminId = await User.findOne({username: data.adminName});
            getClients = await User.find({status: '0'});
            allClientsMame = [];
            clients = []
            
        if(getClients){
            getClients.forEach(elm =>{
                allClientsMame.push(elm.username)
            })
        }
        allClientsMame.forEach (elm =>{        
            let clientOnline = storeUsers.find(function(contact) {
                return contact.username === elm;
            });
           
            if(clientOnline){
               clients.push({username: elm, status: 'online'})
            }else{
                clients.push({username: elm, status: 'offline'})
            }
            
        })
      
        // this is to recover the chat history of last client 
        if(getClients){
            datas = {clients}
            if(getChats){
                let conversation = getChats.chatMessages.filter(item => item.responded === getAdminId.uniqueString || item.responded === undefined)
                datas = {conversation, clients}
            }
           
            callback(datas)
        }else{
            callback(false)
        }
    })

    // when a user is typing
    socket.on('typing', (data) =>{
        socket.broadcast.emit('typing', data)
    })
    
    // when a user is typing
    socket.on('clearTyping', (data) =>{
        socket.broadcast.emit('clearTyping', data)
    })
    // disconnexted
    socket.on('disconnect', function () {
        console.log(socket.username);
        
        storeUsers.forEach(elm =>{
            if(elm.username === socket.username){ 
                
               var getIndex = storeUsers.indexOf(elm)
                storeUsers.splice(getIndex, 1);
            }
            
        })  
        io.sockets.emit('loggedout',{username: socket.username})
    });
})