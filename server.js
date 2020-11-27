const express = require("express");
var path = require("path");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production") {
        if (req.headers["x-forwarded-proto"] !== "https")
            return res.redirect("https://" + req.headers.host + req.url);
        else return next();
    } else return next();
});

app.use("/assets", express.static("assets"));
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/html/index.html"));
});

app.get("/video/*", (req, res) => {
    res.sendFile(path.join(__dirname + "/html/video.html"));
});

app.get("/games/*", (req, res) => {
    res.sendFile(path.join(__dirname + "/html/games.html"));
});

app.get("/text/*", (req, res) => {
    res.sendFile(path.join(__dirname + "/html/text.html"));
});

io.on("connection", (socket) => {
    socket.on("join", (roomId) => {
        const roomClients = io.sockets.adapter.rooms.get(roomId);
        const numberOfClients = roomClients != undefined ? roomClients.size : 0;

        if (numberOfClients == 0) {
            socket.join(roomId);
            socket.emit("room_created", roomId);
        } else if (numberOfClients == 1) {
            socket.join(roomId);
            socket.emit("room_joined", roomId);
            socket.broadcast.to(roomId).emit("participiant_joined");
        } else {
            socket.emit("full_room", roomId);
        }
    });

    socket.on("disconnecting", (reason) => {
        if (reason == "transport close") {
            let socketRooms = Array.from(socket.rooms);
            if (socketRooms.length == 2) {
                socket.broadcast.to(socketRooms[1]).emit("participiant_left");
            }
        }
    });

    socket.on("ttt_cellclick", (clickedCellIndex) => {
        let socketRooms = Array.from(socket.rooms);
        if (socketRooms.length == 2) {
            socket.broadcast
                .to(socketRooms[1])
                .emit("ttt_cellclick", clickedCellIndex);
        }
    });
    socket.on("ttt_restart", () => {
        let socketRooms = Array.from(socket.rooms);
        if (socketRooms.length == 2) {
            socket.broadcast.to(socketRooms[1]).emit("ttt_restart");
        }
    });

    socket.on("send_message", (message, prefix) => {
        let socketRooms = Array.from(socket.rooms);
        if (socketRooms.length == 2) {
            socket.broadcast
                .to(socketRooms[1])
                .emit("message_received", message, prefix);
        }
    });
    socket.on("start_call", (roomId) => {
        socket.broadcast.to(roomId).emit("start_call");
    });
    socket.on("webrtc_offer", (event) => {
        socket.broadcast.to(event.roomId).emit("webrtc_offer", event.sdp);
    });
    socket.on("webrtc_answer", (event) => {
        socket.broadcast.to(event.roomId).emit("webrtc_answer", event.sdp);
    });
    socket.on("webrtc_ice_candidate", (event) => {
        socket.broadcast.to(event.roomId).emit("webrtc_ice_candidate", event);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});
