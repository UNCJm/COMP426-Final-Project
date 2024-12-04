export class HangManController extends EventTarget {

    #model;
    
    constructor(model) {
        super();
        this.#model = model;
    }

    async startGame() { // takes in difficulty and player name and sends to model to start game
        await this.#model.initialize();
    }

    handleGuess(letter) { // sends guess input to model 
        if (this.#model.isLetterGuessed(letter))  {
            this.dispatchEvent(new Event('duplicateletter'));
            return;
        }
        this.#model.guess(letter);
    }

    nextWord() {
        this.#model.addScore(1);
        this.#model.setGame();
    }
    
    playAgain() {
        if (this.#model.getState() == 'finished') {
            this.#model.addScore(-this.#model.getCurrentScore());
            this.#model.initialize();
        }
    }

    async saveHighScore() {
        if (this.#model.getCurrentScore() < this.#model.getHighScore()) return;
        await this.#model.saveHighScore();
    }
}