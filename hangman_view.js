export class HangmanView {

    #model;
    #controller;
    #rootElement;

    constructor(model, controller) {
        this.#model = model;
        this.#controller = controller;

        // Bind event handlers to 'this'
    
        this.handleStateUpdate = this.handleStateUpdate.bind(this);
        this.handleGuessUpdate = this.handleGuessUpdate.bind(this);
    }

    render(rootElement) {
        this.#rootElement = rootElement;

        // Initial rendering based on model state
        if (this.#model.getState() === 'uninitialized') {
            this.renderStartScreen();
        } else {
            this.renderGameScreen();
        }

        // Set up event listeners
        this.#model.addEventListener('stateupdate', this.handleStateUpdate);
        this.#model.addEventListener('guessupdate', this.handleGuessUpdate);
    }

    renderStartScreen() {
        // Clear root element
        this.#rootElement.innerHTML = '';

        // Create form elements
        const form = document.createElement('form');

        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Player Name: ';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.name = 'playerName';
        nameInput.required = true;

        const difficultyLabel = document.createElement('label');
        difficultyLabel.textContent = 'Difficulty: ';

        const difficultySelect = document.createElement('select');
        difficultySelect.name = 'difficulty';
        const optionNormal = document.createElement('option');
        optionNormal.value = 'Normal';
        optionNormal.textContent = 'Normal';

        const optionAdvanced = document.createElement('option');
        optionAdvanced.value = 'Advanced';
        optionAdvanced.textContent = 'Advanced';

        difficultySelect.appendChild(optionNormal);
        difficultySelect.appendChild(optionAdvanced);

        const startButton = document.createElement('button');
        startButton.type = 'submit';
        startButton.textContent = 'Start Game';

        // Append elements to form
        form.appendChild(nameLabel);
        form.appendChild(nameInput);
        form.appendChild(document.createElement('br'));

        form.appendChild(difficultyLabel);
        form.appendChild(difficultySelect);
        form.appendChild(document.createElement('br'));

        form.appendChild(startButton);

        // Append form to root element
        this.#rootElement.appendChild(form);

        // Add event listener to form submission
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const playerName = nameInput.value.trim();
            const difficulty = difficultySelect.value;

            // Start the game via controller
            this.#controller.startGame(difficulty, playerName);
        });
    }

    renderGameScreen() {
        // Clear root element
        this.#rootElement.innerHTML = '';

        // Create elements for the game screen
        const wordDisplay = document.createElement('div');
        wordDisplay.id = 'word-display';

        const lettersGuessedDisplay = document.createElement('div');
        lettersGuessedDisplay.id = 'letters-guessed';

        const guessForm = document.createElement('form');
        guessForm.id = 'guess-form';

        const guessLabel = document.createElement('label');
        guessLabel.textContent = 'Guess a letter: ';

        const guessInput = document.createElement('input');
        guessInput.type = 'text';
        guessInput.name = 'guess';
        guessInput.maxLength = 1;
        guessInput.required = true;

        const guessButton = document.createElement('button');
        guessButton.type = 'submit';
        guessButton.textContent = 'Guess';

        const restartButton = document.createElement('button');
        restartButton.type = 'button';
        restartButton.textContent = 'Restart Game';
    
        guessForm.appendChild(guessLabel);
        guessForm.appendChild(guessInput);
        guessForm.appendChild(guessButton);
        

        const attemptsDisplay = document.createElement('div');
        attemptsDisplay.id = 'attempts-display';

        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'score-display';

        // Append elements to root
        this.#rootElement.appendChild(wordDisplay);
        this.#rootElement.appendChild(lettersGuessedDisplay);
        this.#rootElement.appendChild(attemptsDisplay);
        this.#rootElement.appendChild(scoreDisplay);
        this.#rootElement.appendChild(guessForm);
        this.#rootElement.appendChild(restartButton);

        // Add event listener to guess form
        guessForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const letter = guessInput.value.trim().toLowerCase();
         
                this.#controller.handleGuess(letter);
            
            guessInput.value = '';
        });

        restartButton.addEventListener('click', () => {
            this.#model.resetGame();
        });

        // Initial rendering of the game screen
        this.updateWordDisplay();
        this.updateLettersGuessedDisplay();
        this.updateAttemptsDisplay();
        this.updateScoreDisplay();
    }

    handleStateUpdate() {
        // Re-render the appropriate screen when the state changes
        if (this.#model.getState() === 'playing') {
            this.renderGameScreen();
        } else if (this.#model.getState() === 'finished') {
            this.renderEndScreen();
        } else if (this.#model.getState() === 'uninitialized') {
            this.renderStartScreen();
        }
    }

    handleGuessUpdate() {
        // Update displays after a guess
        this.updateWordDisplay();
        this.updateLettersGuessedDisplay();
        this.updateAttemptsDisplay();
        this.updateScoreDisplay();

        // Check if game is finished
        if (this.#model.getState() === 'finished') {
            this.renderEndScreen();
        }
    }

    renderEndScreen() {
        // Clear root element
        this.#rootElement.innerHTML = '';

        // Create elements
        const messageDisplay = document.createElement('div');
        const word = this.#model.getWord();
        const failedAttempts = this.#model.getFailedAttempts();
        const maxAttempts = this.#model.getMaxAttempts();

        if (this.#model.isWordComplete()) {
            messageDisplay.textContent = 'Congratulations! You have won!';
        } else {
            messageDisplay.textContent = `Game Over! The word was "${word}".`;
        }

        const finalScoreDisplay = document.createElement('div');
        finalScoreDisplay.textContent = `Your final score is: ${this.#model.getCurrentScore()}`;

        const playAgainButton = document.createElement('button');
        playAgainButton.textContent = 'Play Again';

        playAgainButton.addEventListener('click', () => {
            // Reset the game
            this.#controller.resetGame();
            this.renderStartScreen();
            //this.#model.initialize(this.#model.getDifficulty(), this.#model.getPlayerName());
        });

        this.#rootElement.appendChild(messageDisplay);
        this.#rootElement.appendChild(finalScoreDisplay);
        this.#rootElement.appendChild(playAgainButton);
    }

    updateWordDisplay() {
        const wordDisplay = this.#rootElement.querySelector('#word-display');
        if (!wordDisplay) return;
        const word = this.#model.getWord();
        const guesses = this.#model.getLettersGuessed();
        let displayText = '';

        for (const char of word) {
            if (guesses.includes(char)) {
                displayText += char + ' ';
            } else {
                displayText += '_ ';
            }
        }

        wordDisplay.textContent = displayText.trim();
    }

    updateLettersGuessedDisplay() {
        const lettersGuessedDisplay = this.#rootElement.querySelector('#letters-guessed');
        if (!lettersGuessedDisplay) return;
        const guesses = this.#model.getLettersGuessed();

        lettersGuessedDisplay.textContent = 'Letters guessed: ' + guesses.join(', ');
    }

    updateAttemptsDisplay() {
        const attemptsDisplay = this.#rootElement.querySelector('#attempts-display');
        if (!attemptsDisplay) return;
        const failedAttempts = this.#model.getFailedAttempts();
        const maxAttempts = this.#model.getMaxAttempts();

        attemptsDisplay.textContent = `Failed Attempts: ${failedAttempts} / ${maxAttempts}`;
    }

    updateScoreDisplay() {
        const scoreDisplay = this.#rootElement.querySelector('#score-display');
        if (!scoreDisplay) return;
        const currentScore = this.#model.getCurrentScore();
        const highScore = this.#model.getHighScore();

        scoreDisplay.textContent = `Current Score: ${currentScore} | High Score: ${highScore}`;
    }
}
