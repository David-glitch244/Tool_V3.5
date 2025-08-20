let data = [];
let currentMode = 'bearing';

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('error');

    if (username === 'admin' && password === 'admin') {
        localStorage.setItem('loggedIn', 'true');
        window.location.href = 'tms.html';
    } else {
        error.textContent = 'Invalid username or password';
    }
}

function checkLogin() {
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index.html';
    }
}

function logout() {
    localStorage.removeItem('loggedIn');
    window.location.href = 'index.html';
}

function importExcel() {
    document.getElementById('file-input').click();
}

function handleFile(files) {
    if (files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        populateDates();
        alert('Excel file imported successfully.');
        document.getElementById('file-input').value = '';
    };
    reader.readAsBinaryString(file);
}

function populateTimes() {
    const select = document.getElementById('time-select');
    select.innerHTML = '<option value="all">All</option>';
    for (let h = 0; h < 24; h++) {
        const hh = h.toString().padStart(2, '0');
        select.innerHTML += `<option value="${hh}:00 - ${hh}:59">${hh}:00 - ${hh}:59</option>`;
    }
}

function populateGroups() {
    const select = document.getElementById('group-select');
    select.innerHTML = '<option value="all">All</option>';
    for (let g = 1; g <= 8; g++) {
        select.innerHTML += `<option value="${g}">Car ${g}</option>`;
    }
}

function populateDates() {
    const select = document.getElementById('date-select');
    select.innerHTML = '<option value="all">All</option>';
    if (data.length < 5) return;
    let dates = new Set();
    for (let i = 4; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        const timeStr = row[1];
        if (timeStr) {
            const datePart = timeStr.split(' ')[0];
            dates.add(datePart);
        }
    }
    const sortedDates = Array.from(dates).sort();
    sortedDates.forEach((date, index) => {
        const dayNum = index + 1;
        select.innerHTML += `<option value="${date}">Day ${dayNum}</option>`;
    });
}

function getSortedDates() {
    if (data.length < 5) return [];
    let dates = new Set();
    for (let i = 4; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        const timeStr = row[1];
        if (timeStr) {
            const datePart = timeStr.split(' ')[0];
            dates.add(datePart);
        }
    }
    return Array.from(dates).sort();
}

function showData() {
    const display = document.getElementById('data-display');
    if (data.length < 5) {
        display.innerHTML = '<p>No data imported yet.</p>';
        return;
    }
    const selectedDate = document.getElementById('date-select').value;
    const selectedTime = document.getElementById('time-select').value;
    const selectedGroup = document.getElementById('group-select').value;
    const dates = selectedDate === 'all' ? getSortedDates() : [selectedDate];
    const groups = {
        1: [11, 16, 21, 26, 31, 36, 41, 46],
        2: [61, 66, 71, 76, 81, 86, 91, 96],
        3: [111, 116, 121, 126, 131, 136, 141, 146],
        4: [161, 166, 171, 176, 181, 186, 191, 196],
        5: [211, 216, 221, 226, 231, 236, 241, 246],
        6: [261, 266, 271, 276, 281, 286, 291, 296],
        7: [311, 316, 321, 326, 331, 336, 341, 346],
        8: [361, 366, 371, 376, 381, 386, 391, 396]
    };
    const gs = selectedGroup === 'all' ? Array.from({length: 8}, (_, i) => i + 1) : [parseInt(selectedGroup)];
    const hours = selectedTime === 'all' ? Array.from({length: 24}, (_, i) => i) : [parseInt(selectedTime.substring(0, 2))];
    let fullHtml = '';
    for (const d of dates) {
        for (const g of gs) {
            const groupCols = groups[g];
            const columns = [0, 1, 2].concat(groupCols);
            for (const h of hours) {
                const period = `${h < 10 ? '0' + h : h}:00 - ${h < 10 ? '0' + h : h}:59`;
                const subtitle = `Day: ${d} | Car: ${g} | Time: ${period}`;
                const tableHtml = generateTableHtml(d, h, columns);
                if (tableHtml) {
                    fullHtml += `<div class="subtitle">${subtitle}</div>${tableHtml}`;
                }
            }
        }
    }
    display.innerHTML = fullHtml || '<p>No data available.</p>';
}

function generateTableHtml(selectedDate, h, columns) {
    let periodHtml = '<table><thead><tr>';
    columns.forEach(col => {
        periodHtml += `<th>${data[0][col] || ''}</th>`;
    });
    periodHtml += '</tr></thead><tbody>';
    let hasData = false;
    for (let i = 4; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        const timeStr = row[1];
        let dateObj;
        try {
            dateObj = new Date(timeStr.replace(' ', 'T'));
            if (isNaN(dateObj.getTime())) continue;
        } catch (e) {
            continue;
        }
        const dateStr = timeStr.split(' ')[0];
        if (dateStr !== selectedDate) continue;
        const hour = dateObj.getHours();
        if (hour === h) {
            hasData = true;
            periodHtml += '<tr>';
            columns.forEach(col => {
                periodHtml += `<td>${row[col] || ''}</td>`;
            });
            periodHtml += '</tr>';
        }
    }
    periodHtml += '</tbody></table>';
    return hasData ? periodHtml : '';
}

function showAlgoData() {
    const display = document.getElementById('data-display');
    if (data.length < 5) {
        display.innerHTML = '<p>No data imported yet.</p>';
        return;
    }
    const selectedDate = document.getElementById('date-select').value;
    const selectedTime = document.getElementById('time-select').value;
    const selectedGroup = document.getElementById('group-select').value;
    const dates = selectedDate === 'all' ? getSortedDates() : [selectedDate];
    const groups = {
        1: [11, 16, 21, 26, 31, 36, 41, 46],
        2: [61, 66, 71, 76, 81, 86, 91, 96],
        3: [111, 116, 121, 126, 131, 136, 141, 146],
        4: [161, 166, 171, 176, 181, 186, 191, 196],
        5: [211, 216, 221, 226, 231, 236, 241, 246],
        6: [261, 266, 271, 276, 281, 286, 291, 296],
        7: [311, 316, 321, 326, 331, 336, 341, 346],
        8: [361, 366, 371, 376, 381, 386, 391, 396]
    };
    const gs = selectedGroup === 'all' ? Array.from({length: 8}, (_, i) => i + 1) : [parseInt(selectedGroup)];
    const hours = selectedTime === 'all' ? Array.from({length: 24}, (_, i) => i) : [parseInt(selectedTime.substring(0, 2))];
    let fullHtml = '';
    for (const d of dates) {
        for (const g of gs) {
            const groupCols = groups[g];
            for (const h of hours) {
                const period = `${h < 10 ? '0' + h : h}:00 - ${h < 10 ? '0' + h : h}:59`;
                const subtitle = `Day: ${d} | Car: ${g} | Time: ${period}`;
                const tableHtml = generateAlgoTableHtml(d, h, groupCols);
                if (tableHtml) {
                    fullHtml += `<div class="subtitle">${subtitle}</div>${tableHtml}`;
                }
            }
        }
    }
    display.innerHTML = fullHtml || '<p>No data available.</p>';
}

function generateAlgoTableHtml(selectedDate, h, groupCols) {
    let periodHtml = '<table><thead><tr><th>TrainNo</th><th>Time</th><th>Status</th><th>Temp Diff 1</th><th>Temp Diff 2</th><th>Temp Diff 3</th><th>Temp Diff 4</th><th>Temp Diff 5</th><th>Temp Diff 6</th><th>Temp Diff 7</th><th>Temp Diff 8</th><th>Delta Temperature</th></tr></thead><tbody>';
    const hourRows = [];
    for (let i = 4; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        const timeStr = row[1];
        let dateObj;
        try {
            dateObj = new Date(timeStr.replace(' ', 'T'));
            if (isNaN(dateObj.getTime())) continue;
        } catch (e) {
            continue;
        }
        const dateStr = timeStr.split(' ')[0];
        if (dateStr !== selectedDate) continue;
        const hour = dateObj.getHours();
        if (hour === h) {
            hourRows.push({row, dateObj});
        }
    }
    if (hourRows.length === 0) {
        return '';
    }
    hourRows.sort((a, b) => a.dateObj - b.dateObj);
    let hasData = true;
    for (let entry of hourRows) {
        const row = entry.row;
        periodHtml += '<tr><td>' + (row[0] || '') + '</td><td>' + (row[1] || '') + '</td><td>' + (row[2] || '') + '</td>';
        const temps = groupCols.map(col => parseFloat(row[col]));
        if (temps.every(n => !isNaN(n))) {
            const average = temps.reduce((a, b) => a + b, 0) / 8;
            const diffs = temps.map(t => t - average);
            diffs.forEach(d => periodHtml += `<td>${d}</td>`);
            const sortedDiffs = diffs.slice().sort((a, b) => b - a);
            const sumMid = sortedDiffs.slice(1, 6).reduce((a, b) => a + b, 0);
            const delta = sumMid / 5;
            periodHtml += `<td>${delta}</td>`;
        } else {
            for (let k = 0; k < 9; k++) periodHtml += '<td>N</td>';
        }
        periodHtml += '</tr>';
    }
    periodHtml += '</tbody></table>';
    return periodHtml;
}

function showAnalysis() {
    let count8PerDay = new Array(7).fill(0);
    let count7PerDay = new Array(7).fill(0);
    let count6PerDay = new Array(7).fill(0);
    const dates = getSortedDates();
    const groups = {
        1: [11, 16, 21, 26, 31, 36, 41, 46],
        2: [61, 66, 71, 76, 81, 86, 91, 96],
        3: [111, 116, 121, 126, 131, 136, 141, 146],
        4: [161, 166, 171, 176, 181, 186, 191, 196],
        5: [211, 216, 221, 226, 231, 236, 241, 246],
        6: [261, 266, 271, 276, 281, 286, 291, 296],
        7: [311, 316, 321, 326, 331, 336, 341, 346],
        8: [361, 366, 371, 376, 381, 386, 391, 396]
    };
    for (let dayIndex = 0; dayIndex < dates.length && dayIndex < 7; dayIndex++) {
        const d = dates[dayIndex];
        for (let i = 4; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            const timeStr = row[1];
            let dateObj;
            try {
                dateObj = new Date(timeStr.replace(' ', 'T'));
                if (isNaN(dateObj.getTime())) continue;
            } catch (e) {
                continue;
            }
            const dateStr = timeStr.split(' ')[0];
            if (dateStr !== d) continue;
            for (let g = 1; g <= 8; g++) {
                const groupCols = groups[g];
                const temps = groupCols.map(col => parseFloat(row[col]));
                if (temps.every(n => !isNaN(n))) {
                    const average = temps.reduce((a, b) => a + b, 0) / 8;
                    const diffs = temps.map(t => t - average);
                    const sortedDiffs = diffs.slice().sort((a, b) => b - a);
                    const sumMid = sortedDiffs.slice(1, 6).reduce((a, b) => a + b, 0);
                    const delta = sumMid / 5;
                    if (delta > 8) {
                        count8PerDay[dayIndex]++;
                    } else if (delta > 7 && delta < 8) {
                        count7PerDay[dayIndex]++;
                    } else if (delta > 6 && delta < 7) {
                        count6PerDay[dayIndex]++;
                    }
                }
            }
        }
    }
    const total8 = count8PerDay.reduce((a, b) => a + b, 0);
    const total7 = count7PerDay.reduce((a, b) => a + b, 0);
    const total6 = count6PerDay.reduce((a, b) => a + b, 0);
    const inspection = total8 >= 4 ? '✓' : '-';
    const prioritization = (total7 + total6) >= 4 ? '✓' : '-';
    let tableHtml = '<table><thead><tr><th>Day</th><th>>8°C</th><th>>7°C</th><th>>6°C</th><th>Inspection Check</th><th>Prioritization of Bearing</th></tr></thead><tbody>';
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        tableHtml += `<tr><td>${dayIndex + 1}</td><td>${count8PerDay[dayIndex] || 0}</td><td>${count7PerDay[dayIndex] || 0}</td><td>${count6PerDay[dayIndex] || 0}</td><td>${inspection}</td><td>${prioritization}</td></tr>`;
    }
    tableHtml += '</tbody></table>';
    document.getElementById('analysis-table').innerHTML = tableHtml;
    document.getElementById('analysisModal').style.display = 'block';
}

function closeAnalysisModal() {
    document.getElementById('analysisModal').style.display = 'none';
}

function setModeAndDisplay(mode) {
    currentMode = mode;
    updateDisplay();
}

function updateDisplay() {
    if (currentMode === 'bearing') {
        showData();
    } else {
        showAlgoData();
    }
}

function saveDisplay() {
    const displayHtml = document.getElementById('data-display').innerHTML;
    localStorage.setItem('savedDisplay', displayHtml);
    localStorage.setItem('savedMode', currentMode);
    alert('Display saved.');
}

function loadSavedDisplay() {
    const savedMode = localStorage.getItem('savedMode');
    if (savedMode) {
        currentMode = savedMode;
    }
    const saved = localStorage.getItem('savedDisplay');
    if (saved) {
        document.getElementById('data-display').innerHTML = saved;
    }
}

function clearData() {
    data = [];
    document.getElementById('date-select').innerHTML = '<option value="all">All</option>';
    document.getElementById('time-select').innerHTML = '<option value="all">All</option>';
    document.getElementById('group-select').innerHTML = '<option value="all">All</option>';
    document.getElementById('data-display').innerHTML = '';
    document.getElementById('file-input').value = '';
    localStorage.removeItem('savedDisplay');
    localStorage.removeItem('savedMode');
    currentMode = 'bearing';
    alert('Data cleared.');
    populateTimes(); 
    populateGroups();
}

function resetFilters() {
    document.getElementById('date-select').value = 'all';
    document.getElementById('time-select').value = 'all';
    document.getElementById('group-select').value = 'all';
    updateDisplay();
}