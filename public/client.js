// shorthand for $(document).ready(...)
$(function() {
    var socket = io();

    //Setup the client whenever a new user connects
    socket.emit('setup', getCookie("user"), getCookie("colour"));

    //Creates a set of cookies for a new user that will last 1 hour
    socket.on('createCookie', function(user, colour){
        setCookie("user", user, 3600);
        setCookie("colour", colour, 3600);
    });

    $('form').submit(function(){
	    socket.emit('chat', $('#m').val());
	    $('#m').val('');
	    return false;
    });

    //Add messages to the chat
    socket.on('chat', function(msg){
        $('#messages').append($('<li>' + msg));
        var objDiv = document.getElementById("chat_content");
        objDiv.scrollTop = objDiv.scrollHeight;
    });

    //Clear the list of online users
    socket.on('clear', function(){
        clear_users("users");
    });

    //Display all users that are online
    socket.on('dispUser', function(msg){
        display_users('#users', msg);
    });

    //Display current user info
    socket.on('disp', function(msg){
        document.getElementById("user_info").innerHTML = msg;
    });
});

//Function to clear users in the Online Users list
function clear_users(elementID)
{
    document.getElementById(elementID).innerHTML = "";
}

//Function to populate the Online Users list
function display_users(elementID, user_name){
    $(elementID).append($('<li>' + user_name));
    var objDiv = document.getElementById("users");
    objDiv.scrollTop = objDiv.scrollHeight;
}


//Code obtained and modified from: https://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript
//Gets the cookie for the specific name given 
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return "";
}

//Code obtained and modified from: https://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript
//Sets a new cookie for the value given
function setCookie(name,value,seconds) {
    var expires = "";
    if (seconds) {
        var date = new Date();
        date.setTime(date.getTime() + (seconds*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}