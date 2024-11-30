export class HangmanModel extends EventTarget {

    #playerName; 
    #word; 
    #guesses;
    #state;
    #currentScore;
    #highScore;  
    #failedAttempts;
    #difficulty;
    #maxAttempts;

    constructor() {
        super();
        this.#state = 'uninitialized';
    }

    initialize(difficulty, name) {  //initializes game, takes in difficulty string (‘Normal’ | ‘Advanced’) and player name
        if (this.#state != 'uninitialized') return;
        this.#difficulty = difficulty;
        this.setAttempts(difficulty);
        this.#playerName = name;
        this.setGame();
    }

    async setGame() { // starts game, gets word, uses CRUD to get high score, initializes fields, dispatches stateupdate event
        if (this.getState() == 'finished' || this.getState() == 'playing') return;
        await this.fetchWord();
        await this.fetchHighScore();
        this.#guesses = [];
        this.#failedAttempts = 0;
        if (!this.#currentScore) this.#currentScore = 0;
        this.#state = 'playing';
        this.dispatchEvent(new Event('stateupdate'));
    }

    async keepPlaying() {
        if (this.#state !== 'finished') return;
        if (this.getCurrentScore() > 0) {
            await this.saveHighScore();
         }
        this.#state = 'playing';
        await this.fetchWord();
        await this.fetchHighScore();
        this.#guesses = [];
        this.#failedAttempts = 0;
        this.dispatchEvent(new Event('stateupdate'));
    }

    async fetchWord() {
        try {
            const response = await fetch('http://localhost:3000/word');
            if (!response.ok) {
                throw new Error(`Failed to fetch word (${response.status})`);
            }
            const word = await response.json();
            console.log(word);
            this.#word = word;
        } catch (error) {
            console.error('Error fetching word:', error);
        }
    }

    async fetchHighScore() {
        try {
            const response = await fetch(`http://localhost:3000/highscore/${this.#playerName}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch high score (${response.status})`);
            }
            const highScore = await response.json();
            console.log(highScore);
            this.#highScore = highScore;
        } catch (error) {
            console.error('Error fetching high score or none exists', error);
            this.#highScore = 0;
        }
    }

    async saveHighScore() {
        const user = this.#playerName;
        const score = this.#currentScore;
        
        try {
            const response = await fetch('http://localhost:3000/highscore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, highScore: score })
            });
    
            if (!response.ok) {
                const errorDetails = await response.json();
                throw new Error(`Failed to save high score (${response.status}): ${errorDetails.error}`);
            }
    
            const result = await response.json();
            console.log('High score saved successfully:', result.message);
        } catch (error) {
            console.error('Error saving high score:', error);
        }
    }

    guess(letter) {  // handles letter guesses, updates score accordingly (subtracts 10 pts if guess wrong), dispatches guessupdate event 
        if (this.isLetterGuessed(letter)) return;
        if (this.isLetterInWord(letter)) {
            this.#currentScore += this.updateScore(letter);
        } else {
            if (this.getCurrentScore() > 0) this.#currentScore -= 10;
            this.#failedAttempts++;
        }
        this.#guesses.push(letter);
        this.dispatchEvent(new Event('guessupdate'));
        this.updateGameStatus();
    }

    updateScore(letter) { // arbitrary way to calculate score (adds 10 pts for # of times correct guess letter appears in word)
        let count = 0;
        for (let char of this.#word) {
            if (char === letter) {
                count++;
            }
        }
        count *= 10;
        return count;
    }

    updateGameStatus() { // updates game state by checking if user has used up all attempts or if user has guessed the every letter in word, dispatches stateupdate event 
        if (this.#state == 'playing') {
            if (this.isWordComplete() == true || this.#failedAttempts == this.getMaxAttempts()) {
                this.#state = 'finished'
                this.dispatchEvent(new Event('stateupdate'));
            }
        }
    }

    setAttempts(difficulty) { // sets max attempts based on difficulty setting
        if (difficulty === 'Normal') {
            this.#maxAttempts = 5;
        } else {
            this.#maxAttempts = 7;
        }
    }

    resetState() { // resets state to uninitialized and dispatches stateupdate event 
        this.#state = 'uninitialized';
        this.dispatchEvent(new Event('stateupdate'));
    }

    isWordComplete() { return this.#word.split('').every(l => this.#guesses.includes(l)); } // checks if user has correctly guessed all letters in word 
    isLetterInWord(letter) { return this.#word.includes(letter); } // checks if letter is in word
    isLetterGuessed(letter) { return this.#guesses.includes(letter); } // checks if letter input is a repeat guess

    // getter methods
    getState() { return this.#state; }
    getPlayerName() { return this.#playerName; }
    getWord() { return this.#word; }
    getCurrentScore() { return this.#currentScore; }
    getHighScore() { return this.#highScore; }
    getLettersGuessed() { return this.#guesses; }
    getFailedAttempts() { return this.#failedAttempts; }
    getDifficulty() { return this.#difficulty; }
    getMaxAttempts() { return this.#maxAttempts; }
}