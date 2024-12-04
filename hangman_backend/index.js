const express = require('express');
const { User } = require('./database');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../hangman_frontend')))

// Fetch highscore by username
app.get('/highscore/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ where: { username } });
        res.json(user ? user.highScore : 0);
    } catch (error) {
        console.error('Error fetching high score:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update highscore
app.post('/highscore', async (req, res) => {
    const { username, highScore } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    try {
        const [user, created] = await User.findOrCreate({
            where: { username },
            defaults: { highScore: highScore || 0 },
        });

        if (!created) {
            // Update high score if the new score is higher
            if (highScore > user.highScore) {
                user.highScore = highScore;
                await user.save();
            }
        }

        res.json({ message: 'Highscore updated' });
    } catch (error) {
        console.error('Error updating high score:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch a random word
app.get('/word', async (req, res) => {
    try {
        const response = await fetch('https://random-word-api.herokuapp.com/word');
        const data = await response.json();
        console.log('Random Word:', data[0]);
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch a word' });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));



  