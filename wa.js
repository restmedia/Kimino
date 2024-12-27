const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function whatsapp() {
  const auth = await useMultiFileAuthState("session");
  let socket;

  const startSocket = async () => {
    socket = makeWASocket({
      printQRInTerminal: true,
      browser: ["Kimino", "", ""],
      auth: auth.state,
      logger: pino({ level: "silent" }),
    });

    // Simpan kredensial saat diperbarui
    socket.ev.on("creds.update", auth.saveCreds);

    // Tangani pembaruan koneksi
    socket.ev.on(
      "connection.update",
      async ({ connection, lastDisconnect }) => {
        if (connection === "open") {
          console.log("Kimino x Rest");
        } else if (connection === "close") {
          const reason = lastDisconnect?.error?.output?.statusCode;
          console.log("Connection closed. Reason:", reason);

          // Jika bukan logout, coba reconnect
          if (reason !== DisconnectReason.loggedOut) {
            console.log("Attempting to reconnect...");
            setTimeout(startSocket, 5000); // Tunggu 5 detik sebelum reconnect
          } else {
            console.log("Logged out. Please rescan the QR code.");
          }
        }
      }
    );

    socket.ev.on("messages.upsert", (msg) => {
      //   console.log("Received message:", JSON.stringify(msg, null, 2));
    });
  };

  await startSocket();

  // Fungsi untuk mengirim pesan
  async function sendInvoice(phoneNumber, invoiceCode) {
    try {
      if (!socket?.authState?.creds) {
        throw new Error("Socket is not authenticated.");
      }
      await socket.sendMessage(phoneNumber, {
        text: `Your invoice code is: ${invoiceCode}`,
      });
      console.log(`Invoice sent to ${phoneNumber}: ${invoiceCode}`);
    } catch (err) {
      console.error(`Failed to send invoice to ${phoneNumber}:`, err.message);
    }
  }

  return { sendInvoice };
}

module.exports = whatsapp;
