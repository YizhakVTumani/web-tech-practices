const inputField = document.querySelector('.cart-redactor-input');
const addButton = document.querySelector('.add-to-list-button');
const listContainer = document.querySelector('.cart-redactor');
const badgeContainers = document.getElementsByClassName('item-row');
const leftBadgeContainer = badgeContainers[0];
const boughtBadgeContainer = badgeContainers[1];

function saveState() {
    let rowsHTML = "";
    const currentRows = listContainer.querySelectorAll('.row');
    for (let i = 0; i < currentRows.length; i++) {
        rowsHTML += currentRows[i].outerHTML;
    }
    localStorage.setItem('rows', rowsHTML);
    localStorage.setItem('left', leftBadgeContainer.innerHTML);
    localStorage.setItem('bought', boughtBadgeContainer.innerHTML);
}

function loadState() {
    if (localStorage.getItem('rows')) {
        const currentRows = listContainer.querySelectorAll('.row');
        for (let i = 0; i < currentRows.length; i++) {
            currentRows[i].remove();
        }
        listContainer.insertAdjacentHTML('beforeend', localStorage.getItem('rows'));
        leftBadgeContainer.innerHTML = localStorage.getItem('left');
        boughtBadgeContainer.innerHTML = localStorage.getItem('bought');
    }
}

loadState();

function addItem() {
    const itemName = inputField.value.trim();

    if (itemName === "") {
        return;
    }

    const newRow = document.createElement('div');
    newRow.className = 'row';

    newRow.innerHTML = 
        '<span class="item">' + itemName + '</span>' +
        '<div class="counter-group">' +
            '<button class="minus-button" data-tooltip="Decrease element quantity" style="background-color: #f19f9f;">-</button>' +
            '<span class="counter">1</span>' +
            '<button class="plus-button" data-tooltip="Increase element quantity">+</button>' +
        '</div>' +
        '<div class="action-group">' +
            '<button class="bought-button" data-tooltip="Mark as bought">Bought</button>' +
            '<button class="delete-button" data-tooltip="Delete from cart">✖</button>' +
        '</div>';

    listContainer.appendChild(newRow);

    const newBadge = document.createElement('div');
    newBadge.className = 'item-in-list';
    newBadge.innerHTML = itemName + ' <span class="counter-in-list">1</span>';
    leftBadgeContainer.appendChild(newBadge);

    inputField.value = '';
    inputField.focus();
    saveState();
}

addButton.addEventListener('click', addItem);

function handleListClicks(event) {
    const row = event.target.closest('.row');
    if (!row) return;

    const text = row.querySelector('.item');
    if (!text) return;

    const itemName = text.textContent.trim();
    let buttons = row.querySelectorAll('button');

    let targetBadge = null;
    const allBadges = document.querySelectorAll('.item-in-list');
    for (let i = 0; i < allBadges.length; i++) {
        if (allBadges[i].childNodes[0].textContent.trim() === itemName) {
            targetBadge = allBadges[i];
            break;
        }
    }

    if (event.target.classList.contains('item')) {
        if (row.querySelector('.not-bought-button')) return;

        const span = event.target;
        const oldName = span.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldName;
        
        input.style.width = '100%';
        input.style.maxWidth = '150px';
        input.style.fontFamily = 'inherit';
        input.style.fontSize = 'inherit';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '3px';
        input.style.padding = '2px';

        span.replaceWith(input);

        input.addEventListener('blur', function() {
            const newName = input.value.trim() || oldName;
            span.textContent = newName;
            input.replaceWith(span);

            if (targetBadge) {
                targetBadge.childNodes[0].textContent = newName + " ";
            }
            saveState();
        });

        return;
    }

    if (event.target.classList.contains('plus-button')) {
        const counterSpan = row.querySelector('.counter');
        let count = parseInt(counterSpan.textContent);
        count++;
        counterSpan.textContent = count;

        if (count > 1) {
            row.querySelector('.minus-button').style.backgroundColor = '';
        }

        if (targetBadge) {
            targetBadge.querySelector('.counter-in-list').textContent = count;
        }
        saveState();
    }

    if (event.target.classList.contains('minus-button')) {
        const counterSpan = row.querySelector('.counter');
        let count = parseInt(counterSpan.textContent);
        
        if (count > 1) {
            count--;
            counterSpan.textContent = count;

            if (count === 1) {
                row.querySelector('.minus-button').style.backgroundColor = '#f19f9f';
            }

            if (targetBadge) {
                targetBadge.querySelector('.counter-in-list').textContent = count;
            }
        }
        saveState();
    }

    if (event.target.classList.contains('delete-button')) {
        row.remove();
        if (targetBadge) {
            targetBadge.remove();
        }
        saveState();
        return;
    }

    if (event.target.classList.contains('bought-button')) {
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].classList.add('hidden');
        }
        text.style.textDecoration = 'line-through';
        text.style.color = '#888';

        const newButton = document.createElement('button');
        newButton.className = 'not-bought-button';
        newButton.textContent = 'Not bought';
        newButton.setAttribute('data-tooltip', 'Mark as not bought');
        row.querySelector('.action-group').appendChild(newButton);

        if (targetBadge) {
            targetBadge.style.textDecoration = 'line-through';
            targetBadge.style.color = '#888';
            boughtBadgeContainer.appendChild(targetBadge);
        }
        saveState();
    }

    if (event.target.classList.contains('not-bought-button')) {
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].classList.remove('hidden');
        }
        text.style.textDecoration = 'none';
        text.style.color = 'black';
        event.target.remove();

        if (targetBadge) {
            targetBadge.style.textDecoration = 'none';
            targetBadge.style.color = 'black';
            leftBadgeContainer.appendChild(targetBadge);
        }
        saveState();
    }
}

listContainer.addEventListener('click', handleListClicks);