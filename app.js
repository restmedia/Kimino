const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const whatsapp = require("./wa");

(async () => {
  const { sendInvoice } = await whatsapp();

  app
    .use(express.static(path.join(__dirname, "public")))
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .set("views", path.join(__dirname, "views"))
    .set("view engine", "ejs");

  app.post("/send", async (req, res) => {
    const nomor = process.env.NOMOR;
    const nomor2 = process.env.NOMOR2;
    const nomorwa = nomor.replace(/^0/, "62") + "@s.whatsapp.net";
    const nomorwa2 = nomor2.replace(/^0/, "62") + "@s.whatsapp.net";

    try {
      console.log(`Sending invoice to ${nomorwa}...`);
      await sendInvoice(nomorwa, req.body.pesan);
      console.log(`Sending invoice to ${nomorwa2}...`);
      await sendInvoice(nomorwa2, req.body.pesan);
      res.status(200).json({ status: "success", message: "Invoice sent" });
    } catch (err) {
      console.error("Error sending invoice:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.use((req, res, next) => {
    res.status(404).render("404", { title: "404 Not Found" });
  });

  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
})();
