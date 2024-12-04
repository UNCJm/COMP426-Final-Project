export class HangmanModel extends EventTarget {
    
    #state;
    #playerName; 
    #word; 
    #guessedWords;
    #currentGuess;
    #currentScore;
    #currentCurses;
    #curseState;
    #curseProgressionID;
    #curseCooldown;
    #highScore;  
    #failedAttempts;
    #difficulty;
    #maxAttempts;
    #currentSubject;
    #boss_cycle;
    #AMOUNT_TO_PULL = 30;
    #API_KEY = "w092h6d3ic4w0p70g1u6sf0vppjp3x4qygk1fayvpgkrof3wa";
    #ALPHABET = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    #wordArray = [];
    #subjectTypes = [
        {
            'name': 'johndoe',
            'description': 'No detected anomalies.',
        }, 
        {
            'name': 'amputee',
            'description': 'Subject\'s missing both legs.<br><br><b>You have 2 less maximum wrong guesses.</b>',
        },
        {
            'name': 'brittlebones',
            'description': 'Subject suffers from an abnormally weak bone structure. Avoid heavy impact.<br><br><b>Curses are deadlier.</b>',
        },
        {
            'name': 'markedfordeath',
            'description': 'Personnel interacting with subject reports an abnormal sense of dread.<br><br><b>Curse Cooldown doubled. Replace the Curse Meter with a Death Meter. Filling the Death Meter counts as a wrong guess. Stop reading this and hurry up.</b>',
        },
        {
            'name': 'amnesiac',
            'description': 'Subject suffers from terminal memory loss.<br><br><b>You cannot see your previous guesses.</b>',
        },
        {
            'name': 'ninelives',
            'description': 'There\'s a reason I gave them nine. Do your job and spare me the pain.<br><br><b>You have 9 maximum wrong guesses, but Curse Cooldown is halved.</b>',
        },
        {
            'name': 'illomen',
            'description': 'Subject suffers from extreme bad luck, possibly from an anomalous influence.<br><br><b>This round, when you guess wrong, add a Curse.</b>',
        }
    ]
    #bossTypes = [
        {
            'name': 'thehangedking',
            'description': 'He\'s not from here, I can tell.<br><br><b>The Hanged King starts hanged. After he appears, wrong guesses don\'t do anything, however triggering a Curse immediately ends the game.</b>',
        },
        {
            'name': 'deathitself',
            'description': 'Well well, aren\'t you impatient.<br><br><b>Replace the Curse Meter with a Death Meter. Filling the Death Meter counts as a wrong guess. You have 1 less maximum wrong guess.</b>',
        },
        {
            'name': 'timeeater',
            'description': 'There has to be one in every iteration. They\'re always everyone\'s problem.<br><br><b>Curse Cooldown tripled. Replace the Curse Meter with a Warped Meter. Filling the Warped Meter adds 3 Curses & transfers you back to the previous round.</b>',
        }
    ]
    //for testing
    #EXAMPLE = ["gigantic", "huge", "amaranth", "herbal", "noise", "annoying"];
    

    constructor() {
        super();
        this.#state = 'uninitialized';
    }

    async initialize() { 
        this.#currentCurses = [];
        this.#boss_cycle = Array.from(this.#bossTypes);
        this.setGame();
    }

    async setGame() { // starts game, gets word, uses CRUD to get high score, initializes fields, dispatches stateupdate event
        // if (this.getPlayerName() == 'ADA') {
        //     this.#currentScore = 999;
        // }
        this.#guessedWords = [];
        await this.fetchWord();
        this.resetGuess(this.#word);
        this.getSubject();
        this.#failedAttempts = 0;
        this.setCurseCooldown(51);
        this.#curseState = 0;
        this.setMaxAttempts(8);
        this.handleSubjectEffect();
        this.#state = 'playing';
        this.dispatchEvent(new Event('stateupdate'));
        this.preGuessLetters(this.#word); 
        if (this.getCurrentScore() % 5 == 0) {
            this.resetCurses();
        } else {
            this.progressCurse();
        }
    }

    handleSubjectEffect() {
        switch(this.getSubjectName()) {
            case 'amputee':
                this.setMaxAttempts(6);
                break;
            case 'brittlebones':
                //handled below
                break;
            case 'markedfordeath':
                this.setCurseCooldown(101);
                break;
            case 'amnesiac':
                //handled by the View
                break;
            case 'ninelives':
                this.setMaxAttempts(9);
                this.setCurseCooldown(26)
                break;
            case 'illomen':
                break;
            case 'deathitself':
                this.setMaxAttempts(7);
                break;
            case 'thehangedking':
                this.setMaxAttempts(3);
                break;
            case 'timeeater':
                this.setCurseCooldown(151);
                break;
            default:
                //johndoe
                break;
        }
    }

    addCurse() {
        let alphabet = Array.from(this.#ALPHABET);
        this.shuffleArray(alphabet);
        let cursedLetter = '';
        for (let i = 0; i < alphabet.length; i++) {
            if ((!this.#word.includes(alphabet[i])) && (!this.#currentCurses.includes(alphabet[i])) && (!this.#guessedWords.includes(alphabet[i]))) {
                cursedLetter = alphabet[i];
                this.#currentCurses.push(cursedLetter);
                this.dispatchEvent(new Event('newcurse'));
                break;
            }
        }
        if (cursedLetter == '') {
            this.dispatchEvent(new Event('cannotcurse'));
        }
    }

    progressCurse() {
        if (this.#state != 'playing') {
            return;
        }
        this.#curseProgressionID = setTimeout(() => {
            this.incrementCurseState(1);
            this.progressCurse();
            if (this.#curseState >= this.#curseCooldown) {
                this.#curseState = 0;
                this.dispatchEvent(new Event('curseprogressed'));
                if (this.getSubjectName() == 'timeeater') {
                    this.timeWarp(false);
                } else if (this.getSubjectName() != 'markedfordeath' && this.getSubjectName() != 'deathitself') {
                    this.addCurse();
                } else {
                    let sound = new Audio('assets/audio/marked.mp3');
                    sound.volume = 0.50;
                    sound.play();
                    this.incrementFailedAttempts(1);
                }
                //console.log(this.#currentCurses);
            }
        }, 100)
    }

    timeWarp(resetWholeGame) {
        let sound = new Audio('assets/audio/timewarp.mp3');
        sound.volume = 0.90;
        sound.play();
        if (!resetWholeGame) {
            this.addCurse();
            this.addCurse();
            this.addCurse();
            if (!this.#boss_cycle.includes('timeeater')) {
                let timeEater = {
                    'name': 'timeeater',
                    'description': 'There has to be one in every iteration. They\'re always everyone\'s problem.<br><br><b>Curse Cooldown tripled. Replace the Curse Meter with a Warped Meter. Filling the Warped Meter adds 3 Curses & transfers you back to the previous round.</b>',
                }
                this.#boss_cycle.push(timeEater);
            }
        } else {
            this.#boss_cycle = Array.from(this.#bossTypes);
        }
        this.#state = 'buffering';
        this.dispatchEvent(new Event('stateupdate'));
    }

    resetCurses() {
        this.#currentCurses = [];
        this.dispatchEvent(new Event('curseremoved'));
        this.#curseState = 0;
        if (this.#curseProgressionID != null) {
            clearTimeout(this.#curseProgressionID);
        }
        this.progressCurse();
    }

    resetGuess(word) {
        this.#currentGuess = [];
        for (let i = 0; i < word.length; i++) {
            this.#currentGuess.push(' _ ');
        }
        
    }

    preGuessLetters(word) {
        let uniqueLetters = [];
        for (let char of word) {
            if (!uniqueLetters.includes(char)) uniqueLetters.push(char);
        }
        if (uniqueLetters.length >= 8) {
            this.letterReveal(4);
        } else if (uniqueLetters.length >= 6) {
            this.letterReveal(3);
        } else if (uniqueLetters.length >= 4) {
            this.letterReveal(2);
        } else {
            this.letterReveal(1);
        }
    }

    letterReveal(numLetters) {
        if (this.#word.length < numLetters) return;
        let revealArray = []
        let wordCopy = this.#word.split('');
        this.shuffleArray(wordCopy);
        for (let i = 0; i < numLetters; i++) {
            let letter = wordCopy[0];
            wordCopy = wordCopy.filter((x) => x != letter);
            revealArray.push(letter);
        }
        for (let i = 0; i < this.#word.length; i++) {
            if (revealArray.includes(this.#word[i])) {
                this.#currentGuess[i] = ' ' + this.#word[i] + ' '; 
                if (!this.#guessedWords.includes(this.#word[i])) {
                    this.#guessedWords.push(this.#word[i]);
                    this.dispatchEvent(new Event('correctguess'));
                } else {
                    this.dispatchEvent(new Event('duplicateguess'));
                }
            }
        }
    }

    getSubject() {
        let subjectList = Array.from(this.#subjectTypes);
        if (this.getCurrentScore() == 0) {
            this.#currentSubject = this.#subjectTypes[0];
        } 
        // else if (this.getCurrentScore() == 4) {
        //     this.#currentSubject = this.#bossTypes[2];
        // } 
        else if (this.getCurrentScore()%10 == 9) {
                //every tenth round is a guaranteed boss you haven't seen before
                if (this.#boss_cycle.length <= 0) {
                    this.#boss_cycle = Array.from(this.#bossTypes);
                }
                this.shuffleArray(this.#boss_cycle);
                this.#currentSubject = this.#boss_cycle.shift();
            } else if (this.getCurrentScore()%5 == 4) {
                //every fifth round is a guaranteed elite
                subjectList.shift();
                this.shuffleArray(subjectList);
                this.#currentSubject = subjectList[0];
            } else {
                //every round has a 80% chance of a normal subject and 20% of an elite
                if (this.getRandomInt(5) != 0) {
                    this.#currentSubject = this.#subjectTypes[0];
                } else {
                    this.shuffleArray(subjectList);
                    this.#currentSubject = subjectList[0];
                }
            }
    }
        
    

    async fetchWord() {
        if (this.#wordArray.length > 0) {
            this.#word = this.#wordArray.shift();
            //console.log(this.#word);
            if (this.#currentCurses.length > 0) {
                for (let i = 0; i < this.#currentCurses.length; i++) {
                    if (this.#word.includes(this.#currentCurses[i])) {
                        this.#currentCurses.splice(i, 1);
                        this.dispatchEvent(new Event('curseremoved'));
                    }
                }
            }
            //Remove 1 additional curse for every word you finish
            if (this.#currentCurses.length > 0) {
                this.#currentCurses.splice(0, 1);
                this.dispatchEvent(new Event('curseremoved'));
            }
        } else {
            await this.fetchWordArray(this.#AMOUNT_TO_PULL);
            this.shuffleArray(this.#wordArray);
            await this.fetchWord();
        }
    }

    async fetchWordArray(requestNum) {
        try {
            //throw new Error('L');
            const response = await fetch('https://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&excludePartOfSpeech=family-name%2Cgiven-name%2Cproper-noun%2Cproper-noun-plural%2Cproper-noun-posessive%2Cabbreviation%2Cidiom%2Ccombining-form%2Cindefinite-article%2Cphrasal-verb%2Caffix%2Csuffix&minDictionaryCount=10&minLength=4&limit=' + requestNum + '&api_key=' + this.#API_KEY);
            if (!response.ok) {
                throw new Error(`Failed to fetch words (${response.status})`);
            }
            let bodyData = await response.json();
            for (let i = 0; i < bodyData.length; i++) {
                let word = bodyData[i]['word'];
                if (word.length >= 4) {
                    let isValid = true;
                    for (let char of word) {
                        if (!this.#ALPHABET.includes(char)) {
                            isValid = false;
                        }
                    }
                    if (isValid) {
                        this.#wordArray.push(word);
                    }
                }
            }
            //console.log(this.#wordArray);
            return bodyData;
        } catch (error) {
            console.log('Error fetching word: ' + error);
            this.fetchWordArrayFromExample();
        }
    }

    fetchWordArrayFromExample() {
        this.#wordArray = [];
        for (let i = 0; i < this.#EXAMPLE.length; i++) {
            this.#wordArray.push(this.#EXAMPLE[i]);
        }
        this.shuffleArray(this.#wordArray);
    }

    parseToArray(string, array) {
        const arrayofString = string.split(" ");
        for (var word in arrayofString) {
            let validWord = word.length >= 4;
            for (let i = 0; i < word.length; i++) {
                if (!this.#ALPHABET.includes(word[i])) {
                    validWord = false;
                }
            }
            if (validWord) {
                array.push(word);
            }
        }
    }

    async fetchHighScore() {
        try {
            const response = await fetch(`http://localhost:3000/highscore/${this.#playerName}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch high score (${response.status})`);
            }
            const highScore = await response.json();
            //.log(highScore);
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

    guess(letter) {
        if (!this.isLetterGuessed()) {
            this.#guessedWords.push(letter);
        }
        if (this.isLetterInWord(letter)) {
            for (let i = 0; i < this.#word.length; i++) {
                if (this.#word[i] == letter) {
                    this.#currentGuess[i] = ' ' + letter + ' ';
                }
            }
            this.dispatchEvent(new Event('correctguess'));
        } else {
            this.triggerCurse(letter);
            if (!(this.getSubjectName() == 'thehangedking' && this.getFailedAttempts() >= 2)) {
                this.incrementFailedAttempts(1);
            }
            if (this.getSubjectName() == 'illomen') {
                this.addCurse();
            }
            this.dispatchEvent(new Event('wrongguess'));
        }
        if (this.isWordComplete()) {
            this.#state = 'buffering';
            this.dispatchEvent(new Event('stateupdate'));
            setTimeout(() => {
                this.dispatchEvent(new Event('wordcomplete'));
            }, 1000);
            
        }
        this.updateGameStatus();
    }

    triggerCurse(letter) {
        if (!this.#currentCurses.includes(letter)) return;
        this.incrementFailedAttempts(1);
        if (this.getSubjectName() == 'brittlebones') {
            this.incrementFailedAttempts(1);
        }
        let sound = new Audio('assets/audio/curse.mp3');
        sound.volume = 0.15;
        sound.play();
        this.dispatchEvent(new Event('curseremoved'));
    }

    updateGameStatus() { // updates game state by checking if user has used up all attempts or if user has guessed the every letter in word, dispatches stateupdate event 
        if (this.#state == 'playing') {
            if (this.#failedAttempts >= this.getMaxAttempts()) {
                if (this.getSubjectName() == 'timeeater') {
                    this.timeWarp(true);
                } else {
                    this.#state = 'finished';
                    this.dispatchEvent(new Event('stateupdate'));
                }
            }
        }
    }

    isWordComplete() { return this.#word.split('').every(l => this.#guessedWords.includes(l)); } // checks if user has correctly guessed all letters in word 
    isLetterInWord(letter) { return this.#word.includes(letter); } // checks if letter is in word
    isLetterGuessed(letter) { return this.#guessedWords.includes(letter); } // checks if letter input is a repeat guess

    // getter methods
    getState() { return this.#state; }
    getPlayerName() { return this.#playerName; }
    getWord() { return this.#word; }
    getCurrentScore() { return this.#currentScore; }
    getCurrentGuess() { return this.#currentGuess; }
    getCurrentCurses() { return this.#currentCurses; }
    getCurseState() { return this.#curseState; }
    getCurseCooldown() { return this.#curseCooldown; }
    getHighScore() { return this.#highScore; }
    getLettersGuessed() { return this.#guessedWords; }
    getFailedAttempts() { 
        return this.#failedAttempts; 
    }
    getMaxAttempts() { return this.#maxAttempts; }
    getDifficulty() { return this.#difficulty; }
    getMaxAttempts() { return this.#maxAttempts; }
    getSubjectName() { return this.#currentSubject['name']; }
    getSubjectDescription() { return this.#currentSubject['description']; }
    getValidCharacters() { return this.#ALPHABET; }

    //setter-esque methods
    setPlayerName(name) { this.#playerName = name; }
    setCurrentScore(score) { this.#currentScore = score; }
    setMaxAttempts(num) { this.#maxAttempts = num; }
    setCurseCooldown(num) { this.#curseCooldown = num; }
    addScore(num) { 
        this.#currentScore += num; 
        if (this.#currentScore < 0) {
            this.#currentScore = 0;
        }
    }
    incrementFailedAttempts(num) { 
        this.#failedAttempts += num;
        if (this.#failedAttempts > this.getMaxAttempts()) {
            this.#failedAttempts = this.getMaxAttempts();
        }
        this.dispatchEvent(new Event('takedamage'));
        this.updateGameStatus();
    }
    incrementCurseState(num) { 
        this.#curseState += num;
        if (this.#curseState > this.#curseCooldown) {
            this.#curseState = this.#curseCooldown;
        }
        this.dispatchEvent(new Event('curseprogressed'));
    }

    //helpers
    shuffleArray(array) {
        for (let i = array.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
}