 /********** GLOBAL VARIABLES & CONFIGURATION **********/
    const NUM_NUMBERS = 91; // 0 to 90
    let bank = 1000;
    let currentChip = 0;  // Selected chip value
    // Bets: numbers, color, and odd/even.
    let bets = { numbers: {}, color: {}, evenodd: {} };
    // High scores loaded from localStorage.
    let highScores = JSON.parse(localStorage.getItem("rouletteHighScores")) || [];
    
    const bankDisplay = document.getElementById("bankDisplay");
    const playerNameInput = document.getElementById("playerNameInput");
    function updateBankDisplay() {
      bankDisplay.textContent = "Bank: $" + bank;
    }
    
    /********** RENDERING THE BETTING BOARD **********/
    function renderBettingBoard() {
      const board = document.getElementById("bettingBoard");
      board.innerHTML = "";
      for (let i = 0; i < NUM_NUMBERS; i++) {
        let cell = document.createElement("div");
        cell.className = "betCell";
        cell.setAttribute("data-number", i);
        cell.textContent = i;
        cell.addEventListener("click", function() {
          if (currentChip > 0) {
            let num = cell.getAttribute("data-number");
            if (!bets.numbers[num]) bets.numbers[num] = 0;
            bets.numbers[num] += currentChip;
            cell.innerHTML = `${num}<br><small>$${bets.numbers[num]}</small>`;
          }
        });
        board.appendChild(cell);
      }
    }
    renderBettingBoard();
    updateBankDisplay();
    
    /********** External Betting Areas: Color & Odd/Even **********/
    const colorOptions = document.querySelectorAll("#colorBetArea .betOption");
    colorOptions.forEach(opt => {
      opt.addEventListener("click", function() {
        let col = opt.getAttribute("data-value");
        if (!bets.color[col]) bets.color[col] = 0;
        bets.color[col] += currentChip;
        opt.innerHTML = `${col.toUpperCase()}<br><small>$${bets.color[col]}</small>`;
      });
    });
    const evenOddOptions = document.querySelectorAll("#evenoddBetArea .betOption");
    evenOddOptions.forEach(opt => {
      opt.addEventListener("click", function() {
        let val = opt.getAttribute("data-value");
        if (!bets.evenodd[val]) bets.evenodd[val] = 0;
        bets.evenodd[val] += currentChip;
        opt.innerHTML = `${val.toUpperCase()}<br><small>$${bets.evenodd[val]}</small>`;
      });
    });
    
    /********** CHIP SELECTION **********/
    const chipButtons = document.querySelectorAll(".chip");
    chipButtons.forEach(chip => {
      chip.addEventListener("click", function() {
        chipButtons.forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
        currentChip = parseInt(chip.getAttribute("data-value"));
      });
    });
    
    /********** Roulette Wheel Drawing & Animation **********/
    const canvas = document.getElementById("wheelCanvas");
    const ctx = canvas.getContext("2d");
    const wheelRadius = canvas.width / 2;
    const numPockets = 37; // European Roulette: 0 to 36
    const segmentAngle = 2 * Math.PI / numPockets;
    let rotationAngle = 0;
    let spinVelocity = 0;
    let spinning = false;
    
    // Official European Roulette order.
    const rouletteOrder = [
      {number: 0, color:"green"},
      {number: 32, color:"red"},
      {number: 15, color:"black"},
      {number: 19, color:"red"},
      {number: 4, color:"black"},
      {number: 21, color:"red"},
      {number: 2, color:"black"},
      {number: 25, color:"red"},
      {number: 17, color:"black"},
      {number: 34, color:"red"},
      {number: 6, color:"black"},
      {number: 27, color:"red"},
      {number: 13, color:"black"},
      {number: 36, color:"red"},
      {number: 11, color:"black"},
      {number: 30, color:"red"},
      {number: 8, color:"black"},
      {number: 23, color:"red"},
      {number: 10, color:"black"},
      {number: 5, color:"red"},
      {number: 24, color:"black"},
      {number: 16, color:"red"},
      {number: 33, color:"black"},
      {number: 1, color:"red"},
      {number: 20, color:"black"},
      {number: 14, color:"red"},
      {number: 31, color:"black"},
      {number: 9, color:"red"},
      {number: 22, color:"black"},
      {number: 18, color:"red"},
      {number: 29, color:"black"},
      {number: 7, color:"red"},
      {number: 28, color:"black"},
      {number: 12, color:"red"},
      {number: 35, color:"black"},
      {number: 3, color:"red"},
      {number: 26, color:"black"}
    ];
    
    function drawWheel() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < numPockets; i++) {
        let startAngle = rotationAngle + i * segmentAngle;
        let endAngle = startAngle + segmentAngle;
        let pocket = rouletteOrder[i];
        ctx.beginPath();
        ctx.moveTo(wheelRadius, wheelRadius);
        ctx.arc(wheelRadius, wheelRadius, wheelRadius, startAngle, endAngle);
        ctx.closePath();
        let fillCol = (pocket.color === "red") ? "#ff4444" : (pocket.color === "black") ? "#222222" : "#008800";
        ctx.fillStyle = fillCol;
        ctx.fill();
        // Draw pocket number
        let textAngle = startAngle + segmentAngle / 2;
        let textRadius = wheelRadius * 0.7;
        let x = wheelRadius + textRadius * Math.cos(textAngle);
        let y = wheelRadius + textRadius * Math.sin(textAngle);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(pocket.number, 0, 0);
        ctx.restore();
      }
      // Draw fixed pointer on the RIGHT edge
      ctx.beginPath();
      ctx.moveTo(canvas.width - 20, wheelRadius - 10);
      ctx.lineTo(canvas.width - 20, wheelRadius + 10);
      ctx.lineTo(canvas.width - 5, wheelRadius);
      ctx.closePath();
      ctx.fillStyle = "#ffff00";
      ctx.fill();
    }
    
    function animateWheel() {
      if (!spinning) return;
      rotationAngle += spinVelocity;
      spinVelocity *= 0.98;
      if (spinVelocity < 0.001) {
        spinning = false;
        determineOutcome();
      }
      drawWheel();
      requestAnimationFrame(animateWheel);
    }
    
    // Determina il risultato in modo che il "puntatore" (a destra, angolo 0) corrisponda al segmento vincente.
    function determineOutcome() {
      let finalAngle = (2 * Math.PI - (rotationAngle % (2 * Math.PI))) % (2 * Math.PI);
      let winningIndex = Math.floor(finalAngle / segmentAngle) % numPockets;
      let winningPocket = rouletteOrder[winningIndex];
      document.getElementById("resultDisplay").textContent =
        `Result: ${winningPocket.number} (${winningPocket.color.toUpperCase()})`;
      evaluateBets(winningPocket);
    }
    
    /********** Evaluate Bets & Payout **********/
    function evaluateBets(wp) {
      let totalWin = 0;
      let totalBet = 0;
      // Somma le puntate totali piazzate.
      for (let key in bets.numbers) totalBet += Number(bets.numbers[key]);
      for (let key in bets.color) totalBet += Number(bets.color[key]);
      for (let key in bets.evenodd) totalBet += Number(bets.evenodd[key]);
      
      // Scommesse sui numeri: paga 35:1
      if (bets.numbers[wp.number]) {
        totalWin += bets.numbers[wp.number] * 35;
      }
      // Scommesse sul colore: paga 1:1 (solo se wp.number !== 0)
      if (wp.number !== 0 && bets.color[wp.color]) {
        totalWin += bets.color[wp.color];
      }
      // Scommesse Odd/Even: paga 1:1 (solo se wp.number !== 0)
      if (wp.number !== 0) {
        let oe = (wp.number % 2 === 0) ? "even" : "odd";
        if (bets.evenodd[oe]) totalWin += bets.evenodd[oe];
      }
      
      if (totalWin > 0) {
        bank += totalWin;
        document.getElementById("resultDisplay").textContent += ` – You win $${totalWin}!`;
      } else {
        bank -= totalBet;
        document.getElementById("resultDisplay").textContent += ` – You lose $${totalBet}.`;
      }
      updateBankDisplay();
      resetBets();
      updateHighScore();
    }
    
    function resetBets() {
      bets = { numbers: {}, color: {}, evenodd: {} };
      document.querySelectorAll(".betCell").forEach(cell => {
        let n = cell.getAttribute("data-number");
        cell.innerHTML = n;
      });
      document.querySelectorAll("#colorBetArea .betOption").forEach(opt => {
        let col = opt.getAttribute("data-value");
        opt.innerHTML = col.toUpperCase();
      });
      document.querySelectorAll("#evenoddBetArea .betOption").forEach(opt => {
        let oe = opt.getAttribute("data-value");
        opt.innerHTML = oe.toUpperCase();
      });
    }
    
    /********** High Score Board Management **********/
    function updateHighScore() {
      let player = document.getElementById("playerNameInput").value;
      let entry = { name: player, bank: bank };
      highScores.push(entry);
      highScores.sort((a, b) => b.bank - a.bank);
      highScores = highScores.slice(0, 5);
      localStorage.setItem("rouletteHighScores", JSON.stringify(highScores));
      renderHighScores();
    }
    
    function renderHighScores() {
      const tbody = document.getElementById("scoreboardBody");
      tbody.innerHTML = "";
      highScores.forEach(entry => {
        let row = document.createElement("tr");
        let nameCell = document.createElement("td");
        nameCell.textContent = entry.name;
        let bankCell = document.createElement("td");
        bankCell.textContent = "$" + entry.bank;
        row.appendChild(nameCell);
        row.appendChild(bankCell);
        tbody.appendChild(row);
      });
    }
    
    /********** Spin Button & Wheel Spin **********/
    document.getElementById("spinButton").addEventListener("click", function() {
      if (bank <= 0) {
        document.getElementById("resultDisplay").textContent = "You are out of money!";
        return;
      }
      // Controlla se sono state piazzate scommesse
      if (
        Object.keys(bets.numbers).length === 0 &&
        Object.keys(bets.color).length === 0 &&
        Object.keys(bets.evenodd).length === 0
      ) {
        document.getElementById("resultDisplay").textContent = "Place your bets first!";
        return;
      }
      // Avvia lo spin
      spinVelocity = 0.3 + Math.random() * 0.2;
      spinning = true;
      animateWheel();
      // Rimuovo resetBets() qui per non cancellare le scommesse prematuramente:
      // resetBets();
    });
    
    /********** New Game Setup **********/
    function newGameSetup() {
      bank = 1000;
      updateBankDisplay();
      resetBets();
      rotationAngle = 0;
      spinVelocity = 0;
      spinning = false;
      drawWheel();
    }
    
    /********** INITIALIZATION **********/
    newGameSetup();
    renderHighScores();
    
