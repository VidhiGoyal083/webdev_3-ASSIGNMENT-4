const { io } = require("socket.io-client");

const aditi = io("http://localhost:5000");
const rohan = io("http://localhost:5000");

aditi.on("connect", () => {
  aditi.emit("join_room", { room: "general", username: "Aditi" });
  setTimeout(() => {
    aditi.emit("chat_message", {
      room: "general",
      sender: "Aditi",
      message: "Hey team, backend is ready"
    });
  }, 300);
});

rohan.on("connect", () => {
  rohan.emit("join_room", { room: "general", username: "Rohan" });
  setTimeout(() => {
    rohan.emit("chat_message", {
      room: "general",
      sender: "Rohan",
      message: "Testing chat now..."
    });
  }, 600);
});

setTimeout(() => {
  aditi.emit("chat_message", {
    room: "general",
    sender: "Aditi",
    message: "Messages arriving in real time"
  });
}, 900);

setTimeout(() => {
  aditi.disconnect();
  rohan.disconnect();
  process.exit(0);
}, 1500);