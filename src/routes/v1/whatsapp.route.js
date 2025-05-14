const express = require("express");
const { sendWhatsAppMessage } = require("../../controllers/whatsappController");
const router = express.Router();
router.post("/send-whatsapp", sendWhatsAppMessage);
module.exports = router;