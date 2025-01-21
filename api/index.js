const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

module.exports = async (req, res) => {
    if (req.method === "POST") {
        const { command, prompt } = req.body;

        if (command === "imagine") {
            try {
                const seed = Math.floor(Math.random() * 1000000);
                const filePath = await downloadImage(prompt, 1920, 1920, "flux", seed);

                res.status(200).sendFile(filePath);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        } else {
            res.status(400).json({ error: "Invalid command" });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
};

// Helper function to download image
async function downloadImage(prompt, width = 768, height = 768, model = "flux", seed = null) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&private=true`;

    try {
        const response = await axios({
            method: "get",
            url: url,
            responseType: "stream",
        });

        const filePath = `/tmp/generated_image.jpg`;
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", () => resolve(filePath));
            writer.on("error", reject);
        });
    } catch (error) {
        throw new Error(`Failed to download the image: ${error.message}`);
    }
}
