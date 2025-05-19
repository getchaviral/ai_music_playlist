const express = require("express");
const Sentiment = require("sentiment");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const sentiment = new Sentiment();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Spotify API Credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Spotify API Token
let SPOTIFY_ACCESS_TOKEN = "";

async function getSpotifyToken() {
    const response = await axios.post("https://accounts.spotify.com/api/token", 
        "grant_type=client_credentials",
        { headers: { "Authorization": "Basic " + Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString("base64"), 
                     "Content-Type": "application/x-www-form-urlencoded" } }
    );
    SPOTIFY_ACCESS_TOKEN = response.data.access_token;
}

// Define mood-based playlists
const moodPlaylists = {
    "positive": "37i9dQZF1DX3rxVfibe1L0",
    "negative": "37i9dQZF1DX7qK8ma5wgG1",
    "neutral": "37i9dQZF1DWVGy1YP1ojM5"
};

// Detect mood using Sentiment.js
function detectMood(text) {
    const analysis = sentiment.analyze(text);
    if (analysis.score > 2) return "positive";
    if (analysis.score < -2) return "negative";
    return "neutral";
}

// API Route: Fetch playlist based on mood
app.post("/get_playlist", async (req, res) => {
    const mood = detectMood(req.body.text);
    const playlistId = moodPlaylists[mood];

    await getSpotifyToken();
    const playlist = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, 
        { headers: { Authorization: `Bearer ${SPOTIFY_ACCESS_TOKEN}` } });

    const tracks = playlist.data.items.map(item => ({
        name: item.track.name,
        artist: item.track.artists[0].name
    }));

    res.json({ mood, tracks });
});

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));

