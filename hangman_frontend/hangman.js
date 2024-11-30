import { HangmanModel } from "./hangman_model.js";
import { HangManController } from "./hangman_controller.js";
import { HangmanView } from "./hangman_view.js";

let model = new HangmanModel();
let controller = new HangManController(model);
let view = new HangmanView(model, controller);

view.render(document.getElementById('main'));