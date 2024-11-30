export class HangManController {

    #model;
    
    constructor(model) {
        this.#model = model;
    }

    startGame(difficulty, playerName) { // takes in difficulty and player name and sends to model to start game
        if (/^(normal|advanced)$/i.test(difficulty) == false) return alert('enter "normal" or "advanced" as difficulty input');
        this.#model.initialize(difficulty, playerName);
    }

    handleGuess(letter) { // sends guess input to model 
        if (this.#model.isLetterGuessed(letter)) return alert('letter already guessed'); 
        if (letter.length === 1 && /^[a-z]$/i.test(letter) == false) return alert('incorrect input. type in a single alphabet letter');
        this.#model.guess(letter);
    }

    resetGame() { // calls model to reset game state to 'uninitialized'
        if (this.#model.getState() != 'playing') return;
        this.#model.resetState();
    }
    
    playAgain() {
        if (this.#model.getState() === 'finished') {
            this.#model.keepPlaying(); 
        }
    }

    async saveHighScore() {
        if (this.#model.getCurrentScore() < this.#model.getHighScore()) return;
        await this.#model.saveHighScore();
    }
}