// ===== Global State =====
let viewMode = 'nearby'; // 'nearby' or 'solo'
let sortColumn = 'totalDmg';
let sortDirection = 'desc';
let selectedEncounterId = 'live'; // 'live' or numeric encounter id
let autoSnapshotEnabled = false;

const professionMap = {
    '雷影剑士': { name: 'Stormblade', icon: 'Stormblade.png', role: 'dps' },
    '冰魔导师': { name: 'Frost Mage', icon: 'Frost Mage.png', role: 'dps' },
    '涤罪恶火·战斧': { name: 'Fire Axe', icon: 'Fire Axe.png', role: 'dps' },
    '青岚骑士': { name: 'Wind Knight', icon: 'Wind Knight.png', role: 'tank' },
    '森语者': { name: 'Verdant Oracle', icon: 'Verdant Oracle.png', role: 'dps' },
    '雷霆一闪·手炮': { name: 'Gunner', icon: 'desconocido.png', role: 'dps' },
    '巨刃守护者': { name: 'Heavy Guardian', icon: 'baluarte_ferreo.png', role: 'tank' },
    '暗灵祈舞·仪刀/仪仗': { name: 'Spirit Dancer', icon: 'desconocido.png', role: 'dps' },
    '神射手': { name: 'Marksman', icon: 'arco_halcon.png', role: 'dps' },
    '神盾骑士': { name: 'Shield Knight', icon: 'guardian.png', role: 'tank' },
    '灵魂乐手': { name: 'Soul Musician', icon: 'sonido_feroz.png', role: 'dps' },
    '居合': { name: 'laido Slash', icon: 'Stormblade.png', role: 'dps' },
    '月刃': { name: 'MoonStrike', icon: 'MoonStrike.png', role: 'dps' },
    '冰矛': { name: 'Icicle', icon: 'lanza_hielo.png', role: 'dps' },
    '射线': { name: 'Frostbeam', icon: 'Frost Mage.png', role: 'dps' },
    '防盾': { name: 'Vanguard', icon: 'guardian.png', role: 'tank' },
    '岩盾': { name: 'Skyward', icon: 'Fire Axe.png', role: 'tank' },
    '惩戒': { name: 'Smite', icon: 'castigo.png', role: 'dps' },
    '愈合': { name: 'Lifebind', icon: 'Verdant Oracle.png', role: 'healer' },
    '格挡': { name: 'Block', icon: 'guardian.png', role: 'tank' },
    '狼弓': { name: 'Wildpack', icon: 'arco_lobo.png', role: 'dps' },
    '鹰弓': { name: 'Falconry', icon: 'arco_halcon.png', role: 'dps' },
    '光盾': { name: 'Shield', icon: 'egida_luz.png', role: 'tank' },
    '协奏': { name: 'Concerto', icon: 'Concierto.png', role: 'dps' },
    '狂音': { name: 'Dissonance', icon: 'sonido_feroz.png', role: 'dps' },
    '空枪': { name: 'Empty Gun', icon: 'francotirador.png', role: 'dps' },
    '重装': { name: 'Heavy Armor', icon: 'Wind Knight.png', role: 'dps' },
};

const defaultProfession = { name: 'Unknown', icon: 'desconocido.png', role: 'dps' };

let lastTotalDamage = 0;
let lastStartTime = 0;
let isLocked = false;
let currentScale = 1.0;
const scaleOptions = [1.0, 0.7, 0.5, 0.3];
const scaleLabels = ['1', '7', '5', '3'];

const playerBarsContainer = document.getElementById('player-bars-container');
const syncButton = document.getElementById('sync-button');
const lockButton = document.getElementById('lock-button');
const loadingIndicator = document.getElementById('loading-indicator');
const encounterSelect = document.getElementById('encounter-select');
const snapshotToggle = document.getElementById('snapshot-toggle');
const bossHpContainer = document.getElementById('boss-hp-container');
const bossNameEl = document.getElementById('boss-name');
const bossHpTextEl = document.getElementById('boss-hp-text');
const bossBarFill = document.getElementById('boss-bar-fill');

// Alt-key interaction when locked
document.addEventListener('keydown', (e) => {
    if (e.key === 'Alt' && document.body.classList.contains('locked')) {
        document.body.classList.add('alt-pressed');
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') {
        document.body.classList.remove('alt-pressed');
    }
});

// ===== DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', () => resetDpsMeter());
    }

    // Nearby/Solo toggle
    const nearbyGroupBtn = document.getElementById('nearby-group-btn');
    const sortDmgBtn = document.getElementById('sort-dmg-btn');
    const sortTankBtn = document.getElementById('sort-tank-btn');
    const sortHealBtn = document.getElementById('sort-heal-btn');

    if (nearbyGroupBtn) {
        nearbyGroupBtn.addEventListener('click', () => {
            viewMode = viewMode === 'nearby' ? 'solo' : 'nearby';
            nearbyGroupBtn.textContent = viewMode === 'nearby' ? 'Nearby' : 'Solo';
            nearbyGroupBtn.classList.toggle('solo', viewMode === 'solo');
            [sortDmgBtn, sortTankBtn, sortHealBtn].forEach(btn => {
                if (btn) btn.style.display = viewMode === 'solo' ? 'none' : 'block';
            });
            fetchDataAndRender();
        });
    }

    // Sort buttons
    function updateSortButtons(activeButton) {
        [sortDmgBtn, sortTankBtn, sortHealBtn].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        if (activeButton) activeButton.classList.add('active');
    }

    if (sortDmgBtn) sortDmgBtn.addEventListener('click', () => { sortColumn = 'totalDmg'; sortDirection = 'desc'; updateSortButtons(sortDmgBtn); fetchDataAndRender(); });
    if (sortTankBtn) sortTankBtn.addEventListener('click', () => { sortColumn = 'dmgTaken'; sortDirection = 'desc'; updateSortButtons(sortTankBtn); fetchDataAndRender(); });
    if (sortHealBtn) sortHealBtn.addEventListener('click', () => { sortColumn = 'totalHeal'; sortDirection = 'desc'; updateSortButtons(sortHealBtn); fetchDataAndRender(); });

    // Sync/Reset button - snapshots then resets
    if (syncButton) {
        syncButton.addEventListener('click', async () => {
            syncButton.style.opacity = '0.5';
            syncButton.style.pointerEvents = 'none';

            await fetch('/api/reset');
            lastTotalDamage = 0;

            // Refresh encounter dropdown
            await refreshEncounterList();

            // Switch back to live view
            selectedEncounterId = 'live';
            if (encounterSelect) encounterSelect.value = 'live';

            await fetchDataAndRender();

            setTimeout(() => {
                syncButton.style.opacity = '1';
                syncButton.style.pointerEvents = 'auto';
            }, 300);
        });
    }

    // Encounter dropdown
    if (encounterSelect) {
        encounterSelect.addEventListener('change', (e) => {
            selectedEncounterId = e.target.value === 'live' ? 'live' : parseInt(e.target.value, 10);
            fetchDataAndRender();
        });
    }

    // Snapshot toggle button
    if (snapshotToggle) {
        snapshotToggle.addEventListener('click', async () => {
            autoSnapshotEnabled = !autoSnapshotEnabled;
            snapshotToggle.classList.toggle('active', autoSnapshotEnabled);
            snapshotToggle.title = autoSnapshotEnabled ? 'Auto-log snapshots (ON)' : 'Auto-log snapshots (off)';

            // Persist to server settings
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoSnapshotLog: autoSnapshotEnabled }),
            });
        });

        // Load initial state from settings
        fetch('/api/settings').then(r => r.json()).then(data => {
            if (data?.data?.autoSnapshotLog) {
                autoSnapshotEnabled = true;
                snapshotToggle.classList.add('active');
                snapshotToggle.title = 'Auto-log snapshots (ON)';
            }
        }).catch(() => {});
    }

    // Lock button
    if (lockButton) {
        lockButton.addEventListener('click', () => {
            if (window.electronAPI) window.electronAPI.toggleLockState();
        });

        if (window.electronAPI) {
            window.electronAPI.onLockStateChanged((locked) => {
                isLocked = locked;
                lockButton.innerHTML = isLocked ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>';
                lockButton.title = isLocked ? 'Unlock position' : 'Lock position';
                const dpsMeter = document.querySelector('.dps-meter');
                if (dpsMeter) dpsMeter.classList.toggle('locked', isLocked);
                updateClickThroughState();
            });
        }
    }

    // Close button
    const closeButton = document.getElementById('close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (window.electronAPI) window.electronAPI.closeWindow();
        });
    }

    // Scale button
    const scaleButton = document.getElementById('scale-button');
    if (scaleButton) {
        scaleButton.addEventListener('click', () => {
            const currentIndex = scaleOptions.indexOf(currentScale);
            const nextIndex = (currentIndex + 1) % scaleOptions.length;
            currentScale = scaleOptions[nextIndex];
            scaleButton.textContent = scaleLabels[nextIndex];
            const dpsMeter = document.querySelector('.dps-meter');
            if (dpsMeter) dpsMeter.style.transform = `scale(${currentScale})`;
        });
    }

    setupManualDrag();
    setupClickThroughControl();

    if (window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
        currentMouseEventsState = true;
    }
});

// ===== Drag System =====
function setupManualDrag() {
    const dragIndicator = document.getElementById('drag-indicator');
    if (!dragIndicator || !window.electronAPI) return;

    let isDragging = false;
    let startX = 0, startY = 0, startWindowX = 0, startWindowY = 0;

    dragIndicator.addEventListener('mousedown', async (e) => {
        if (isLocked) return;
        isDragging = true;
        startX = e.screenX;
        startY = e.screenY;
        const [windowX, windowY] = await window.electronAPI.getWindowPosition();
        startWindowX = windowX;
        startWindowY = windowY;
        enableMouseEvents();
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || isLocked) return;
        window.electronAPI.setWindowPosition(startWindowX + (e.screenX - startX), startWindowY + (e.screenY - startY));
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            setTimeout(() => { if (!isDragging) disableMouseEvents(); }, 100);
        }
    });
}

// ===== Click-through Control =====
let currentMouseEventsState = true;

function enableMouseEvents() {
    if (window.electronAPI && currentMouseEventsState) {
        window.electronAPI.setIgnoreMouseEvents(false);
        currentMouseEventsState = false;
    }
}

function disableMouseEvents() {
    if (window.electronAPI && !currentMouseEventsState) {
        window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
        currentMouseEventsState = true;
    }
}

function updateClickThroughState() {
    if (!window.electronAPI) return;
    window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    currentMouseEventsState = true;
}

function setupClickThroughControl() {
    if (!window.electronAPI) return;

    document.addEventListener('mouseover', (e) => {
        let shouldEnable = false;
        if (isLocked) {
            const selectors = ['.controls', '.control-button', '.sync-button', '.advanced-lite-btn', '.encounter-select', '.snapshot-toggle'];
            shouldEnable = selectors.some(s => e.target.closest(s) !== null);
        } else {
            const selectors = ['.controls', '.drag-indicator'];
            shouldEnable = selectors.some(s => e.target.closest(s) !== null);
        }
        if (shouldEnable) enableMouseEvents();
    });

    document.addEventListener('mouseout', (e) => {
        setTimeout(() => {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            let keep = false;
            if (el) {
                const selectors = isLocked
                    ? ['.controls', '.control-button', '.sync-button', '.advanced-lite-btn', '.encounter-select', '.snapshot-toggle']
                    : ['.controls', '.drag-indicator'];
                keep = selectors.some(s => el.closest(s) !== null);
            }
            if (!keep) disableMouseEvents();
        }, 50);
    });

    document.addEventListener('mouseleave', () => disableMouseEvents());
}

// ===== Utility =====
function formatStat(value) {
    if (value >= 1000000000000) return (value / 1000000000000).toFixed(1) + 'T';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'G';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
    return value.toFixed(0);
}

const positionBackgroundColors = [
    'rgba(140, 55, 65, 0.15)',
    'rgba(130, 60, 70, 0.14)',
    'rgba(120, 68, 76, 0.12)',
    'rgba(110, 76, 84, 0.10)',
    'rgba(100, 82, 90, 0.09)',
    'rgba(90, 88, 96, 0.08)',
    'rgba(80, 92, 102, 0.06)',
    'rgba(70, 96, 108, 0.05)',
    'rgba(65, 100, 112, 0.04)',
    'rgba(60, 104, 116, 0.03)',
];

function getPositionBackgroundColor(index) {
    return positionBackgroundColors[index] || positionBackgroundColors[9];
}

function sortUserArray(userArray) {
    userArray.sort((a, b) => {
        let aVal, bVal;
        switch (sortColumn) {
            case 'gs': aVal = Number(a.fight_point) || 0; bVal = Number(b.fight_point) || 0; break;
            case 'dps': aVal = Number(a.total_dps) || 0; bVal = Number(b.total_dps) || 0; break;
            case 'totalDmg': aVal = a.total_damage?.total ? Number(a.total_damage.total) : 0; bVal = b.total_damage?.total ? Number(b.total_damage.total) : 0; break;
            case 'dmgTaken': aVal = Number(a.taken_damage) || 0; bVal = Number(b.taken_damage) || 0; break;
            case 'hps': aVal = Number(a.total_hps) || 0; bVal = Number(b.total_hps) || 0; break;
            case 'totalHeal': aVal = a.total_healing?.total ? Number(a.total_healing.total) : 0; bVal = b.total_healing?.total ? Number(b.total_healing.total) : 0; break;
            default: aVal = Number(a.total_dps) || 0; bVal = Number(b.total_dps) || 0;
        }
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
}

// ===== Encounter List =====
async function refreshEncounterList() {
    if (!encounterSelect) return;
    try {
        const res = await fetch('/api/encounters');
        const data = await res.json();
        const encounters = data.encounters || [];

        // Preserve current selection
        const currentVal = encounterSelect.value;

        // Clear all except "Live"
        encounterSelect.innerHTML = '<option value="live">Live</option>';

        // Add encounters in reverse (most recent first)
        for (let i = encounters.length - 1; i >= 0; i--) {
            const enc = encounters[i];
            const opt = document.createElement('option');
            opt.value = enc.id;
            const mins = Math.floor((enc.duration || 0) / 60000);
            const secs = Math.floor(((enc.duration || 0) % 60000) / 1000);
            opt.textContent = `${enc.label} (${mins}m${secs}s)`;
            encounterSelect.appendChild(opt);
        }

        // Restore selection if it still exists
        if (currentVal !== 'live') {
            const exists = encounters.some(e => String(e.id) === String(currentVal));
            encounterSelect.value = exists ? currentVal : 'live';
            if (!exists) selectedEncounterId = 'live';
        }
    } catch (err) {
        console.error('Failed to refresh encounter list:', err);
    }
}

// ===== Boss HP =====
async function updateBossHp() {
    if (selectedEncounterId !== 'live') {
        if (bossHpContainer) bossHpContainer.classList.remove('visible');
        return;
    }

    try {
        const res = await fetch('/api/enemies');
        const data = await res.json();
        const enemies = data.enemy || {};
        const currentTarget = data.currentTarget;

        // 1. Prefer current target (mob the player is actively hitting)
        let targetId = null;
        let targetMaxHp = 0;

        if (currentTarget && enemies[currentTarget] && !enemies[currentTarget].is_dead) {
            const ct = enemies[currentTarget];
            if (ct.max_hp > 0) {
                targetId = String(currentTarget);
                targetMaxHp = ct.max_hp;
            } else if (ct.total_damage_taken > 0) {
                // No attribute HP data — show name + damage dealt
                if (bossHpContainer) bossHpContainer.classList.add('visible');
                if (bossNameEl) bossNameEl.textContent = ct.name || 'Unknown';
                if (bossHpTextEl) bossHpTextEl.textContent = `${formatStat(ct.total_damage_taken)} damage dealt`;
                if (bossBarFill) {
                    bossBarFill.style.width = '100%';
                    bossBarFill.style.background = '#4a5568';
                }
                return;
            }
        }

        // 2. Fall back to highest max_hp living enemy
        if (!targetId) {
            for (const [id, enemy] of Object.entries(enemies)) {
                const maxHp = enemy.max_hp || 0;
                if (maxHp > targetMaxHp && !enemy.is_dead) {
                    targetMaxHp = maxHp;
                    targetId = id;
                }
            }
        }

        if (!targetId || targetMaxHp <= 0) {
            if (bossHpContainer) bossHpContainer.classList.remove('visible');
            return;
        }

        // 3. Show HP bar for selected target
        const target = enemies[targetId];
        const hp = target.hp ?? targetMaxHp;
        const hpPercent = Math.max(0, Math.min(100, (hp / targetMaxHp) * 100));

        if (bossHpContainer) bossHpContainer.classList.add('visible');
        if (bossNameEl) bossNameEl.textContent = target.name || 'Unknown';
        if (bossHpTextEl) bossHpTextEl.textContent = `${formatStat(hp)} / ${formatStat(targetMaxHp)} (${hpPercent.toFixed(1)}%)`;
        if (bossBarFill) {
            bossBarFill.style.width = `${hpPercent}%`;
            const color = hp <= 0 ? '#333' : hpPercent > 50 ? '#4a8c5c' : hpPercent > 25 ? '#b8862d' : '#a83e3e';
            bossBarFill.style.background = color;
        }
    } catch (err) {
        if (bossHpContainer) bossHpContainer.classList.remove('visible');
    }
}

// ===== Main Render =====
async function fetchDataAndRender() {
    const container = document.getElementById('player-bars-container');
    try {
        let userData, startTimeFromServer;

        if (selectedEncounterId !== 'live') {
            // Load from encounter history
            const encRes = await fetch(`/api/encounters/${selectedEncounterId}`);
            const encData = await encRes.json();
            if (encData.code !== 0 || !encData.encounter) {
                selectedEncounterId = 'live';
                if (encounterSelect) encounterSelect.value = 'live';
                return fetchDataAndRender();
            }
            // Build a userData-like object from the encounter snapshot
            userData = { user: encData.encounter.userData, startTime: encData.encounter.startTime };
            startTimeFromServer = encData.encounter.startTime;
        } else {
            // Live data
            const apiEndpoint = viewMode === 'solo' ? '/api/solo-user' : '/api/data';
            const [dataRes, diccRes, settingsRes] = await Promise.all([
                fetch(apiEndpoint),
                fetch('/api/diccionario'),
                fetch('/api/settings'),
            ]);
            userData = await dataRes.json();
            await diccRes.json(); // consume
            await settingsRes.json(); // consume
            startTimeFromServer = userData.startTime;
        }

        // Detect reset
        if (startTimeFromServer && startTimeFromServer !== lastStartTime) {
            lastStartTime = startTimeFromServer;
            lastTotalDamage = 0;
        }

        let userArray = Object.entries(userData.user).map(([uid, data]) => ({
            ...data,
            uid: parseInt(uid, 10),
        }));

        userArray = userArray.filter(u =>
            (u.total_damage && u.total_damage.total > 0) ||
            (u.taken_damage > 0) ||
            (u.total_healing && u.total_healing.total > 0)
        );

        if (!userArray || userArray.length === 0) {
            loadingIndicator.style.display = 'flex';
            playerBarsContainer.style.display = 'none';
            return;
        }

        loadingIndicator.style.display = 'none';
        playerBarsContainer.style.display = 'flex';

        const sumaTotalDamage = userArray.reduce((acc, u) => acc + (u.total_damage?.total ? Number(u.total_damage.total) : 0), 0);

        if (sumaTotalDamage !== lastTotalDamage) lastTotalDamage = sumaTotalDamage;

        userArray.forEach(u => {
            const userDamage = u.total_damage?.total ? Number(u.total_damage.total) : 0;
            u.damagePercent = sumaTotalDamage > 0 ? Math.max(0, Math.min(100, (userDamage / sumaTotalDamage) * 100)) : 0;
        });

        // Get local UID
        let localUid = null;
        if (viewMode === 'solo') {
            const uidKey = Object.keys(userData.user)[0];
            localUid = uidKey ? parseInt(uidKey, 10) : null;
        } else if (selectedEncounterId === 'live') {
            try {
                const localRes = await fetch('/api/solo-user');
                const localData = await localRes.json();
                if (localData.user && Object.keys(localData.user).length > 0) {
                    localUid = parseInt(Object.keys(localData.user)[0], 10);
                }
            } catch (err) {}
        }

        sortUserArray(userArray);

        // Nearby: top 10 + local if not in top
        let localUserExtra = null;
        if (viewMode === 'nearby' && localUid) {
            const top10 = userArray.slice(0, 10);
            const isLocalInTop10 = top10.some(u => u.uid === localUid);
            if (userArray.length > 10 && !isLocalInTop10) {
                localUserExtra = userArray.find(u => u.uid === localUid);
            }
            if (userArray.length > 10) userArray = top10;
        }
        if (localUserExtra) userArray.push(localUserExtra);

        // Render
        container.innerHTML = userArray.map((u, index) => {
            const professionParts = (u.profession || '-').split('-');
            const mainProfessionKey = professionParts[0];
            const subProfessionKey = professionParts[1];
            const mainProf = professionMap[mainProfessionKey] || defaultProfession;
            const subProf = professionMap[subProfessionKey];
            let prof = subProf || mainProf;
            let professionName = mainProf.name;
            if (subProf) professionName += ` - ${subProf.name}`;

            const dps = Number(u.total_dps) || 0;
            const totalHealing = u.total_healing ? (Number(u.total_healing.total) || 0) : 0;
            const nombre = u.name || 'Unknown';
            const hpPercent = ((u.hp || 0) / (u.max_hp || 1)) * 100;
            const hpColor = hpPercent > 50 ? '#4a8c5c' : hpPercent > 25 ? '#b8862d' : '#a83e3e';
            const bgColor = getPositionBackgroundColor(index);

            const position = index + 1;
            const isLocalPlayer = localUid && u.uid === localUid;
            let positionClasses = 'player-position';
            if (position === 1) positionClasses += ' rank-1';
            else if (position === 2) positionClasses += ' rank-2';
            else if (position === 3) positionClasses += ' rank-3';
            if (isLocalPlayer) positionClasses += ' local-player';

            return `<div class="player-bar" style="--damage-percent: ${u.damagePercent}%; --damage-bg-color: ${bgColor};">
                <div class="player-info">
                    <span class="${positionClasses}">${position}</span>
                    <img class="class-icon" src="icons/${prof.icon}" alt="${professionName}" title="${professionName}">
                    <div class="player-details">
                        <span class="player-name">${nombre} <span style="color: var(--text-secondary); font-size: 9px; font-weight: 400;">(GS: ${u.fightPoint || 0})</span></span>
                        <div class="hp-bar">
                            <div class="hp-fill" style="width: ${hpPercent}%; background: ${hpColor};"></div>
                            <span class="hp-text">${formatStat(u.hp || 0)}/${formatStat(u.max_hp || 0)}</span>
                        </div>
                    </div>
                    <div class="player-stats-main">
                        <div class="stat"><span class="stat-label">DPS</span><span class="stat-value">${formatStat(dps)}</span></div>
                        <div class="stat"><span class="stat-label">HPS</span><span class="stat-value">${formatStat(u.total_hps || 0)}</span></div>
                        <div class="stat"><span class="stat-label">TOTAL DMG</span><span class="stat-value">${formatStat((u.total_damage && u.total_damage.total) || 0)}</span></div>
                        <div class="stat"><span class="stat-label">DMG TAKEN</span><span class="stat-value">${formatStat(u.taken_damage || 0)}</span></div>
                        <div class="stat"><span class="stat-label">% DMG</span><span class="stat-value">${Math.round(u.damagePercent)}%</span></div>
                        <div class="stat"><span class="stat-label">TOTAL HEAL</span><span class="stat-value">${formatStat(totalHealing)}</span></div>
                    </div>
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('Error in fetchDataAndRender:', err);
        if (container) container.innerHTML = '<div id="message-display">Waiting for game data...</div>';
        loadingIndicator.style.display = 'flex';
        playerBarsContainer.style.display = 'none';
    }
}

// ===== Polling Loop =====
let encounterRefreshCounter = 0;

setInterval(() => {
    fetchDataAndRender();
    updateBossHp();

    // Refresh encounter list every ~2 seconds (every 40 ticks at 50ms)
    encounterRefreshCounter++;
    if (encounterRefreshCounter >= 40) {
        encounterRefreshCounter = 0;
        refreshEncounterList();
    }
}, 50);

// Initial calls
fetchDataAndRender();
updateBossHp();
refreshEncounterList();
