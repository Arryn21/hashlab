/* quiz.js — reusable practice-question engine.
   Quiz.mount(container, topicId, questions)
   question = {
     q: "text (may contain HTML)",
     type: "mcq" | "text",
     choices: ["a","b",...]   // mcq only
     answer: "correct" | ["accepted","variants"]  // text: case-insensitive, trimmed
     hint: "optional hint",
     explain: "shown after answering"
   }
   Progress (per-question correctness) persists in localStorage under thm_quiz_<topicId>.
   Aggregate helpers power the landing-page progress bar. */
(function (global) {
  "use strict";

  var STORE_PREFIX = "thm_quiz_";

  function load(topicId) {
    try { return JSON.parse(localStorage.getItem(STORE_PREFIX + topicId)) || {}; }
    catch (e) { return {}; }
  }
  function save(topicId, state) {
    try { localStorage.setItem(STORE_PREFIX + topicId, JSON.stringify(state)); } catch (e) {}
  }

  function norm(s) { return String(s).trim().toLowerCase(); }

  function checkText(val, answer) {
    var accepted = Array.isArray(answer) ? answer : [answer];
    return accepted.some(function (a) { return norm(a) === norm(val); });
  }

  function mount(container, topicId, questions) {
    if (!container) return;
    var state = load(topicId);
    container.classList.add("quiz");
    container.innerHTML = "";

    var scoreBar = document.createElement("div");
    scoreBar.className = "quiz-score";
    container.appendChild(scoreBar);

    questions.forEach(function (q, idx) {
      var card = document.createElement("div");
      card.className = "quiz-card";
      var solved = state[idx] === true;

      var qEl = document.createElement("div");
      qEl.className = "quiz-q";
      qEl.innerHTML = "<span class='quiz-num'>Q" + (idx + 1) + "</span> " + q.q;
      card.appendChild(qEl);

      var feedback = document.createElement("div");
      feedback.className = "quiz-feedback";

      var answerControl;

      if (q.type === "mcq") {
        var list = document.createElement("div");
        list.className = "quiz-choices";
        q.choices.forEach(function (choice) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "quiz-choice";
          btn.textContent = choice;
          btn.addEventListener("click", function () {
            Array.prototype.forEach.call(list.children, function (b) { b.classList.remove("sel"); });
            btn.classList.add("sel");
            var correct = norm(choice) === norm(q.answer);
            grade(correct);
            Array.prototype.forEach.call(list.children, function (b) {
              if (norm(b.textContent) === norm(q.answer)) b.classList.add("correct");
              else if (b === btn && !correct) b.classList.add("wrong");
            });
          });
          list.appendChild(btn);
        });
        card.appendChild(list);
      } else {
        var row = document.createElement("div");
        row.className = "quiz-textrow";
        answerControl = document.createElement("input");
        answerControl.className = "quiz-text";
        answerControl.placeholder = "your answer";
        answerControl.autocomplete = "off";
        var submit = document.createElement("button");
        submit.type = "button";
        submit.className = "btn quiz-submit";
        submit.textContent = "Check";
        function trySubmit() {
          if (!answerControl.value.trim()) return;
          grade(checkText(answerControl.value, q.answer));
        }
        submit.addEventListener("click", trySubmit);
        answerControl.addEventListener("keydown", function (e) { if (e.key === "Enter") trySubmit(); });
        row.appendChild(answerControl);
        row.appendChild(submit);
        card.appendChild(row);
      }

      // hint
      if (q.hint) {
        var hintWrap = document.createElement("details");
        hintWrap.className = "quiz-hint";
        hintWrap.innerHTML = "<summary>Hint</summary><div>" + q.hint + "</div>";
        card.appendChild(hintWrap);
      }

      card.appendChild(feedback);

      function grade(correct) {
        state[idx] = correct === true ? true : (state[idx] === true);
        save(topicId, state);
        feedback.className = "quiz-feedback " + (correct ? "ok" : "no");
        feedback.innerHTML = "<strong>" + (correct ? "✔ Correct" : "✗ Not quite") + "</strong>" +
          (q.explain ? " " + q.explain : "");
        renderScore();
        if (correct) card.classList.add("done");
      }

      if (solved) card.classList.add("done");
      container.appendChild(card);
    });

    function renderScore() {
      var got = 0;
      for (var i = 0; i < questions.length; i++) if (state[i] === true) got++;
      var pct = questions.length ? Math.round(100 * got / questions.length) : 0;
      scoreBar.innerHTML =
        "<div class='quiz-score-text'>Progress: " + got + " / " + questions.length +
        " correct (" + pct + "%)</div>" +
        "<div class='quiz-bar'><span style='width:" + pct + "%'></span></div>";
    }
    renderScore();
  }

  // Aggregate correct-count across topics for the landing page.
  function progress(topicId, total) {
    var state = load(topicId), got = 0;
    for (var i = 0; i < total; i++) if (state[i] === true) got++;
    return { got: got, total: total };
  }

  global.Quiz = { mount: mount, progress: progress };
})(window);
