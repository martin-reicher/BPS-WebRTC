const path = window.location.pathname;
const pathRoomId = path.split("/").pop();

if (pathRoomId == "") {
    alert("Please enter a valid room name.");
    setTimeout(() => {
        window.location.replace("/");
    }, 1000);
}

const label = document.getElementById("waiting");
const videoChatContainer = document.getElementById("video-chat-container");
const localVideoComponent = document.getElementById("local-video");
const remoteVideoComponent = document.getElementById("remote-video");

const socket = io();
const mediaConstraints = {
    audio: true,
    video: { width: 1280, height: 720, facingMode: { ideal: "user" } },
};
let localStream;
let remoteStream;
let isRoomCreator;
let rtcPeerConnection;
let roomId;
let tracks = new Array();

const iceServers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
    ],
};

joinRoom(pathRoomId);

socket.on("room_created", async () => {
    label.style = "display: block";
    await setLocalStream(mediaConstraints);
    isRoomCreator = true;
});

socket.on("room_joined", async () => {
    label.style = "display: none";
    await setLocalStream(mediaConstraints);
    socket.emit("start_call", roomId);
});

socket.on("full_room", () => {
    alert("The room is full, please try another one");
    setTimeout(() => {
        window.location.replace("/");
    }, 1000);
});

socket.on("start_call", async () => {
    label.style = "display: none";
    if (isRoomCreator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        addLocalTracks(rtcPeerConnection);
        rtcPeerConnection.ontrack = setRemoteStream;
        rtcPeerConnection.onicecandidate = sendIceCandidate;
        await createOffer(rtcPeerConnection);
    }
});

socket.on("webrtc_offer", async (event) => {
    if (!isRoomCreator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        addLocalTracks(rtcPeerConnection);
        rtcPeerConnection.ontrack = setRemoteStream;
        rtcPeerConnection.onicecandidate = sendIceCandidate;
        rtcPeerConnection.setRemoteDescription(
            new RTCSessionDescription(event)
        );
        await createAnswer(rtcPeerConnection);
    }
});

socket.on("webrtc_answer", (event) => {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

socket.on("webrtc_ice_candidate", (event) => {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate,
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on("participiant_left", () => {
    remoteVideoComponent.srcObject = undefined;
    label.style = "display: block";
});

function joinRoom(room) {
    if (room != "") {
        roomId = room;
        socket.emit("join", room);
    }
}

async function setLocalStream(mediaConstraints) {
    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    } catch (error) {
        console.error("Could not get user media", error);
    }

    localStream = stream;
    localVideoComponent.srcObject = stream;
}

function addLocalTracks(rtcPeerConnection) {
    localStream.getTracks().forEach((track) => {
        tracks.push(rtcPeerConnection.addTrack(track, localStream));
    });
}

async function createOffer(rtcPeerConnection) {
    let sessionDescription;
    try {
        sessionDescription = await rtcPeerConnection.createOffer();
        rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
        console.error(error);
    }

    socket.emit("webrtc_offer", {
        type: "webrtc_offer",
        sdp: sessionDescription,
        roomId,
    });
}

async function createAnswer(rtcPeerConnection) {
    let sessionDescription;
    try {
        sessionDescription = await rtcPeerConnection.createAnswer();
        rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
        console.error(error);
    }

    socket.emit("webrtc_answer", {
        type: "webrtc_answer",
        sdp: sessionDescription,
        roomId,
    });
}

function setRemoteStream(event) {
    remoteVideoComponent.srcObject = event.streams[0];
    remoteStream = event.stream;
}

function sendIceCandidate(event) {
    if (event.candidate) {
        socket.emit("webrtc_ice_candidate", {
            roomId,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
        });
    }
}
