const EventEmitter = require("events");

class AppEvents extends EventEmitter {}
const appEvents = new AppEvents();

appEvents.on("user:registered", (user) => {
  console.log(`[event] User registered: ${user.username} (${user.email}) [role: ${user.role}]`);
});

appEvents.on("user:logged_in", (user) => {
  console.log(`[event] User logged in: ${user.username} (${user._id})`);
});

appEvents.on("note:created", (note) => {
  console.log(`[event] Note created: "${note.title}" by owner ${note.owner}`);
});

appEvents.on("chat:message", ({ room, sender, message }) => {
  console.log(`[${room}] ${sender}: ${message}`);
});

module.exports = appEvents;