var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var numUsers = 0;
var users = [];
var userIDs = [];
var chatMessages = [];

var chgUser = "/nick"

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
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
    io.sockets.connected[usrID].emit('chat message', chatMessages[i]);
  }
}

function changeUserName(oldName, newName){
  var index = users.indexOf(oldName);
  if (checkUserExists(newName)){
    userID = userIDs[index];
    io.sockets.connected[usrID].emit('chat message', "Sorry, " + newName + " is already a name on the server");
  } else{
    users[index] = newName;
    io.emit('chat message', user + " changed their name to " + newName);
  }
}

io.on('connection', function(socket){
  console.log('a user connected');
  newName = newUser();
  usrID = socket.id;
  userIDs.push(usrID);

  io.sockets.connected[usrID].emit('chat message', "You are " + newName);

  displayLoggedMsg(usrID);

  socket.on('chat message', function(msg){
    var time = new Date;
    var h = time.getHours();
    var m = time.getMinutes();

    m = checkTime(m);

    var currTime = h + ':' + m;

    socID = socket.id;
    i = userIDs.indexOf(socID);
    user = users[i];

    var fullMessage = currTime + ' ' + user + ' ' + msg;

    if (msg.split(" ")[0] == chgUser){
      msgArr = msg.split(" ");
      msgArr.shift();
      newName = msgArr.join(" ");
      changeUserName(user, newName);
    } else{
      logMessage(fullMessage);
      io.emit('chat message', fullMessage);
    }

    console.log('message: ' + fullMessage);
  });
  socket.on('disconnect', function(){
    socID = socket.id;
    index = userIDs.indexOf(socID);
    userDis = users[index];
    io.emit('chat message', "User " + userDis + " has disconnected");

    users.splice(index, 1);
    userIDs.splice(index, 1);
    numUsers--;

    console.log('user ' + userDis + ' disconnected')
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
