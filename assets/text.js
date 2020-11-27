const path = window.location.pathname;
const pathRoomId = path.split("/").pop();

if (pathRoomId == "") {
    alert("Please enter a valid room name.");
    setTimeout(() => {
        window.location.replace("/");
    }, 1000);
}

const socket = io();
const messageBox = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const sendButton = document.getElementById("send-button");

sendButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (messageBox.value.split(" ").join("") != "") {
        socket.emit("send_message", messageBox.value, "Somebody");
        sendMessage(messageBox.value, true);
    }
    messageBox.value = "";
});

joinRoom(pathRoomId);

function joinRoom(room) {
    if (room != "") {
        roomId = room;
        socket.emit("join", room);
    }
}

let sendMessage = (message, localMessage, prefix) => {
    var messageElement = document.createElement("span");
    messageElement.innerHTML = `<span><b class="${
        localMessage ? "message-you" : "message-stranger"
    }">${localMessage ? "You: " : `${prefix}: `}</b>${message}</span><br />`;
    messageContainer.prepend(messageElement);
};

socket.on("room_created", async () => {
    sendButton.disabled = false;
    sendMessage("Room created successfully", false, "SERVER");
});

socket.on("room_joined", async () => {
    sendButton.disabled = false;
    sendMessage("Room joined successfully", false, "SERVER");
});

socket.on("participiant_joined", async () => {
    sendMessage("Somebody joined the chat.", false, "SERVER");
});

socket.on("participiant_left", async () => {
    sendMessage("Your partner has left the chat.", false, "SERVER");
});

socket.on("message_received", async (message, prefix) => {
    sendMessage(message, false, prefix);
});

socket.on("full_room", () => {
    alert("The room is full, please try another one");
    setTimeout(() => {
        window.location.replace("/");
    }, 1000);
});
