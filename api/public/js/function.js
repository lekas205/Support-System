
var socket = io.connect('localhost:3000');
var hold = document.getElementById('user'),
          chatHold=document.getElementById('chat'),
          userBtn=document.getElementById('post')
//onload
$(document).ready(()=>{
        let user= localStorage.getItem('user');
        if(user){
                socket.emit('registered',{username: user});
                socket.emit('return', user); 
                hold.style.display='none';
                chatHold.style.display='block';
                socket.emit('fetchallChats', {clientId: user}, (data)=>{
                       if(data){      
                        //     var user=localStorage.getItem('user');
                            data.forEach(elm =>{
                                    if(elm.hasOwnProperty('clientName')){
                                        $('.scroll').append(
                                                `<div' class="message-wrapper out">
                                                     <div class="message-box">
                                                     <p>
                                                     ${elm.clientName} <br>
                                                     ${elm.clientMessage}
                                                     </p>
                                                     </div>
                                                     <span class="ago">${elm.time}</span>
                                               </div>`
                                        )
                                    }else{
                                        $('.scroll').append(
                                                `<div class="message-wrapper in">
                                                <div class="message-box">
                                                   ${elm.adminMessage}
                                                </div>
                                                <span class="ago">${elm.time}</span>
                                               </div>`
                                        )
                                    }
                                 })   
                       }   
                })
        }
        // else{
        //         var inval=  document.getElementById('error')
        //         inval.innerHTML='username taken try again';
        // }
})
// this is to recieve peronal message
socket.on('send_msg',function(data) {
        $('#massage').val();
        $('.scroll').append(
                `<div' class="message-wrapper out">
                <div class="message-box">
                <p>
                ${data.username + " "+ data.msg}
                </p>
                </div>
                <span class="ago">${data.time}</span>
                </div>`
        )
        $('#massage').val(' ')
        socket.emit('send_admin',data);

});

// This is to recive admin's msg
socket.on('send_cmsg',function(data) {
       document.getElementById('massage').value=''
       $('.scroll').append(
        `<div class="message-wrapper in">
          <div class="message-box">
           ${data}
          </div>
          <span class="ago">2:32 am.</span>
        </div>`
      )
      
});

/// this part is the registration proccess
userBtn.addEventListener('click', (e)=>{
        user = document.getElementById('username').value;
        var inval=  document.getElementById('error')
        var domain = window.location.href
        socket.emit('subscribe', user);

        socket.emit('new user', {username:user, domain}, (data)=>{
                if(data){
                        localStorage.setItem('user', user)
                        hold.style.display='none';
                        chatHold.style.display='block'
                }else{
                        inval.innerHTML='username taken try again'
                }
                user= ''
        });
                
              
})

// the button thata sends msg
let btn = document.getElementById('btn')

btn.addEventListener('click', ()=>{  
        let chat = $('#massage').val(),
            user = localStorage.getItem('user'),   
            d = new Date(),
            time = d.toLocaleTimeString();

        $('#massage').val();
        $('.scroll').append(
                `<div' class="message-wrapper out">
                <div class="message-box">
                <p>
                ${user + " "+ chat}
                </p>
                </div>
                <span class="ago">${time}</span>
                </div>`
        )
        $('#massage').val(' ')
        socket.emit('send_admin',{username: user, msg: chat});
});
// broadcasting
let message =  document.getElementById('massage');
message.addEventListener('keydown', (event) =>{
        let user = localStorage.getItem('user');
        if(message.value.length > -1){
                socket.emit('typing', user)
        }if(event.keyCode === 8 && message.value.length === 1 ){
                socket.emit('clearTyping', user)
        }
        
})


let element = document.querySelector('section')
element.scrollTop = element.scrollHeight;
