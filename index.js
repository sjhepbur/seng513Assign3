var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var numUsers = 0;
var users = [];
var userIDs = [];
var userColours = [];
var chatMessages = [];

var chgUser = "/nick";
var chgColour = "/nickcolor";

http.listen(port, function(){
  console.log('listening on *:', port);
});

app.use(express.static(__dirname + '/public'));

function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function isValidColor(colour){
  return (typeof colour === "string") && colour.length === 6  && ! isNaN( parseInt(colour, 16) );
}

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

function checkUserExists(name){
  return (users.indexOf(name) > -1);
}

function logMessage(message){
  if (chatMessages.length < 200){
    chatMessages.push(message)
  } else if (chatMessages.length == 200){
    chatMessages.shift()
    chatMessages.push(message)
  }
}

function displayLoggedMsg(usrID){
  for (let i = 0; i < chatMessages.length; i++){
    io.sockets.connected[usrID].emit('chat', chatMessages[i]);
  }
}

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

io.on('connection', function(socket){
  console.log('a user connected');
  newName = newUser();
  usrID = socket.id;
  userIDs.push(usrID);
  userColours.push(getRandomColor());

  io.sockets.connected[usrID].emit('chat', "<p>You are " + newName + "</p>");

  displayLoggedMsg(usrID);

  socket.on('chat', function(msg){
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

    var fullMessage = '<p>' + currTime + ' ' + name_coloured + ' ' + msg + '</p>';

    if (msg.split(" ")[0] == chgUser){
      umsgArr = msg.split(" ");
      umsgArr.shift();
      newName = umsgArr.join(" ");
      changeUserName(user, newName);
    } else if (msg.split(" ")[0] == chgColour){
      cmsgArr = msg.split(" ");
      cmsgArr.shift();
      newColour = cmsgArr.join(" ");
      changeUserColour(user, newColour);
    } else {
      logMessage(fullMessage);
      io.emit('chat', fullMessage);
    }

    console.log('message: ' + fullMessage);
  });
  socket.on('disconnect', function(){
    socID = socket.id;
    index = userIDs.indexOf(socID);
    userDis = users[index];
    io.emit('chat', "User " + userDis + " has disconnected");

    users.splice(index, 1);
    userIDs.splice(index, 1);
    numUsers--;

    console.log('user ' + userDis + ' disconnected')
  });
});
