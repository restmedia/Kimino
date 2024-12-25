const express = require("express");
const {
  makeWASocket,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
require("dotenv").config();
const path = require("path");
const app = express();

// Set folder views untuk EJS
app.set("views", path.join(__dirname, "views"));

// Set folder public untuk file statis seperti CSS, JS
app.use(express.static(path.join(__dirname, "public")));

// Set EJS sebagai template engine
app.set("view engine", "ejs");

// Middleware untuk file statis
// app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let whatsappSocket;

async function initializeWhatsApp() {
  const sessionPath = path.join(__dirname, "session");
  const auth = await useMultiFileAuthState(sessionPath);
  const socket = makeWASocket({
    printQRInTerminal: true,
    browser: ["Kimino", "", ""],
    auth: auth.state,
    logger: pino({ level: "silent" }),
  });

  socket.ev.on("creds.update", auth.saveCreds);
  socket.ev.on("connection.update", async ({ connection }) => {
    if (connection === "open") {
      console.log("WhatsApp connected");
    } else if (connection === "close") {
      console.log("WhatsApp disconnected, reconnecting...");
      initializeWhatsApp(); // Reconnect on disconnection
    }
  });

  async function sendMessage(phoneNumber, message) {
    await socket.sendMessage(phoneNumber, { text: message });
  }

  return { sendMessage };
}

// Initialize WhatsApp connection
initializeWhatsApp().then((socket) => {
  whatsappSocket = socket;
});

// API Endpoint to send messages
app.post("/send-message", async (req, res) => {
  const { message } = req.body;
  const nomor = process.env.NOMOR;

  const phoneNumber = nomor.replace(/^0/, "62") + "@s.whatsapp.net";

  if (!phoneNumber || !message) {
    return res
      .status(400)
      .json({ error: "phoneNumber and message are required" });
  }

  try {
    await whatsappSocket.sendMessage(phoneNumber, message);
    return res
      .status(200)
      .json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending message:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to send message" });
  }
});

app.use((req, res, next) => {
  res.status(404).render("404", { title: "404 Not Found" });
});

// module.exports = app;

// To run locally, uncomment the following lines:
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
