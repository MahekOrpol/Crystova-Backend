const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );
const sendWhatsAppMessage = async (req, res) => {
  const { name, mobile, email, type, budget, metalType, description, file } =
    req.body;
  try {
    // Media upload process (check if file is present)
    let mediaUrl = null;
    if (file) {
      // Ensure the file is uploaded from frontend in base64 format (or URL)
      const fileBuffer = Buffer.from(file, "base64");
      const tempFilePath = path.join(
        __dirname,
        "uploads",
        `${Date.now()}_${file.name}`
      );
      // Save the file temporarily
      fs.writeFileSync(tempFilePath, fileBuffer);
      // Upload file to Twilio's media server
      const media = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: process.env.RECEIVER_WHATSAPP_NUMBER,
        mediaUrl: `https://yourserver.com/uploads/${path.basename(
          tempFilePath
        )}`, // External URL (i.e., hosted media file)
      });
      mediaUrl = media.mediaUrl;
      console.log("File uploaded successfully:", mediaUrl);
      // Optionally delete the temporary file after upload
      fs.unlinkSync(tempFilePath);
    }
    // Construct the message body with media URL if any
    const messageBody = `Custom Jewellery Request:
Name: ${name}
Mobile: ${mobile}
Email: ${email}
Type: ${type}
Budget: ₹${budget}
Metal Type: ${metalType}
Description: ${description}
Media: ${mediaUrl ? mediaUrl : "No media attached"}`;
    // Send the WhatsApp message
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.RECEIVER_WHATSAPP_NUMBER,
      body: messageBody,
    });
    res.status(200).json({ success: true, message: "WhatsApp message sent!" });
  } catch (error) {
    console.error("Error sending WhatsApp:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to send WhatsApp message." });
  }
};
module.exports = { sendWhatsAppMessage };
