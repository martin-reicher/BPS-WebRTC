const roomInput = document.getElementById("room-input");
const connectButton = document.getElementById("connect-button");
const enterNameLabel = document.getElementById("enter-name");
const radios = document.getElementsByName("mode");
let currentSelected;

connectButton.addEventListener("click", () => {
    if (currentSelected != undefined) {
        window.location.href = `/${currentSelected}/${roomInput.value}`;
    }
});

let checkActive = () => {
    for (i = 0; i < radios.length; i++) {
        if (radios[i].checked) currentSelected = radios[i].id;
    }
};
