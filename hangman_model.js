export class HangmanModel extends EventTarget { 

    #playerName; //handle in controller?
    #word; // handle empty string in fetchwWord
    #guesses;
    #state;
    #currentScore;
    #highScore; // set as zero in fetchHighscore if no high scores   
    #failedAttempts; 
    #difficulty; // handle in controller
    #MaxAttempts;

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

   async setGame(){ // starts game, gets word, uses CRUD to get high score, initializes fields, dispatches stateupdate event
        if (this.getState() == 'finished' || this.getState() == 'playing') return;
        await this.fetchWord();
        this.#highScore = this.fetchHighScore();
        this.#guesses = [];
        this.#failedAttempts = 0;
        this.#currentScore = 0;
        this.#state = 'playing';
        this.dispatchEvent(new Event('stateupdate')); 
    }

    async fetchWord() { // fetches word to guess
        try {
          const response = await fetch('https://random-word-api.herokuapp.com/word');
          if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
          }
          const data = await response.json();
          console.log('Random Word:', data[0]);
          this.#word = data[0];
        } catch (error) {
          console.error('There was a problem with the fetch operation:', error);
        }
      }

    fetchHighScore() { // fetches highscore using CRUD
        return 100;
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
            this.#MaxAttempts = 5;
        } else {
            this.#MaxAttempts = 7;
        }
    }

    resetGame() { // resets state to uninitialized and dispatches stateupdate event 
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
    getMaxAttempts() { return this.#MaxAttempts; }
}