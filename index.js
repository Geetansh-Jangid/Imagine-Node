const express = require("express");

const app = express();

app.listen(3000, () => {

console.log("Project is running!");

})

app.get("/", (req, res) => {

res.send("Hello world!");

})



const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

// Bot setup
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

// Function to generate and download an image
async function downloadImage(prompt, width = 768, height = 768, model = "flux", seed = null) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&private=true`;

    try {
        const response = await axios({
            method: "get",
            url: url,
            responseType: "stream", // To handle binary data
        });

        const filePath = "./generated_image.jpg";
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

// Register slash command
async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName("imagine")
            .setDescription("Generate an AI image based on a prompt")
            .addStringOption(option => 
                option.setName("prompt")
                      .setDescription("The prompt for the image generation")
                      .setRequired(true))
    ].map(command => command.toJSON());

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    try {
        console.log("Refreshing application (/) commands...");
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
}

// Handle slash command interactions
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === "imagine") {
        const prompt = options.getString("prompt");
        await interaction.reply(`Generating image for: \`${prompt}\`...`);

        try {
            const seed = Math.floor(Math.random() * 1000000);
            const filePath = await downloadImage(prompt, 1920, 1920, "flux", seed);

            await interaction.followUp({
                files: [{ attachment: filePath, name: "generated_image.jpg" }]
            });
        } catch (error) {
            await interaction.followUp(`An error occurred: ${error.message}`);
        }
    }
});

// Bot login
client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await registerCommands();
});

client.login(process.env.TOKEN);