const label = document.getElementById("waiting");
const gameContainer = document.getElementById("game-container");

const path = window.location.pathname;
const pathRoomId = path.split("/").pop();

if (pathRoomId == "") {
    alert("Please enter a valid room name.");
    setTimeout(() => {
        window.location.replace("/");
    }, 1000);
}

const socket = io();

let gameActive = false;
let currentPlayer = "X";
let localPlayer;

//SOCKET SCRIPT
joinRoom(pathRoomId);

function joinRoom(room) {
    if (room != "") {
        roomId = room;
        socket.emit("join", room);
    }
}

socket.on("room_created", async () => {
    label.style = "display: block";
    gameContainer.style = "display: none";
    localPlayer = "X";
    gameActive = false;
    handleRestartGame();
});

socket.on("room_joined", async () => {
    label.style = "display: none";
    gameContainer.style = "display: block";
    localPlayer = "O";
    gameActive = true;
    handleRestartGame();
});

socket.on("participiant_joined", async () => {
    label.style = "display: none";
    gameContainer.style = "display: block";
    localPlayer = "X";
    gameActive = true;
    handleRestartGame();
});

socket.on("participiant_left", async () => {
    label.style = "display: block";
    gameContainer.style = "display: none";
    gameActive = false;
    handleRestartGame();
});

socket.on("full_room", () => {
    alert("The room is full, please try another one");
    setTimeout(() => {
        window.location.replace("/");
    }, 1000);
});

socket.on("ttt_cellclick", (clickedCellIndex) => {
    handleCellPlayed(clickedCellIndex);
});

socket.on("ttt_restart", () => {
    handleRestartGame();
});

//GAME SCRIPT
const statusDisplay = document.getElementById("game-status");

let gameState = ["", "", "", "", "", "", "", "", ""];

const winningMessage = () =>
    `${currentPlayer == localPlayer ? "You" : "Your Opponent"} won!`;
const drawMessage = () => `Game ended in a draw!`;
const currentPlayerTurn = () =>
    `${currentPlayer == localPlayer ? "Your" : "Opponent's"} turn`;

statusDisplay.innerHTML = currentPlayerTurn();

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

function handleCellPlayed(clickedCellIndex) {
    gameState[clickedCellIndex] = currentPlayer;
    document.querySelector(
        `[data-cell-index="${clickedCellIndex}"]`
    ).innerHTML = currentPlayer;
    handleResultValidation();
}

function handlePlayerChange() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.innerHTML = currentPlayerTurn();
}

function handleResultValidation() {
    let roundWon = false;
    for (let i = 0; i <= 7; i++) {
        const winCondition = winningConditions[i];
        let a = gameState[winCondition[0]];
        let b = gameState[winCondition[1]];
        let c = gameState[winCondition[2]];
        if (a === "" || b === "" || c === "") {
            continue;
        }
        if (a === b && b === c) {
            roundWon = true;
            for (let i = 0; i < 3; i++) {
                document.querySelector(
                    `[data-cell-index="${winCondition[i]}"]`
                ).style.color = "green";
            }
            break;
        }
    }

    if (roundWon) {
        statusDisplay.innerHTML = winningMessage();
        gameActive = false;
        return;
    }

    let roundDraw = !gameState.includes("");
    if (roundDraw) {
        statusDisplay.innerHTML = drawMessage();
        gameActive = false;
        return;
    }

    handlePlayerChange();
}

function handleCellClick(clickedCellEvent) {
    clickedCellIndex = parseInt(
        clickedCellEvent.target.getAttribute("data-cell-index")
    );

    if (
        gameState[clickedCellIndex] !== "" ||
        currentPlayer != localPlayer ||
        !gameActive
    ) {
        return;
    }

    handleCellPlayed(clickedCellIndex);
    socket.emit("ttt_cellclick", clickedCellIndex);
}

function handleRestartGame() {
    gameActive = true;
    currentPlayer = "X";
    gameState = ["", "", "", "", "", "", "", "", ""];
    statusDisplay.innerHTML = currentPlayerTurn();
    document.querySelectorAll(".cell").forEach((cell) => {
        cell.innerHTML = "";
        cell.style.color = "white";
    });
}

document
    .querySelectorAll(".cell")
    .forEach((cell) => cell.addEventListener("click", handleCellClick));
document.getElementById("game-restart").addEventListener("click", () => {
    handleRestartGame();
    socket.emit("ttt_restart");
});
