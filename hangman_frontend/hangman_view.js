export class HangmanView {
    #model
    #controller
    #current_screen
    #game_state
    #session_high_score
    #logTimeoutID
    #bgm
    #currentLog
    #DEFAULT_LOG_MSG = "___"
    #name_input = '';
    #SPECIAL_SUBJECTS = ['ninelives', 'deathitself', 'thehangedking', 'timeeater'];
    #player_name
    constructor(model, controller) {
        this.#model = model;
        this.#controller = controller;
        this.#player_name = "";
        this.#currentLog = "";
        this.#session_high_score = 0;
        this.#game_state = model.getState();
        this.#model.addEventListener('stateupdate', () => {
            if (this.#model.getCurrentScore() > this.#session_high_score) {
                this.#session_high_score = this.#model.getCurrentScore();
            }
            this.#game_state = this.#model.getState();
            this.clearContent(this.#current_screen);
            this.render(this.#current_screen);
            if (this.#game_state == 'finished') {
                this.displayHangman();
                this.#bgm.pause();
                let sound = new Audio('assets/audio/cut-music.mp3');
                sound.volume = 0.20;
                sound.play();
            } else if (this.#game_state == 'buffering') {
                if (this.#model.isWordComplete()) {
                    if (this.#model.getCurrentScore() == 29) {
                        this.inGameLog('Impressive! Check your name in the title screen later.', 5000);
                    } else {
                        this.inGameLog('Correct.', 2000);
                    }
                    this.displayHangman();
                } else {
                    switch(this.#model.getSubjectName()) {
                        case 'timeeater':
                            this.inGameLog('Too bad...', 2000);
                            this.displayHangman();
                            setTimeout(() => {
                                this.#model.addScore((this.#model.getFailedAttempts() >= this.#model.getMaxAttempts()) ? - (model.getCurrentScore()) : -2);
                                this.#controller.nextWord();
                            }, 2000);
                            break;
                        default:
                            break;
                    }
                }
            }
        })
        this.#model.addEventListener('duplicateguess', () => {
            let wordContainer = document.getElementById('word-container');
            this.clearContent(wordContainer);
            this.renderWords(wordContainer);
        })
        this.#model.addEventListener('correctguess', () => {
            let sound = new Audio('assets/audio/correct.mp3');
            sound.volume = 0.50;
            sound.play();
            let wordContainer = document.getElementById('word-container');
            this.clearContent(wordContainer);
            this.renderWords(wordContainer);
            
        })
        this.#model.addEventListener('correctguess', () => {
            let guessContainer = document.getElementById('guess-container');
            this.addGuess(guessContainer, true);
        })
        this.#model.addEventListener('wrongguess', () => {
            let sound = new Audio('assets/audio/wrong.mp3');
            sound.volume = 0.90;
            sound.play();
            let guessContainer = document.getElementById('guess-container');
            this.addGuess(guessContainer, false);
        })
        this.#model.addEventListener('takedamage', () => {
            this.displayHangman();
            let attemptTracker = document.getElementById('attempt-tracker');
            attemptTracker.innerHTML = "Attempts: " + (this.#model.getMaxAttempts() - this.#model.getFailedAttempts());
            attemptTracker.style.color = "red";
            setTimeout(() => attemptTracker.style.color = "white", 150)
        })
        this.#model.addEventListener('curseprogressed', () => {
            //console.log('progresscurse');
            let curseContainer = document.getElementById('curse-container');
            if (this.#model.getCurseState() == 0 || this.#model.getCurseState() > this.#model.getCurseCooldown()) {
                this.clearContent(curseContainer);
            }
            switch(this.#model.getSubjectName()) {
                case 'ninelives':
                    this.progressMeter('curse-block', 25);
                    break;
                case 'markedfordeath':
                    this.progressMeter('death-block', 100);
                    break;
                case 'deathitself':
                    this.progressMeter('death-block', 50);
                    break;
                case 'timeeater':
                    this.progressMeter('warp-block', 150);
                    break;
                default:
                    this.progressMeter('curse-block', 50);
                    break;
            }
            if (this.#game_state == 'finished') {
                this.clearContent(curseContainer);
            }
        })
        this.#model.addEventListener('newcurse', () => {
            let curseTracker = document.getElementById('curse-tracker');
            curseTracker.innerHTML = "Curses: <span>" + this.#model.getCurrentCurses().length + '</span>';
            curseTracker.style.color = "plum";
            setTimeout(() => curseTracker.style.color = "white", 150)
        })
        this.#model.addEventListener('curseremoved', () => {
            let curseTracker = document.getElementById('curse-tracker');
            curseTracker.innerHTML = "Curses: <span>" + this.#model.getCurrentCurses().length + '</span>';
        })
        this.#model.addEventListener('wordcomplete', () => {
            this.#controller.nextWord();
            this.clearContent(this.#current_screen);
            this.render(this.#current_screen);
        })
        this.#controller.addEventListener('duplicateletter', () => {
            this.inGameLog('Letter already guessed.', 1000);
        })
    }
    
    render(render_div) {
        this.#current_screen = render_div;
        this.renderTitle(this.#current_screen);
        if (this.#game_state == 'uninitialized') {
            this.#name_input = "";
            if (this.#player_name == "") {
                this.renderNameZone(this.#current_screen);
                document.addEventListener('keydown', (event) => {
                    if (this.#game_state == 'uninitialized') {
                        if (event.key === "Backspace") {
                            if (this.#name_input != "") {
                                this.#name_input = this.#name_input.substr(0, this.#name_input.length - 1);
                                let name_input = document.getElementById('name-input');
                                name_input.innerHTML = this.#name_input;
                            }
                        }
                    }
                })
                document.addEventListener('keypress', async (event) => {
                    if (this.#game_state == 'uninitialized') {
                        if (event.key === "Enter") {
                            if (this.#name_input.length <= 0) {
                                return;
                            }
                            this.#player_name = this.#name_input.toUpperCase();
                            this.#model.setPlayerName(this.#player_name);
                            this.#model.setCurrentScore(0);
                            await this.#model.fetchHighScore();
                            this.clearContent(render_div);
                            this.render(render_div);
                        } else if (this.#name_input.length <= 12) {
                            this.#name_input += event.key.toUpperCase();
                            let name_input = document.getElementById('name-input');
                            name_input.innerHTML = this.#name_input;
                        }
                    } else if (this.#game_state == 'playing') {
                        let validCharacters = this.#model.getValidCharacters();
                        let character = event.key.toLowerCase();
                        if (validCharacters.includes(character)) {
                            this.#controller.handleGuess(character);
                        }
                    }  
                })
            }
            else {
                this.renderGameInfoZone(this.#current_screen);
            }
        } else if (this.#game_state == 'playing' || this.#game_state == 'buffering') {
            this.renderScoreZone(this.#current_screen);
            this.renderHangmanZone(this.#current_screen);
            this.renderStatZone(this.#current_screen);
            this.renderCurseZone(this.#current_screen);
            this.renderWordZone(this.#current_screen);
            this.renderGuessedZone(this.#current_screen);
            this.renderLogZone(this.#current_screen);
        } else {
            this.renderScoreZone(this.#current_screen);
            this.renderHangmanZone(this.#current_screen);
            this.renderStatZone(this.#current_screen);
            this.renderCurseZone(this.#current_screen);
            this.renderLogZone(this.#current_screen);
            if (this.#model.getCurrentScore() > this.#session_high_score) {
                this.#session_high_score = this.#model.getCurrentScore();
            }
            this.renderSelectionZone(this.#current_screen);
            this.inGameLog('THE CORRECT WORD WAS \"' + this.#model.getWord().toUpperCase() + '\". RETRY?', 0);
        }
    }

    clearContent(element) {
        element.innerHTML = "";
    }

    renderTitle(render_div) {
        let title_box = document.createElement('div');
        title_box.innerHTML = "HANGMAN";
        title_box.setAttribute("id", "title");
        title_box.addEventListener('click', async () => {
            await this.saveHighScore();
            location.reload();
        });
        render_div.append(title_box);
    }

    renderNameZone(render_div) {
        let name_area = document.createElement('div');

        let prompt = document.createElement('div');
        prompt.innerHTML = "Type in your name (ENTER to confirm):";
        prompt.classList.add('bolded-prompts');
        name_area.appendChild(prompt);

        let name_input = document.createElement('div');
        name_input.innerHTML = this.#name_input;
        name_input.setAttribute('id', 'name-input');
        name_area.appendChild(name_input);

        render_div.append(name_area);
    }

    renderGameInfoZone(render_div) {
        let info_area = document.createElement('div');
        let name_display = (this.#model.getHighScore() >= 30) ? ('<span style="color:gold;">' + this.#player_name + '</span>') : this.#player_name;

        let prompt1 = document.createElement('div');
        prompt1.innerHTML = "Welcome, " + name_display + ".";
        prompt1.classList.add('bolded-prompts');
        info_area.appendChild(prompt1);

        let prompt2 = document.createElement('div');
        prompt2.innerHTML = "<p>This will be different from the HANGMAN game that you know.</p><p>Click <a href=\"tutorial.html\" target=\"_blank\">HERE</a> to read the rules.</p>";
        prompt2.classList.add('prompts');
        info_area.appendChild(prompt2);

        let hs_prompt = document.createElement('div');
        hs_prompt.innerHTML = name_display + "'S HIGH SCORE: " + this.#model.getHighScore();
        hs_prompt.classList.add('bolded-prompts');
        info_area.appendChild(hs_prompt);

        let startBtn = this.createButton("START GAME");
        startBtn.addEventListener('click', async () => {
            await this.startGame();
        })
        startBtn.style.width = '30%';
        startBtn.style.fontSize = '300%';
        info_area.appendChild(startBtn);

        render_div.append(info_area);
    }

    async startGame() {
        await this.#controller.startGame();
        this.#session_high_score = this.#model.getHighScore();
        let bgm = new Audio('assets/audio/bgm.mp3');
        this.#bgm = bgm;
        this.#bgm.loop = true;
        this.#bgm.volume = 0.1;
        this.#bgm.play();
    }

    createButton(string) {
        let button = document.createElement('div');
        button.innerHTML = string;
        button.classList.add('custom-button');
        return button;
    }

    renderScoreZone(render_div) {
        let scoreZone = document.createElement('div');
        scoreZone.classList.add('main-game-horizontal-block');

        let score = document.createElement('div');
        score.innerHTML = "Score: " + this.#model.getCurrentScore();
        score.classList.add('inline-div');
        scoreZone.appendChild(score);

        let highScore = document.createElement('div');
        highScore.innerHTML = "High Score: " + this.#session_high_score;
        highScore.classList.add('inline-div');
        scoreZone.appendChild(highScore);

        render_div.appendChild(scoreZone);
    }

    renderHangmanZone(render_div) {
        let hangmanZone = document.createElement('div');
        hangmanZone.classList.add('main-game-horizontal-block');

        //image box
        let hangmanBox = document.createElement('div');
        hangmanBox.classList.add('inline-div');
        hangmanBox.setAttribute('id', 'hangman-box');
        hangmanZone.appendChild(hangmanBox);

        //details
        let hangmanDetails = document.createElement('div');
        hangmanDetails.setAttribute('id', 'hangman-details');
        hangmanDetails.classList.add('inline-div');

        let subjectTitle = document.createElement('div');
        subjectTitle.classList.add('bottom-border-div');
        subjectTitle.innerHTML = "<b>SUBJECT ID</b><br><span>" + this.#model.getSubjectName() + "</span>";
        hangmanDetails.appendChild(subjectTitle);

        let subjectDescription = document.createElement('div');
        subjectDescription.innerHTML = this.#model.getSubjectDescription();
        subjectDescription.setAttribute('id', 'subject-description');
        hangmanDetails.appendChild(subjectDescription);

        hangmanZone.appendChild(hangmanDetails);

        render_div.appendChild(hangmanZone);
    }

    renderCurseZone(render_div) {
        let curseZone = document.createElement('div');
        curseZone.classList.add('main-game-horizontal-block');

        let curseContainer = document.createElement('div');
        curseContainer.setAttribute('id', 'curse-container');
        curseZone.appendChild(curseContainer);

        render_div.appendChild(curseZone);
    }

    createLoadBlock(className, width) {
        let loadBlock = document.createElement('div');
        loadBlock.innerHTML = ' ';
        loadBlock.classList.add(className);
        loadBlock.style.width = width;
        return loadBlock;
    }

    progressMeter(className, maxCount) {
        let curseContainer = document.getElementById('curse-container');
        if (curseContainer.childElementCount < maxCount) {
            switch(maxCount) {
                case 25:
                    curseContainer.appendChild(this.createLoadBlock(className, "4%"));
                    break;
                case 100:
                    curseContainer.appendChild(this.createLoadBlock(className, "1%"));
                    break;
                case 150:
                    curseContainer.appendChild(this.createLoadBlock(className, "0.66%"));
                    break;
                default: //case 50
                    curseContainer.appendChild(this.createLoadBlock(className, "2%"));
                    break;
            }
        }
    }

    renderStatZone(render_div) {
        let statZone = document.createElement('div');
        statZone.classList.add('main-game-horizontal-block');

        let curseTracker = document.createElement('div');
        curseTracker.innerHTML = "Curses: <span style=rgb(137, 113, 160);>" + this.#model.getCurrentCurses().length + '</span>';
        curseTracker.classList.add('inline-div');
        curseTracker.setAttribute('id', 'curse-tracker');
        statZone.appendChild(curseTracker);
        
        let attemptTracker = document.createElement('div');
        attemptTracker.innerHTML = "Attempts: " + (this.#model.getMaxAttempts() - this.#model.getFailedAttempts());
        attemptTracker.classList.add('inline-div');
        attemptTracker.setAttribute('id', 'attempt-tracker');
        statZone.appendChild(attemptTracker);

        render_div.appendChild(statZone);
    }

    renderWordZone(render_div) {
        let wordZone = document.createElement('div');
        wordZone.classList.add('main-game-wide-horizontal-block');

        let wordContainer = document.createElement('div');
        wordContainer.setAttribute('id', 'word-container');
        wordContainer.innerHTML = "";
        this.renderWords(wordContainer);
        wordZone.appendChild(wordContainer);

        render_div.appendChild(wordZone);
    }

    renderWords(render_div) {
        let currentGuess = this.#model.getCurrentGuess();
        if (currentGuess.length > 0) {
            for (let i = 0; i < currentGuess.length; i++) {
                render_div.innerHTML += currentGuess[i];
            }
        }
    }

    renderGuessedZone(render_div) {
        let guessZone = document.createElement('div');
        guessZone.classList.add('main-game-wide-horizontal-block');

        let guessContainer = document.createElement('div');
        guessContainer.setAttribute('id', 'guess-container');
        for (let i = 0; i < 2; i++) {
            let blankBlock = document.createElement('div');
            blankBlock.classList.add('guess-block');
            blankBlock.innerHTML = ' ';
            guessContainer.appendChild(blankBlock);
        }
        this.addGuess(guessContainer);
        guessZone.appendChild(guessContainer);

        render_div.appendChild(guessZone);
    }

    addGuess(render_div, forceWhite) {
        if (this.#game_state != 'playing') return;
        let guessedWords = this.#model.getLettersGuessed();
        if (guessedWords.length <= 0) return;
        let previousGuess = guessedWords[guessedWords.length - 1];
        let guessBlock = document.createElement('div');
        guessBlock.innerHTML = previousGuess;
        if (this.#model.getSubjectName() == 'amnesiac') {
            guessBlock.innerHTML = '?';
        }
        guessBlock.classList.add('guess-block');
        if (!this.#model.getCurrentCurses().includes(previousGuess) || forceWhite) {
            guessBlock.style.color = 'white';
        } else {
            for (let i = 0; i < this.#model.getCurrentCurses().length; i++) {
                if (this.#model.getCurrentCurses()[i] == previousGuess) {
                    this.#model.getCurrentCurses().splice(i, 1);
                }
            }
        }
        render_div.insertBefore(guessBlock, render_div.childNodes[1]);
    }

    renderLogZone(render_div) {
        let logZone = document.createElement('div');
        logZone.classList.add('main-game-horizontal-block');
        logZone.setAttribute('id', 'log-zone');
        if (this.#currentLog != '') {
            logZone.innerHTML = this.#currentLog;
        } else {
            logZone.innerHTML = this.#DEFAULT_LOG_MSG;
        }

        render_div.appendChild(logZone);
    }

    inGameLog(msg, timer) {
        let logZone = document.getElementById('log-zone');
        logZone.innerHTML = msg;
        if (this.#logTimeoutID != null) {
            clearTimeout(this.#logTimeoutID);
        }
        if (timer > 0) {
            this.#logTimeoutID = setTimeout(() => {
                logZone.innerHTML = this.#DEFAULT_LOG_MSG;
                this.#currentLog = "";
            }, timer)
        }
    }

    renderSelectionZone(render_div) {
        let selectionZone = document.createElement('div');
        selectionZone.classList.add('main-game-horizontal-block');
        let retryBtn = this.createButton('YES');
        retryBtn.addEventListener('click', async () => {
            this.#controller.playAgain();
            this.#bgm.load();
            this.#bgm.play();
        })
        let returnBtn = this.createButton("NO");
        returnBtn.addEventListener('click', async () => {
            await this.saveHighScore();
            location.reload();
        })
        selectionZone.appendChild(retryBtn);
        selectionZone.appendChild(returnBtn);
        render_div.appendChild(selectionZone);
    }

    async saveHighScore() {
        if (this.#model.getCurrentScore() > this.#model.getHighScore()) {
            await this.#model.saveHighScore();
        }
    }

    displayHangman() {
        if (this.#model.getFailedAttempts() == 0) return;
        let imageBox = document.getElementById('hangman-box');
        this.clearContent(imageBox);
        let img = document.createElement('img');
        img.classList.add('hangman-img');
        let hangmanState = this.#model.getFailedAttempts();
        let subjectName = this.#model.getSubjectName();
        let suffix = "";
        if (hangmanState >= 3 && !this.#SPECIAL_SUBJECTS.includes(subjectName)) {
            if (hangmanState == 3) {
                hangmanState = 2;
            }
            imageBox.style.backgroundImage = "url('" + "assets/images/hangman-3-" + subjectName + ".png" + "')";
        }
        if (this.#SPECIAL_SUBJECTS.includes(subjectName)) {
            suffix = subjectName;
        }
        img.src = "assets/images/hangman-" + hangmanState + "-" + suffix + ".png";
        imageBox.appendChild(img);
    }
}