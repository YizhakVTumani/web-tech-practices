const ws = io();
        
let isActiveTurn = false;
let isPlaying = false;
let health = 20;

let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
let fleet = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

let playerGrid = {};
let opponentGrid = {};

for (let i = 0; i < letters.length; i++) {
    let letter = letters[i];
    for (let num = 1; num <= 10; num++) {
        playerGrid[letter + '-' + num] = 0;
        opponentGrid[letter + '-' + num] = 0;
    }
}

function canPlace(startX, startY, size, isHoriz) {
    let cells = [];
    let yId = letters.indexOf(startY);
    
    for (let i = 0; i < size; i++) {
        let x = startX + (isHoriz ? i : 0);
        let y = yId + (isHoriz ? 0 : i);
        
        if (x < 1 || x > 10 || y < 0 || y >= 10) {
            return null;
        }
        cells.push({ x: x, y: y });
    }
    
    for (let i = 0; i < cells.length; i++) {
        let c = cells[i];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                let ny = c.y + dy;
                let nx = c.x + dx;
                
                if (ny >= 0 && ny < 10 && nx >= 1 && nx <= 10) {
                    let key = letters[ny] + '-' + nx;
                    if (playerGrid[key] === 1) {
                        return null;
                    }
                }
            }
        }
    }
    return cells;
}

function setupRandomFleet() {
    for (let key in playerGrid) {
        playerGrid[key] = 0;
    }
    
    for (let i = 0; i < fleet.length; i++) {
        let shipSize = fleet[i];
        let placed = false;
        
        while (!placed) {
            let rx = Math.floor(Math.random() * 10) + 1;
            let ry = letters[Math.floor(Math.random() * 10)];
            let hz = Math.random() > 0.5;
            
            let validCells = canPlace(rx, ry, shipSize, hz);
            
            if (validCells !== null) {
                for (let j = 0; j < validCells.length; j++) {
                    let c = validCells[j];
                    playerGrid[letters[c.y] + '-' + c.x] = 1;
                }
                placed = true;
            }
        }
    }
    health = 20;
}

setupRandomFleet();

document.getElementById('btn-gen').onclick = function() {
    if (isPlaying) {
        alert("Розстановку змінювати не можна");
        return;
    }
    setupRandomFleet();
    wdrPlayer.updateData({ data: buildData(playerGrid) });
};

function buildData(grid) {
    let result = [];
    for (let key in grid) {
        let parts = key.split('-');
        let rowName = parts[0];
        let colName = parts[1];
        
        if (colName.length === 1) {
            colName = "0" + colName;
        }
        
        result.push({ 
            "Y": rowName, 
            "X": colName, 
            "V": grid[key] 
        });
    }
    return result;
}

function showInfo(msg, col) {
    let el = document.getElementById('info-banner');
    el.innerText = msg;
    el.style.color = col;
}

let wdrConfig = {
    slice: { 
        rows: [{ uniqueName: "Y" }], 
        columns: [{ uniqueName: "X" }], 
        measures: [{ uniqueName: "V", aggregation: "sum" }] 
    },
    options: { 
        grid: { showGrandTotals: "off", showFilter: false, showHeaders: false, showHierarchyCaptions: false } 
    }
};

let colorRules = [
    { formula: "#value == 0", format: { backgroundColor: "#ecf0f1", color: "#ecf0f1" } },
    { formula: "#value == 1", format: { backgroundColor: "#34495e", color: "#34495e" } },
    { formula: "#value == 2", format: { backgroundColor: "#bdc3c7", color: "#bdc3c7" } },
    { formula: "#value == 3", format: { backgroundColor: "#e74c3c", color: "#e74c3c" } }
];

let wdrPlayer = new WebDataRocks({
    container: "#wdr-player", 
    toolbar: false,
    report: { 
        dataSource: { data: buildData(playerGrid) }, 
        slice: wdrConfig.slice,
        options: wdrConfig.options,
        conditions: colorRules 
    }
});

let wdrEnemy = new WebDataRocks({
    container: "#wdr-enemy", 
    toolbar: false,
    report: { 
        dataSource: { data: buildData(opponentGrid) }, 
        slice: wdrConfig.slice,
        options: wdrConfig.options,
        conditions: [ colorRules[0], colorRules[2], colorRules[3] ] 
    },
    cellclick: function(cell) {
        if (isPlaying === false) {
            alert("Чекаємо суперника");
            return;
        }
        if (isActiveTurn === false) {
            alert("Не ваш хід");
            return;
        }
        
        let targetX = parseInt(cell.columns[0].caption);
        let targetY = cell.rows[0].caption;
        let target = targetY + '-' + targetX;
        
        if (opponentGrid[target] >= 2) {
            return;
        }

        isActiveTurn = false;
        showInfo("Вогонь", "#95a5a6");
        ws.emit('fire', { target: target });
    }
});

ws.on('matchFound', function() {
    isPlaying = true;
    document.getElementById('btn-gen').disabled = true;
});

ws.on('turnUpdate', function(myTurn) {
    isActiveTurn = myTurn;
    if (myTurn === true) {
        showInfo("Стріляйте", "#27ae60");
    } else {
        showInfo("Чекайте пострілу ворога...", "#e67e22");
    }
});

ws.on('incomingFire', function(data) {
    let target = data.target;
    let hit = false;
    
    if (playerGrid[target] === 1) {
        hit = true;
        playerGrid[target] = 3;
        health = health - 1;
    } else {
        playerGrid[target] = 2;
    }
    
    wdrPlayer.updateData({ data: buildData(playerGrid) });
    
    let dead = false;
    if (health === 0) {
        dead = true;
    }
    
    ws.emit('fireResult', { 
        target: target, 
        status: playerGrid[target], 
        hit: hit, 
        dead: dead 
    });
    
    if (dead === true) {
        isPlaying = false;
        showInfo("Вас знищили", "#c0392b");
        return;
    }
    
    if (hit === true) {
        isActiveTurn = false;
        showInfo("Ворог стріляє знову", "#d35400");
    } else {
        isActiveTurn = true;
        showInfo("Ваш хід", "#27ae60");
    }
});

ws.on('fireResult', function(data) {
    opponentGrid[data.target] = data.status;
    wdrEnemy.updateData({ data: buildData(opponentGrid) });

    if (data.dead === true) {
        isPlaying = false; 
        isActiveTurn = false;
        showInfo("Перемога", "#27ae60");
        return;
    }
    
    if (data.hit === true) {
        isActiveTurn = true;
        showInfo("Є пробиття", "#27ae60");
    } else {
        isActiveTurn = false;
        showInfo("Мимо", "#e67e22");
    }
});
