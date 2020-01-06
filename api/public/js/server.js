let socket = io('localhost:3000'),
    storeMsg=[];

    // this is for div holding the regitration form
var hold= document.getElementById('user'),
      // this is for div holding the chat platform
    chatHold=document.getElementById('chat'),
      // this is to display error message just incase
    inval=  document.getElementById('error');

//onload
$(document).ready(()=>{
  let user = localStorage.getItem('admin');
      activeClient = localStorage.getItem('activeClient');
  if(user){
    hold.style.display='none';
    chatHold.style.display='block';
    socket.emit('registered',{username: user});
    socket.emit('fetchAdminChats', {adminName: user, clientName: activeClient}, (data)=>{
      console.log(data);
      
      if(data.conversation){
        console.log(data);
        
        data.conversation.forEach(elm =>{ 
          if(elm.hasOwnProperty('clientName')){
            $('#display').append(`
            <div class="row no-gutters" >
              <div class="col-md-3 offset-md-9">
                <div class="chat-bubble">
                  ${elm.clientMessage}
                </div>
              </div>
            </div>
          `)
          }else{
            $('#display').append(`
              <div class="row no-gutters">
                <div class="col-md-3">
                  <div class="chat-bubble">
                    ${elm.adminMessage}
                  </div>
                </div>
              </div>
            `)
          }
        })
      }
      if(data.clients){
        data.clients.forEach(elm => {
          storeMsg.push({username: elm.username, messageNo:0, status: elm.status});
          $('#clients-chats').append(`
          <div class="friend-drawer friend-drawer--onhover" id="displays">
            <img class="profile-image" src="http://www.allmyfriends.it/robocop.jpg" alt="">
            <div class="text">
              <a class="now" href="#">${elm.username} is ${elm.status}</a>
              <span class="badge"></span>
            </div>
            <span class="time  small">13:21</span>
          </div>`
      )
        })
      }
      else{
        console.log('failed')
      }
      
    })
  }
})

// signup function
function init(){

  // this is for the input feild value
  var user = document.getElementById('username').value;
  // this is to add user to the chat room
  socket.emit('subscribe', user);

  //this part handles the registration proccess
  socket.emit('new user',{username:user}, (data)=>{
      if(data){
          localStorage.setItem('admin', user)
          hold.style.display='none';
          chatHold.style.display='block'
      }else{
          inval.innerHTML='username taken try again'
      }
      user= ''
  });
  

};

// getting the send button by its id
var send =document.getElementById('send');
send.addEventListener('click',()=>{ 
  
        var chat = $('#massage').val(),
            nameRoute = localStorage.getItem('activeClient')
        // sending out message to the client
        $('#display').append(
            `<div class="row no-gutters">
            <div class="col-md-3">
              <div class="chat-bubble">
              ${chat}
              </div>
            </div>
          </div>`
        )
        socket.emit('send_clients', {msg:chat,  clientName :nameRoute});
        document.getElementById('massage').value='';
});

// this sends admin's msg to the client after recieving the msg
socket.on('send_msgs', (data)=>{
    socket.emit('send_clients',data);
});

// this is to recieve the client's msg
socket.on('send_admins',function(data) {
        var name=data.username
        let activeClient = localStorage.getItem('activeClient');
        let clientOnline = storeMsg.find(function(user) {
          return user.username === data.username;
        });
        if(clientOnline){

          if(activeClient == name){
            $('#display').append(`
              <div class="row no-gutters" >
                <div class="col-md-3 offset-md-9">
                  <div class="chat-bubble">
                    ${data.msg}
                  </div>
                </div>
              </div>
            `)
          }else{
            storeMsg.forEach(elm =>{
              if(elm.username === name){
                elm.messageNo +=1;
                notify = storeMsg.indexOf(elm)
              }
            })
            var update = storeMsg[notify].messageNo;
            document.getElementsByClassName('badge')[notify].innerHTML= update
            
          }
        }else{
          storeMsg.push({username: data.username, senderString: data.senderString, status: 'online', messageNo:1});
          $('#clients-chats').append(`
              <div class="friend-drawer friend-drawer--onhover" id="displays">
                <img class="profile-image" src="http://www.allmyfriends.it/robocop.jpg" alt="">
                <div class="text">
                  <a class="now" href="#">${data.username} is online</a>
                  <span class="badge">1</span>
                </div>
                <span class="time  small">13:21</span>
              </div>`
          )
          }

        
       
});

var arrLength;

// the id holding the names of active clients that are online
let attend = document.getElementById('clients-chats')

//  this is function to chat up with d cliets individually
attend.addEventListener('click', (e)=>{
    var person = e.target.innerHTML,
        sept = person.split(' '),
        need = sept[0],
        nameRoute = need;
    socket.emit('confirmStatus', {clientId: nameRoute}, (data)=>{
      if(!data){
        alert('client already being attened to!')
      }else{
        if(e.target.className=='now'){
          console.log(e.target);
          var take =storeMsg[need];
          localStorage.setItem('activeClient', need)
          socket.emit('fetchChats', {clientId: nameRoute}, (data)=>{
            if(data){
              // the part is to clear message notification
              let clearNotification = e.target.nextElementSibling;
              clearNotification.innerHTML = ''
              
              $('#display').empty();
              data.forEach((e)=>{ 
                if(e.hasOwnProperty('clientName')){
                  $('#display').append(`
                  <div class="row no-gutters" >
                    <div class="col-md-3 offset-md-9">
                      <div class="chat-bubble">
                        ${e.clientMessage}
                      </div>
                    </div>
                  </div>
                `)
                }else{
                  $('#display').append(`
                    <div class="row no-gutters">
                      <div class="col-md-3">
                        <div class="chat-bubble">
                         ${e.adminMessage}
                        </div>
                      </div>
                    </div>
                  `)
                }

              }) 
            }
          })  
      }
      }
    })

});

// when client return online
socket.on('returned',function(data) {
  var num = 0;
  // for( let i = 0; i < )
  storeMsg.forEach(elm =>{
    if(elm.username === data){
      elm.status = 'online';
      num = storeMsg.indexOf(elm); 
    }
  });

  let changeStatus = document.getElementsByClassName('now');
  changeStatus[num].innerHTML = `${data}`+ ' ' + 'is online'
})

//logged out client
//update that comes in immediately a client logded out
socket.on('loggedout',function(data) {
  storeMsg.forEach(elm =>{
    if(elm.username === data.username){
      elm.status = 'offline';
      ind = storeMsg.indexOf(elm)
      console.log(ind);
      
    }
  });

  let changeStatus = document.getElementsByClassName('now');
  changeStatus[ind].innerHTML = `${data.username}` + 'is offline'
  // storeMsg[data.username].status ="offline";

});

// broadcasting
socket.on('typing',function(data) {
  $('#typing').text(`${data}` + ' ' + 'is typing')
})
socket.on('clearTyping',function() {
   $('#typing').empty()
})


$( '.friend-drawer--onhover' ).on( 'click',  function() {
  
    $( '.chat-bubble' ).hide('slow').show('slow');
    
    
  });