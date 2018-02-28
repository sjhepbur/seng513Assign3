// shorthand for $(document).ready(...)
$(function() {
    var socket = io();
    $('form').submit(function(){
	    socket.emit('chat', $('#m').val());
	    $('#m').val('');
	    return false;
    });
    socket.on('chat', function(msg){
        // $('#messages').append($('<li>').text(msg));
        $('#messages').append($('<li>' + msg));
        var objDiv = document.getElementById("chat_box");
        objDiv.scrollTop = objDiv.scrollHeight;
    });
});
