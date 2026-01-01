
// Game State
let gameState = {
  energy: 50,
  papers: 0,
  maxEnergy: 100,
  baseRegen: 5, // Start Fast: 5 energy/sec
  autoEnergy: 0,
  autoPapers: 0,
  eventChance: 0.15,
  upgrades: {
    betterBeans: 0,
    espresso: 0,
    undergrad: 0,
    plant: 0
  }
};

// Config
const UPGRADES = [
  {
    id: 'betterBeans',
    name: 'Better Beans',
    desc: '+5 Base Regen/Sec',
    baseCost: 10,
    costMult: 1.3,
    trigger: (state) => { state.baseRegen += 5; }
  },
  {
    id: 'espresso',
    name: 'Espresso Machine',
    desc: '+50 Max Energy Cap',
    baseCost: 50,
    costMult: 1.2,
    trigger: (state) => { state.maxEnergy += 50; }
  },
  {
    id: 'undergrad',
    name: 'Undergrad Student',
    desc: '+5 Papers/Sec (Costs 2 Energy/Sec)',
    baseCost: 25,
    costMult: 1.4,
    trigger: (state) => { state.autoPapers += 5; }
  },
  {
    id: 'plant',
    name: 'Desk Plant',
    desc: 'Reduces Bad Events & +2 Regen',
    baseCost: 100,
    costMult: 2,
    trigger: (state) => { state.eventChance = 0.05; state.baseRegen += 2; }
  }
];

const COST_PER_PAPER = 2; // Cheaper papers
const GRADUATION_GOAL = 10000; // Increased Goal for faster pace? Or keep 1000 for quick win? User said "faster pace", usually implies faster numbers. I'll keep 1000 so they win fast, or 10000 if they want "idle" speed. Let's stick to 1000 but make it instant. Actually "faster pace" might mean more clicking speed. 
// I'll keep 1000. It will be over in seconds. Maybe 5000.
// Let's stick to 1000.

// DOM Elements
const paperEl = document.getElementById('paper-count');
const paperBtn = document.getElementById('paper-btn');
const eventNote = document.getElementById('event-note');
const eventText = document.getElementById('event-text');
const shopList = document.getElementById('shop-list');
const goalProgress = document.getElementById('goal-progress');
const statEnergySec = document.getElementById('stat-energy-sec');
const statPaperSec = document.getElementById('stat-paper-sec');

// Shop Generation
function initShop() {
  shopList.innerHTML = '';
  UPGRADES.forEach(u => {
    const item = document.createElement('div');
    item.className = 'shop-item';

    // Calculate current cost
    const level = gameState.upgrades[u.id];
    const cost = Math.floor(u.baseCost * Math.pow(u.costMult, level));

    item.innerHTML = `
      <span>${u.name} (Lvl ${level})</span>
      <small>${u.desc}</small>
      <button onclick="buyUpgrade('${u.id}')" id="btn-${u.id}">Buy (${cost} Papers)</button>
    `;
    shopList.appendChild(item);
  });
}

// Global scope for HTML access
window.buyUpgrade = function (id) {
  const upgrade = UPGRADES.find(u => u.id === id);
  const level = gameState.upgrades[id];
  const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level));

  if (gameState.papers >= cost) {
    gameState.papers -= cost;
    gameState.upgrades[id]++;
    upgrade.trigger(gameState);
    updateUI();
    initShop(); // Refresh prices
  }
};

// Updates UI based on state
function updateUI() {
  if (document.getElementById('energy-display-main')) {
    document.getElementById('energy-display-main').innerText = Math.floor(gameState.energy) + " / " + gameState.maxEnergy;
  }

  paperEl.innerText = Math.floor(gameState.papers);

  // Calculate Net Energy (Gain - Consumption)
  const netEnergy = gameState.baseRegen - (gameState.autoPapers * 2);
  statEnergySec.innerText = netEnergy >= 0 ? `+${netEnergy}` : netEnergy;

  statPaperSec.innerText = gameState.autoPapers;

  // Goal Progress
  if (goalProgress) {
    goalProgress.innerText = `${gameState.papers} / ${GRADUATION_GOAL} Papers`;
    if (gameState.papers >= GRADUATION_GOAL) {
      goalProgress.innerText = "GRADUATED!";
      goalProgress.style.color = "green";
      goalProgress.style.fontWeight = "bold";
    }
  }

  // Disable paper button if not enough energy
  if (gameState.energy < COST_PER_PAPER) {
    paperBtn.setAttribute('disabled', 'true');
    paperBtn.style.opacity = '0.7';
  } else {
    paperBtn.removeAttribute('disabled');
    paperBtn.style.opacity = '1';
  }

  // Update Shop Buttons
  UPGRADES.forEach(u => {
    const btn = document.getElementById(`btn-${u.id}`);
    const level = gameState.upgrades[u.id];
    const cost = Math.floor(u.baseCost * Math.pow(u.costMult, level));

    if (gameState.papers < cost) {
      btn.setAttribute('disabled', 'true');
    } else {
      btn.removeAttribute('disabled');
    }
  });
}

// Random Events
function triggerRandomEvent() {
  if (Math.random() < gameState.eventChance) {
    const events = [
      { text: "Advisor Meeting!\n-10 Energy", energyChange: -10 },
      { text: "Lab Equipment Broke!\n-15 Energy", energyChange: -15 },
      { text: "Free Pizza!\n+50 Energy", energyChange: 50 },
      { text: "Reviewer #2 Rejected!\nLost confidence", energyChange: -5 }
    ];

    const event = events[Math.floor(Math.random() * events.length)];

    // Show note
    eventText.innerText = event.text;
    eventNote.classList.remove('hidden');

    // Apply effect
    gameState.energy += event.energyChange;
    if (gameState.energy < 0) gameState.energy = 0;
    if (gameState.energy > gameState.maxEnergy) gameState.energy = gameState.maxEnergy;

    // Hide note after 2s (Faster fade)
    setTimeout(() => {
      eventNote.classList.add('hidden');
    }, 2000);
  }
}

// Game Loop (Faster tick: 100ms?)
// To make it faster paced, we can tick faster or just have larger numbers per second.
// 1s is standard. Let's keep 1s but big numbers.
setInterval(() => {
  // Passive Energy (Base Regen)
  gameState.energy += gameState.baseRegen;

  // Cap Energy
  if (gameState.energy > gameState.maxEnergy) gameState.energy = gameState.maxEnergy;

  // Passive Papers (Undergrad)
  // Undergrad only works if there is energy to burn
  if (gameState.autoPapers > 0) {
    const energyCost = gameState.autoPapers * 2; // Cost is mostly irrelevant if regen is high, but keeps balance
    // Actually if papers cost 2, undergrad shouldn't burn 2 for 5 papers. 
    // Wait, undergrad was: +5 Papers/Sec. 
    // Standard cost is 2 Energy per Paper. So 5 papers should cost 10 Energy?
    // In previous config: +1 Paper costs 2 Energy. (Manual cost was 5).
    // Let's make Undergrad efficient: +5 Papers for 5 Energy.
    const runCost = gameState.autoPapers; // 1 energy per paper for automation
    if (gameState.energy >= runCost) {
      gameState.energy -= runCost;
      gameState.papers += gameState.autoPapers;
    }
  }

  updateUI();
}, 1000);

// Actions
paperBtn.addEventListener('click', () => {
  if (gameState.energy >= COST_PER_PAPER) {
    gameState.energy -= COST_PER_PAPER;
    gameState.papers++;

    updateUI();
    triggerRandomEvent();
    updateUI();
  }
});

// Init
initShop();
updateUI();
