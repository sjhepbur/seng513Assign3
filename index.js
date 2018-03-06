var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

//Number of users on the system
var numUsers = 0;

//List of users on the system
var users = [];

//List of the users socket ids
var userIDs = [];

//List of the users colours
var userColours = [];

//List of all 200 chat messages logged
var chatMessages = [];

//Checks for commands that a user can input
var chgUser = "/nick";
var chgColour = "/nickcolor";

http.listen(port, function(){
  console.log('listening on port:', port);
});

app.use(express.static(__dirname + '/public'));

//Function that formats the current time properly
function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

//Function that gets a random colour for a new user
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

//Function that checks if the colour a user wants to change their username to is valid
function isValidColor(colour){
  return (typeof colour === "string") && colour.length === 6  && ! isNaN( parseInt(colour, 16) );
}

//Function that generates a random new username
function newUser(){
  numUsers ++;
  var randNum;
  do{
    randNum = Math.floor(Math.random() * 999);
    userName = "user" + randNum;
  } while(checkUserExists(userName));
  users.push(userName);
  return userName;
}

//Function to check to see if the user name given exists
function checkUserExists(name){
  return (users.indexOf(name) > -1);
}

//Function that will log a chat message
function logMessage(message){
  if (chatMessages.length < 200){
    chatMessages.push(message)
  } else if (chatMessages.length == 200){
    chatMessages.shift()
    chatMessages.push(message)
  }
}

//Function that displays all logged messages to a new user
function displayLoggedMsg(usrID){
  var index = userIDs.indexOf(usrID);
  user_name = users[index];
  for (let i = 0; i < chatMessages.length; i++){
    log_message = chatMessages[i];

    //If it's a returning user, make their message logged bold
    if (log_message.includes(user_name)){
      io.sockets.connected[usrID].emit('chat', '<p>' + log_message.bold() + '</p>');
    }
    //Else just log the plain message
    else{
      io.sockets.connected[usrID].emit('chat', '<p>' + log_message + '</p>');
    }
  }
}

//Function that changes a username
function changeUserName(oldName, newName){
  var index = users.indexOf(oldName);
  if (checkUserExists(newName)){
    userID = userIDs[index];
    io.sockets.connected[usrID].emit('chat', "<p>Sorry, " + newName + " is already a name on the server</p>");
  } else{
    users[index] = newName;
    console.log(users[index]);
    io.emit('chat', "<p>" + user + " changed their name to " + newName + "</p>");
  }
}

//Function that changes a users colour
function changeUserColour(user, newColour){
  var index = users.indexOf(user);
  userID = userIDs[index];
  if (isValidColor(newColour)){
    userColours[index] = newColour
    io.sockets.connected[usrID].emit('chat', "<p>Color changed successfully!</p>");
    //Update user list with new colour
  } else{
    io.sockets.connected[usrID].emit('chat', "<p>Sorry. " + newColour + " is not a valid color</p>");
  }
}

//Function to display all users in the Online Users box
function displayUsers(){
  for (var i = 0; i < users.length; i++){
    user = users[i];
    user_colour = userColours[i];
    name_coloured = user.fontcolor(user_colour);
    name_coloured_msg = "<p>" + name_coloured + "</p>";
    console.log(name_coloured_msg);
    io.emit('dispUser', name_coloured_msg);
  }
}

io.on('connection', function(socket){
  
  //Check for a setup call
  socket.on('setup', function(cookie_user, cookie_colour){ 

    //If the user had been on the server before
    if (cookie_user != "" && cookie_colour != ""){

      usrID = socket.id;
      userIDs.push(usrID);
      userColours.push(cookie_colour);

      //Check if someone has taken the user name since the user disconnected
      if(checkUserExists(cookie_user)){
        newName = newUser();

        io.sockets.connected[usrID].emit('chat', "<p>Someone has taken your previous username</p>");
        io.sockets.connected[usrID].emit('chat', "<p>You new username is " + newName + "</p>");
        io.sockets.connected[usrID].emit('disp', "<p>You are " + newName + "</p>");
        console.log(newName + ' connected');
        socket.emit('createCookie', newName, cookie_colour);
      }

      //Else reassign the users info
      else{
        users.push(cookie_user)
        io.sockets.connected[usrID].emit('chat', "<p>Welcome back, " + cookie_user + "</p>");
        io.sockets.connected[usrID].emit('disp', "<p>You are " + cookie_user + "</p>");
        console.log(cookie_user + ' connected');
      }
    }

    //Else this is a new user
    else{
      console.log('a new user connected');
      newName = newUser();
      usrID = socket.id;
      userIDs.push(usrID);
      user_colour = getRandomColor()
      userColours.push(user_colour);

      //Create a new cookie client side for the new users colour and username
      socket.emit('createCookie', newName, user_colour);
    
      io.sockets.connected[usrID].emit('chat', "<p>You are " + newName + "</p>");
      io.sockets.connected[usrID].emit('disp', "<p>You are " + newName + "</p>");
    }

    //Reset the Online User list to all current users
    io.emit('clear');
    displayUsers();
    displayLoggedMsg(usrID);
  });

  //When a user sends a chat message
  socket.on('chat', function(msg){

    //Building the message to be sent to the server
    var time = new Date;
    var h = time.getHours();
    var m = time.getMinutes();

    m = checkTime(m);

    var currTime = h + ':' + m;

    socID = socket.id;
    i = userIDs.indexOf(socID);
    user = users[i];
    user_colour = userColours[i];

    console.log(users[i]);

    name_coloured = user.fontcolor(user_colour);

    var fullMessage = currTime + ' ' + name_coloured + ' ' + msg;

    //Check if the message sent was to chanfe the username
    if (msg.split(" ")[0] == chgUser){
      umsgArr = msg.split(" ");
      umsgArr.shift();
      newName = umsgArr.join(" ");
      changeUserName(user, newName);

      //Check if the message sent was to change the colour
    } else if (msg.split(" ")[0] == chgColour){
      cmsgArr = msg.split(" ");
      cmsgArr.shift();
      newColour = cmsgArr.join(" ");
      changeUserColour(user, newColour);

      //Else, just display the message
    } else {
      bold_msg = fullMessage.bold();
      user_msg = "<p>" + bold_msg + "</p>";
      chat_msg = "<p>" + fullMessage + "</p>";
      logMessage(fullMessage);
      io.sockets.connected[socID].emit('chat', user_msg);
      socket.broadcast.emit('chat', chat_msg);
    }

    console.log('message: ' + fullMessage);
  });

  //When a user disconnects
  socket.on('disconnect', function(){
    socID = socket.id;
    index = userIDs.indexOf(socID);
    userDis = users[index];

    //Check if the user that disconnects is a real user or not
    if (userDis != null){
      io.emit('chat', "<p>User " + userDis + " has disconnected</p>");

      users.splice(index, 1);
      userIDs.splice(index, 1);
      numUsers--;

      io.emit('clear');
      displayUsers();

      console.log('user ' + userDis + ' disconnected');
    }

    //Sometimes an old user is still detected by the server. In this case, we just catch that and do nothing
    else{
      console.log('Old user disconnected');
    }
  });
});
