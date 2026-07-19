// State
let validatedQueue = [];
let nurseQueue = [];

// DOM Elements
const validatedContainer = document.getElementById('validated-queue');
const nurseContainer = document.getElementById('nurse-queue');
const queueCounter = document.getElementById('validated-badge');
const briefModal = document.getElementById('brief-modal');
const closeModalBtn = document.getElementById('close-modal');

// --- Rendering Logic --- //
function renderQueues() {
    // Render Validated
    validatedContainer.innerHTML = '';
    validatedQueue.forEach((patient, index) => {
        const urg = patient.urgency?.toUpperCase() || 'ROUTINE';
        const urgencyConfig = {
            'URGENT': 'bg-red-50 text-red-700 border-red-200 shadow-sm',
            'SAME-DAY': 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm',
            'ROUTINE': 'bg-slate-100 text-slate-600 border-slate-200 shadow-sm'
        };
        const uClass = urgencyConfig[urg] || urgencyConfig['ROUTINE'];
        
        // Use initial for avatar
        const initial = patient.name ? patient.name.charAt(0).toUpperCase() : '?';

        const card = document.createElement('div');
        card.className = `bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:border-blue-200 border border-slate-200/60 transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer flex flex-col relative overflow-hidden`;
        card.style.animationDelay = `${index * 0.05}s`;
        
        card.innerHTML = `
            <!-- Colorful top accent line -->
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            
            <div class="flex justify-between items-start mb-6 mt-2">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200 shadow-inner group-hover:bg-blue-50 transition-colors">
                        ${initial}
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 text-lg">${patient.name}</h3>
                        <p class="text-xs text-slate-500 font-medium">DOB: ${patient.dob}</p>
                    </div>
                </div>
                <span class="text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider ${uClass}">
                    ${urg}
                </span>
            </div>
            
            <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex-grow shadow-inner">
                <p class="text-sm text-slate-700 leading-relaxed"><span class="font-bold text-slate-900">Reason:</span> ${patient.hpi}</p>
            </div>
            
            <div class="mt-auto">
                <button class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-[12px] text-sm font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2 group/btn" onclick="openBrief('${patient.briefUrl}')">
                    <i data-lucide="file-text" class="w-4 h-4 group-hover/btn:scale-110 transition-transform"></i> View Digital Brief
                </button>
            </div>
        `;
        validatedContainer.appendChild(card);
    });

    queueCounter.innerText = `${validatedQueue.length} Patients`;

    // Render Nurse Queue
    nurseContainer.innerHTML = '';
    nurseQueue.forEach((pt, index) => {
        const card = document.createElement('div');
        card.className = `bg-slate-800 border-l-4 border-amber-500 rounded-[24px] p-6 shadow-lg hover:shadow-[0_20px_40px_rgba(245,158,11,0.15)] hover:bg-slate-700 transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer flex flex-col group`;
        card.style.animationDelay = `${index * 0.05}s`;

        card.innerHTML = `
            <div class="flex items-center gap-2 mb-6">
                <h3 class="font-bold text-white text-lg group-hover:text-amber-400 transition-colors">${pt.name}</h3>
                ${pt.age && pt.age > 0 ? `<span class="text-xs font-medium text-slate-400 bg-slate-700 px-3 py-1 rounded-full">${pt.age} yrs</span>` : ''}
            </div>
            
            <div class="bg-rose-500/10 text-rose-300 border border-rose-500/20 p-4 rounded-xl text-sm font-medium mb-6 shadow-inner flex-grow">
                <span class="flex items-start gap-2">
                    <i data-lucide="alert-triangle" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
                    ${pt.flagReason}
                </span>
                <p class="text-xs text-slate-400 mt-3 pt-3 border-t border-rose-500/20 line-clamp-2 leading-relaxed"><span class="font-bold text-slate-300">Symptoms:</span> ${pt.hpi}</p>
            </div>
            
            <div class="mt-auto">
                <button onclick="alert('Initiating secure communication protocol for ${pt.name}... \\n\\n(Demo Mode: Integration with patient messaging system would open here.)')" class="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold rounded-[12px] transition-all transform active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 group/btn2">
                    <i data-lucide="phone-call" class="w-4 h-4 group-hover/btn2:scale-110 transition-transform"></i> Contact & Resolve Intake
                </button>
            </div>
        `;
        nurseContainer.appendChild(card);
    });
}

// --- Fetching Logic from Backend --- //
async function fetchPatients() {
    try {
        const response = await fetch('/api/queue');
        const data = await response.json();

        if (data.error) {
            console.error("Backend Error:", data.error);
            validatedQueue = [];
            nurseQueue = [];
        } else {
            validatedQueue = data.validated || [];
            nurseQueue = data.nurse || [];
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        validatedQueue = [];
        nurseQueue = [];
    }
}

async function initData() {
    validatedContainer.innerHTML = '<div class="text-center text-slate-500 py-10">Fetching live data from Google Sheets...</div>';

    await fetchPatients();

    if (validatedQueue.length === 0 && nurseQueue.length === 0) {
        validatedContainer.innerHTML = '<div class="text-center text-slate-500 py-10">No patients found. Please check your Google Sheet ID and permissions.</div>';
    } else {
        renderQueues();
    }

    // Auto-refresh every 30 seconds
    setInterval(async () => {
        await fetchPatients();
        renderQueues();
    }, 30000);
}

// Modal logic
window.openBrief = function (url) {
    if (url && url !== '#') {
        document.getElementById('brief-doc-link').href = url;
    } else {
        document.getElementById('brief-doc-link').href = '#';
    }
    briefModal.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modal-content-container').classList.remove('scale-95');
    document.getElementById('modal-content-container').classList.add('scale-100');
}

closeModalBtn.addEventListener('click', () => {
    briefModal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('modal-content-container').classList.add('scale-95');
    document.getElementById('modal-content-container').classList.remove('scale-100');
});

// Init
initData();
