const gridWidth = 13;
const gridHeight = 8;

let selectedCell = null;
const clickedCells = []; // Cells clicked by the player
let ghostPosition;

let ghosts =1;
let busts = 2;
let score = 100;
let endgame = false;
let isView = false; // hide/show the probabilities
let isPercentageMode = false;

const G = []; // Ghost location domain

for (let y = 0; y < gridHeight; y++)
    for (let x = 0; x < gridWidth; x++)
        G.push({ x, y });

//initialize the domain with all cells positions
const S = ['red', 'orange', 'yellow', 'green']; // Sensor reading domain
const P = {'red': 0.6500, 'orange': 0.20, 'yellow': 0.10, 'green': 0.050}; // Conditional probability distributions P(Color | Distance from Ghost)
let probabilities = Array(gridHeight).fill().map(() => Array(gridWidth).fill(1 / (gridWidth * gridHeight)));
//Displaying the exact probability number in the firstt state
let hasClicked = false;

let bustedCells = [];

// Direction arrows
const arrows = {
    N: "↑",
    NE: "↗",
    E: "→",
    SE: "↘",
    S: "↓",
    SW: "↙",
    W: "←",
    NW: "↖",
};

const cellDirections = Array(gridHeight)
    .fill()
    .map(() => Array(gridWidth).fill('')); // Store directions for each cel

const cellColors = Array(gridHeight)
    .fill()
    .map(() => Array(gridWidth).fill(''));

let selectedCells = [];

//Direction button
let isDirection = false;

// Initialize the game
function initializeGame() {
    const grid = document.getElementById('gameGrid');
    document.getElementById('endGameScreen').style.display = 'none'; 
    document.getElementById('bustButton').disabled = true;
    grid.innerHTML = '';
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.onclick = () => selectCell(x, y);
            grid.appendChild(cell);
        }
    }
    placeGhost();
    // Initialize uniform probabilities for direction
    const totalCells = gridWidth * gridHeight;
    directionalProbabilities = Array(gridHeight)
        .fill()
        .map(() => Array(gridWidth).fill(1 / totalCells));
    updateDisplay();
}

// Place the ghost randomly
/* PlaceGhost() returns xg, yg */
function placeGhost() {
    const random = Math.floor(Math.random() * G.length); //take a randome position from the domain G
    const xg = G[random].x;
    const yg = G[random].y;
    ghostPosition = { x: xg, y: yg };
    console.log("Ghost positioned at:", ghostPosition);
    return ghostPosition = { xg, yg };
}

// Update the display
function updateDisplay() {
    document.getElementById('ghosts').textContent = ghosts;
    document.getElementById('score').textContent = score;
    document.getElementById('busts').textContent = busts;

    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        
        // Reset cell content
        // cell.textContent = '';
        // cell.style.color = 'transparent';

        cell.textContent = '';
        cell.style.backgroundColor = '';
        cell.style.borderColor = '';
        cell.style.color = 'transparent';
        
        // Show colors in View mode
        if (isView && !isDirection) {
            // console.log("view mode and has click status", hasClicked)
            let probability = probabilities[y][x];
            if (isPercentageMode) {
                probability = probability.toFixed(2);
                probability = parseInt(probability *= 100);
            }
            cell.textContent = hasClicked ? (isPercentageMode ? probability + " %" : probability.toFixed(2)) : (isPercentageMode ? probability + " %" : probability.toFixed(4));
            cell.style.fontSize = hasClicked ? "16px" : "12px";
            cell.style.color = probability > 0 ? 'black' : 'darkGray';
            cell.style.backgroundColor = cellColors[y][x];
            cell.style.borderColor = cellColors[y][x];
        }
        
        if (isDirection) {
            // console.log("direction mode and has click status:", hasClicked);
            let dirProb = directionalProbabilities[y][x];
            // Display uniform probabilities if no cell has been clicked
            if (!hasClicked) {
                dirProb = 1 / (gridWidth * gridHeight); // Uniform value for the first state
            }
            // cell.textContent = hasClicked ? dirProb.toFixed(2) : dirProb.toFixed(4);
            if (isPercentageMode) {
                dirProb = dirProb.toFixed(2);
                dirProb = parseInt(dirProb *= 100);
            }
            // Display directional probability or arrow
            const arrow = cellDirections[y][x];
            if (arrow) {
                cell.textContent = arrow;
                cell.style.fontSize = "25px";
                cell.style.color = 'black';
                cell.style.backgroundColor = "darkGray";
                // console.log(arrow);
                if(arrow === '👻'){
                    cell.style.backgroundColor = "black";
                }
            } else {
                cell.textContent = hasClicked ? (isPercentageMode ? dirProb + " %" : dirProb.toFixed(2)) : (isPercentageMode ? dirProb + " %" : dirProb.toFixed(4));
                cell.style.fontSize = hasClicked ? "16px" : "12px";
                cell.style.color = dirProb > 0 ? 'black' : 'darkGray';
            }
        }

        if (isView && isDirection) {
            let dirProb = directionalProbabilities[y][x];
            let combinedProbability = 0;
            combinedProbability = probabilities[y][x] * dirProb;

            if (hasClicked) {
                // Combining color and direction probabilities
                // Normalizing combined probabilities across all cells
                const totalCombinedProbability = directionalProbabilities.flat().reduce((sum, dirProb, i) => {
                    const xIndex = i % gridWidth;
                    const yIndex = Math.floor(i / gridWidth);
                    return sum + probabilities[yIndex][xIndex] * dirProb;
                }, 0);
                if (totalCombinedProbability > 0) {
                    combinedProbability /= totalCombinedProbability; // Normalize              
                    if (isPercentageMode) {
                        combinedProbability = combinedProbability.toFixed(2);
                        combinedProbability = parseInt(combinedProbability *= 100);
                    }
                }

                // console.log(`combined proba: ${combinedProbability}`);
        
                // Display the result based on the direction arrow
                const arrow = cellDirections[y][x];
                if (arrow) {
                    cell.textContent = arrow;
                    cell.style.fontSize = "25px";
                    cell.style.color = 'black';
                } else {
                    cell.textContent = isPercentageMode ? combinedProbability + " %" : combinedProbability.toFixed(2);
                    cell.style.fontSize = hasClicked ? "16px" : "12px";
                    cell.style.color = combinedProbability > 0 ? 'black' : 'darkGray';
                }
        
                cell.style.backgroundColor = cellColors[y][x];
                cell.style.fontSize = "16px";
            } else {
                // Default probabilities before any clicks
                dirProb = 1 / (gridWidth * gridHeight);
                if (isPercentageMode) {
                    dirProb = dirProb.toFixed(2);
                    dirProb = parseInt(dirProb *= 100);
                }
                cell.textContent = isPercentageMode ? dirProb + " %" : dirProb.toFixed(4);
                cell.style.fontSize = "12px";
                cell.style.color = "black";
            }
        }
        if (!isView && !isDirection) {
            let probability = probabilities[y][x];
            // Highlight selected cells when no mode is active
            selectedCells.forEach(({ x, y }) => {
                const cell = document.querySelector(`.cell[data-x='${x}'][data-y='${y}']`);
                
                if (cell) {
                    if (x === ghostPosition.xg && y === ghostPosition.yg) {
                        cell.textContent = "👻";
                    } 
                    cell.style.color = probability > 0 ? 'black' : 'darkGray';
                    cell.style.backgroundColor = cellColors[y][x];
                }
            });
        }
        
    });
    if(score === 0){
        document.getElementById('messages').innerHTML += "Game Over, your score is 0% (No more clicks left)!<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
        document.getElementById('bustButton').disabled = true;
        endgame = true;
        document.getElementById('endGameScreen').style.display = 'flex'; 
        document.getElementById('endGameMessage').innerHTML = "Game Over";
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                sensorReading(x,y);
            }
        }
    }
}

// Handle cell selection
function selectCell(x, y) {
    // Check if the cell has already been clicked
    const alreadyClicked = selectedCells.some(cell => cell.x === x && cell.y === y);
    if (!endgame)
    if (score > 0){
        if(!alreadyClicked) score -= 10; 
        selectedCell = { x, y };
        const cells = document.querySelectorAll('.cell');
        cells.forEach(c => c.classList.remove('selected')); // Remove previous selection
        const cell = document.querySelector(`.cell[data-x='${x}'][data-y='${y}']`);
        cell.classList.add('selected'); // Highlight the selected cell
        // Enable the Bust & Time button when a cell is selected
        document.getElementById('bustButton').disabled = false;
        
        const color = DistanceSense(x, y, 0, ghostPosition.xg, ghostPosition.yg);
        const direction = determineDirection(x, y, ghostPosition.xg, ghostPosition.yg);
        
        // console.log("direction: ", direction)

        cellColors[y][x] = color; // Store the color

        // Save the clicked cell's direction and update probabilities
        cellDirections[y][x] = direction;

        selectedCells.push({ x, y, color, direction });
        
        // Update directional probabilities
        sensorReading(x, y);
        updateProbabilitiesWithDirection(x, y, direction);
        
        logMessages(x, y);

        // if (isView)
        //     cell.style.borderColor = "red";
        //Displaying 4 numbers after comma in the first state
        if (!hasClicked) 
            hasClicked = true;
        
        updateDisplay();

    } else{
        document.getElementById('messages').innerHTML += "Game Over!<br>";
        // End the game
        endgame = true;
        document.getElementById('endGameScreen').style.display = 'flex'; 
        document.getElementById('endGameMessage').innerHTML = "Game Over";
        // Disable buttons
        document.getElementById('bustButton').disabled = true;
        //document.getElementById('timeButton').disabled = true;
        // Show solution
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                sensorReading(x,y);
            }
        }
    }
}

// Handle bust button
function bust() {

    const bustButton = document.getElementById('bustButton'); 

    if (!selectedCell) {
        document.getElementById('messages').innerHTML += "Please select a cell to bust !<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
        return;
    }
    
    const { x, y } = selectedCell;
    
    // Check if the cell has already been busted
    const alreadyBusted = bustedCells.some(cell => cell.x === x && cell.y === y);
    if (alreadyBusted) {
        document.getElementById('messages').innerHTML += "This cell has already been busted ! (Choose another cell)<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
        return;
    }

    // Add the selected cell to the bustedCells array
    bustedCells.push({ x, y });

    busts -= 1;  // Deduct a bust
    if (score > 0){
        if (selectedCell && ghostPosition.xg === selectedCell.x && ghostPosition.yg === selectedCell.y) {
            ghosts -= 1; 
            document.getElementById('messages').innerHTML += "You busted the ghost 👻 !<br>";
            document.getElementById('endGameScreen').style.display = 'flex'; 
            document.getElementById('endGameMessage').innerHTML = `You busted the ghost 👻, with a score of ${score}%`;
            // End the game
            endgame = true;
            // Trigger confetti
            confetti({
                particleCount: 300,
                spread: 100,
                origin: { y: 0.6 },
                decay: 0.94,
                startVelocity: 30,
            });
        } else {
            score -= 10;
            // score -= 10; // Deduct score for wrong guess
            document.getElementById('messages').innerHTML += `<span style="color: red">Wrong guess, 10 points deducted from your score ! </span><br>`;
            // Game over case (no more busts)
            if (busts <= 0 || score < 10) {
                document.getElementById('messages').innerHTML += "Game Over!<br>";
                document.getElementById('endGameScreen').style.display = 'flex'; 
                document.getElementById('endGameMessage').innerHTML = "Game Over";
                // End the game
                endgame = true;
                document.getElementById('bustButton').disabled = true;
                for (let y = 0; y < gridHeight; y++) {
                    for (let x = 0; x < gridWidth; x++) {
                        sensorReading(x,y);
                    }
                }
            }

        }
        if (endgame){
            // Disable buttons
            document.getElementById('bustButton').disabled = true;
            //document.getElementById('timeButton').disabled = true;
            // Show solution
            for (let y = 0; y < gridHeight; y++) {
                for (let x = 0; x < gridWidth; x++) {
                    sensorReading(x,y);
                }
            }
        }
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
        updateDisplay();
        if(busts === 1){
            bustButton.classList.add('bust-last-change'); 
            bustButton.classList.remove('bust-button');
        }
        else{
            bustButton.classList.add('bust-button');
            bustButton.classList.remove('bust-last-change'); 
        }
    }
    else{
        // document.getElementById('messages').innerHTML += "Game Over!<br>";
        document.getElementById('endGameScreen').style.display = 'flex'; 
        document.getElementById('endGameMessage').innerHTML = "Game Over";
        // End the game
        endgame = true;
        if (endgame){
            // Disable buttons
            document.getElementById('bustButton').disabled = true;
            //document.getElementById('timeButton').disabled = true;
            // Show solution
            for (let y = 0; y < gridHeight; y++) {
                for (let x = 0; x < gridWidth; x++) {
                    sensorReading(x,y);
                }
            }
        }
    }
}

function DistanceSense(xclk, yclk, dist, xg, yg) {
    dist = Math.abs(xclk - xg) + Math.abs(yclk - yg);
    if (dist === 0) return S[0];
    if (dist <= 2) return S[1];
    if (dist <= 4) return S[2];
    return S[3];
}

// Sensor reading: display color based on distance
function sensorReading(x, y) {
    const color =  DistanceSense(x, y, 0, ghostPosition.xg, ghostPosition.yg);
    // Display the color on the clicked cell
    const cell = document.querySelector(`.cell[data-x='${x}'][data-y='${y}']`);
    cell.style.backgroundColor = color;
    cell.style.borderColor = color;
    UpdatePosteriorGhostLocationProbabilities(color, x, y); 
}

// Update probabilities using Bayesian inference
/* UpdatePosteriorGhostLocationProbabilities(Color: c, xclk, yclk)
updates the probabilities for each location based on the color c obtained/sensed at position xclk, yclk */
function UpdatePosteriorGhostLocationProbabilities(c, xclk, yclk) {
    let totalProbability = 0;
    clickedCells.push({ xclk, yclk }); // Add the clicked cell to the list of clicked cells

    if (c === 'red') { // If the ghost is in the selected cell
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                probabilities[y][x] = (y === yclk && x === xclk) ? 1 : 0;
            }
        }
    } else {
        probabilities[yclk][xclk] = 0;  // Set the probability of the clicked cell to 0 if it’s not red

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const distance = Math.abs(x - xclk) + Math.abs(y - yclk);

                // Determine expected color based on distance from the clicked cell
                let expectedColor;
                if (distance === 0)
                    expectedColor = 'red';
                else if (distance <= 2)
                    expectedColor = 'orange';
                else if (distance <= 4)
                    expectedColor = 'yellow';
                else
                    expectedColor = 'green';
            

                // Apply the probability update rule based on the color match and set 0 for mismatches
                if (c === expectedColor) {
                    probabilities[y][x] *= P[c];
                } else {
                    probabilities[y][x] = 0;
                }

                // Accumulate total probability for normalization
                totalProbability += probabilities[y][x];
            }
        }

        // Normalize the probabilities so that they sum to 1
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                probabilities[y][x] /= totalProbability; // Normalize each probability
            }
        }
    }
}

// Update directional probabilities 
function updateProbabilitiesWithDirection() {
    // Reset the directional probabilities
    directionalProbabilities = Array(gridHeight)
        .fill()
        .map(() => Array(gridWidth).fill(0));

    let intersectedCells = []; // To store the intersected cells
    let totalProbability = 0;

    // For each selected cell and direction, get its target cells
    selectedCells.forEach(({ x, y, direction }, index) => {
        const cellsInDirection = getCellsInDirectionExtended({ x, y }, direction);

        if (index === 0) {
            // First selected cell - initialize intersectedCells
            intersectedCells = cellsInDirection;
        } else {
            // Calculate intersection with previously tracked cells
            intersectedCells = intersectedCells.filter(cell =>
                cellsInDirection.some(target => target.x === cell.x && target.y === cell.y)
            );
        }
    });

    // Distribute probabilities among intersected cells
    if (intersectedCells.length > 0) {
        const probShare = 1 / intersectedCells.length;

        intersectedCells.forEach(({ x, y }) => {
            directionalProbabilities[y][x] += probShare;
        });
    }

    // Normalize probabilities across the intersected cells
    totalProbability = directionalProbabilities.flat().reduce((sum, prob) => sum + prob, 0);

    if (totalProbability > 0) {
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                directionalProbabilities[y][x] /= totalProbability;
            }
        }
    }
}

function getCellsInDirectionExtended(startCell, direction) {
    const { x, y } = startCell;
    const cells = [];

    switch (direction) {
        case arrows.N: // North
            for (let i = y - 1; i >= 0; i--) cells.push({ x, y: i });
            break;
        case arrows.S: // South
            for (let i = y + 1; i < gridHeight; i++) cells.push({ x, y: i });
            break;
        case arrows.E: // East
            for (let i = x + 1; i < gridWidth; i++) cells.push({ x: i, y });
            break;
        case arrows.W: // West
            for (let i = x - 1; i >= 0; i--) cells.push({ x: i, y });
            break;

        case arrows.NE: // North-East
            for (let i = 1; x + i < gridWidth; i++) {
                for (let j = 1; y - j >= 0; j++) {
                    cells.push({ x: x + i, y: y - j });
                }
            }
            break;

        case arrows.SE: // South-East
            for (let i = 1; x + i < gridWidth; i++) {
                for (let j = 1; y + j < gridHeight; j++) {
                    cells.push({ x: x + i, y: y + j });
                }
            }
            break;

        case arrows.SW: // South-West
            for (let i = 1; x - i >= 0; i++) {
                for (let j = 1; y + j < gridHeight; j++) {
                    cells.push({ x: x - i, y: y + j });
                }
            }
            break;

        case arrows.NW: // North-West
            for (let i = 1; x - i >= 0; i++) {
                for (let j = 1; y - j >= 0; j++) {
                    cells.push({ x: x - i, y: y - j });
                }
            }
            break;

        default:
            // console.log("Ghost cell", direction);
            return [];
    }

    return cells;
}

function determineDirection(x, y, ghostX, ghostY) {
    const dx = ghostX - x;
    const dy = ghostY - y;

    if (dx === 0 && dy < 0) return arrows.N;
    if (dx > 0 && dy < 0) return arrows.NE;
    if (dx > 0 && dy === 0) return arrows.E;
    if (dx > 0 && dy > 0) return arrows.SE;
    if (dx === 0 && dy > 0) return arrows.S;
    if (dx < 0 && dy > 0) return arrows.SW;
    if (dx < 0 && dy === 0) return arrows.W;
    if (dx < 0 && dy < 0) return arrows.NW;

    return '👻'; // Default fallback if the ghost is directly on the clicked cell
}


function logMessages(x, y) {
    const messages = document.getElementById('messages');
    const selectedDirection = cellDirections[y][x];
    const selectedColor = cellColors[y][x];

    // Combine View and Direction modes
    if (isView && isDirection) {
        if (selectedDirection && selectedColor) {
            switch (selectedDirection) {
                case arrows.NE:
                    messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">The ghost is in the NorthEast, and is ${getDistanceMessage(selectedColor)}</span><br>`;
                    break;
                case arrows.NW:
                    messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">The ghost is in the NorthWest, and is ${getDistanceMessage(selectedColor)}</span><br>`;
                    break;
                case arrows.SE:
                    messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">The ghost is in the SouthEast, and is ${getDistanceMessage(selectedColor)}</span><br>`;
                    break;
                case arrows.SW:
                    messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">The ghost is in the SouthWest, and is ${getDistanceMessage(selectedColor)}</span><br>`;
                    break;
                case arrows.N:
                    messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">The ghost is directly North, and is ${getDistanceMessage(selectedColor)}</span><br>`;
                    break;
                case arrows.S:
                    messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">The ghost is directly South, and is ${getDistanceMessage(selectedColor)}</span><br>`;
                    break;
                case arrows.E:
                    messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">The ghost is directly East, and is ${getDistanceMessage(selectedColor)}</span><br>`;
                    break;
                case arrows.W:
                    messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">The ghost is directly West, and is ${getDistanceMessage(selectedColor)}</span><br>`;
                    break;
                default:
                    messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">Bust The Ghost!</span><br>`;
            }
        }
    } else if (isView) {
        if (selectedColor !== "red") {
            messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">The ghost is ${getDistanceMessage(selectedColor)}.</span><br>`;
        } else {
            messages.innerHTML += `<span style="background-color: ${selectedColor.toLowerCase()}">${getDistanceMessage(selectedColor)}.</span><br>`;
        }
    } else if (isDirection) {
        if (selectedDirection) {
            switch (selectedDirection) {
                case arrows.NE:
                    messages.innerHTML += `<span>The ghost is in the NorthEast.</span><br>`;
                    break;
                case arrows.NW:
                    messages.innerHTML += `<span>The ghost is in the NorthWest.</span><br>`;
                    break;
                case arrows.SE:
                    messages.innerHTML += `<span>The ghost is in the SouthEast.</span><br>`;
                    break;
                case arrows.SW:
                    messages.innerHTML += `<span>The ghost is in the SouthWest.</span><br>`;
                    break;
                case arrows.N:
                    messages.innerHTML += `<span>The ghost is directly North.</span><br>`;
                    break;
                case arrows.S:
                    messages.innerHTML += `<span>The ghost is directly South.</span><br>`;
                    break;
                case arrows.E:
                    messages.innerHTML += `<span>The ghost is directly East.</span><br>`;
                    break;
                case arrows.W:
                    messages.innerHTML += `<span>The ghost is directly West.</span><br>`;
                    break;
                default:
                    messages.innerHTML += `<span>Bust The Ghost!</span><br>`;
            }
        }
    } else {
        messages.innerHTML += `<span style="background-color: lightblue">Sensor at (${x}, ${y})</span><br>`;
    }

    document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
}

function getDistanceMessage(color) {
    switch (color) {
        case 'red':
            return 'Bust The Ghost!!';
        case 'orange':
            return '1-2 cells away (close)';
        case 'yellow':
            return '3-4 cells away';
        case 'green':
            return 'far with more than 5 cells';
        default:
            return 'unknown';
    }
}

// Handle view button
function toggleView() {
    isView = !isView;
    const viewButton = document.getElementById('viewButton');
    viewButton.innerHTML = `View ${isView ? '✅' : ''}`;
    updateDisplay();
    if (isView && isDirection) {
        document.getElementById('messages').innerHTML += "*** Direction and color modes activated ***<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
    }
    else if (isView) {
        document.getElementById('messages').innerHTML += "*** Color mode activated ***<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
    }else if(!isView) {
        document.getElementById('messages').innerHTML += "*** Color mode inactivated ***<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
    }
    if(isView){
        viewButton.classList.add('active'); 
        viewButton.classList.remove('inactive')
    }
    else{
        viewButton.classList.add('inactive'); 
        viewButton.classList.remove('active');
    }
}

function toggleDirection() {
    isDirection = !isDirection;
    const directionButton = document.getElementById('directionButton');
    directionButton.innerHTML = `Directions ${isDirection ? '✅' : ''}`;
    updateProbabilitiesWithDirection();
    updateDisplay();
    if (isView && isDirection) {
        document.getElementById('messages').innerHTML += "*** Color and direction modes activated ***<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
    }else if (isDirection) {
        document.getElementById('messages').innerHTML += "*** Direction mode activated ***<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
    }else if(!isDirection) {
        document.getElementById('messages').innerHTML += "*** Direction mode inactivated ***<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
    }
    if(isDirection){
        directionButton.classList.add('active'); 
        directionButton.classList.remove('inactive')
    }
    else{
        directionButton.classList.add('inactive'); 
        directionButton.classList.remove('active');
    }
}

function togglePercentage() {
    isPercentageMode = !isPercentageMode;
    const percentageButton = document.getElementById('percentageToggle');
    percentageButton.innerHTML = isPercentageMode
        ? "Convert to Fractional"
        : "Convert to Percentage %";
    updateDisplay(); // Refresh the display
    // percentageButton.style.backgroundColor = isPercentageMode ? "orange" : "#00aeff";
    // percentageButton.style.borderColor = isPercentageMode ? "orange" : "blue";
    if(isPercentageMode) {
        percentageButton.classList.add('active-percentage'); 
        percentageButton.classList.remove('inactive-percentage')
        document.getElementById('messages').innerHTML += "*** Percentage probabilities !! ***<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
    }else{
        percentageButton.classList.add('inactive-percentage'); 
        percentageButton.classList.remove('active-percentage');
        document.getElementById('messages').innerHTML += "*** Fractional probabilities !! ***<br>";
        document.getElementById('messagesBox').scrollTop = messagesBox.scrollHeight;
    }
}

//Handle new Game button
function newGame(){
    location.reload(); 
}

// Initialize the game on load
window.onload = initializeGame;
