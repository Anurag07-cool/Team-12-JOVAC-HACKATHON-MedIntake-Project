const statusForm = document.getElementById('status-form');
const statusWidget = document.getElementById('status-widget'); 

statusForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailInput = document.querySelector('input[type="email"]').value.toLowerCase().trim();
    // Use an input[type="text"] or type="date"
    const inputs = statusForm.querySelectorAll('input');
    const email = inputs[0].value.toLowerCase().trim();
    
    try {
        const response = await fetch('/api/queue');
        const data = await response.json();
        
        let foundStatus = 'processing'; // Default to processing if submitted but not in sheet yet
        let patientName = 'Valued Patient';
        
        // Check validated queue first
        const validatedMatch = data.validated.find(p => p.email === email);
        if (validatedMatch) {
            foundStatus = 'ready';
            patientName = validatedMatch.name;
        } else {
            // Check nurse queue
            const nurseMatch = data.nurse.find(p => p.email === email);
            if (nurseMatch) {
                foundStatus = 'hold';
                patientName = nurseMatch.name;
            }
        }
        
        renderStatusWidget(foundStatus, patientName);
    } catch (err) {
        console.error('Error fetching status:', err);
        renderStatusWidget('processing', 'Valued Patient'); // fallback
    }
});

function renderStatusWidget(state, name) {
    statusWidget.classList.remove('hidden');
    statusWidget.innerHTML = '';
    
    let config = {
        processing: {
            color: 'blue',
            title: 'Processing Submission',
            desc: 'We have received your form and are preparing your chart.',
            icon: `<i data-lucide="loader-2" class="w-6 h-6 text-blue-500 animate-spin"></i>`
        },
        hold: {
            color: 'amber',
            title: 'Pending Nurse Review',
            desc: 'Your submission requires a quick manual review by our clinical team.',
            icon: `<i data-lucide="alert-circle" class="w-6 h-6 text-amber-500"></i>`
        },
        ready: {
            color: 'emerald',
            title: 'Confirmed & Ready',
            desc: 'Your doctor has reviewed your preliminary chart and is ready to see you.',
            icon: `<i data-lucide="check-circle-2" class="w-6 h-6 text-emerald-500"></i>`
        }
    };
    
    const cfg = config[state] || config['processing'];
    
    statusWidget.innerHTML = `
        <div class="flex items-start gap-4 p-5 rounded-[16px] bg-${cfg.color}-50/30 border border-${cfg.color}-100 premium-shadow">
            <div class="mt-0.5 bg-white p-2 rounded-[12px] shadow-sm border border-${cfg.color}-100">
                ${cfg.icon}
            </div>
            <div>
                <h4 class="font-bold text-slate-900 tracking-tight text-lg">${cfg.title}</h4>
                <p class="text-sm text-slate-500 font-medium mt-1">${cfg.desc}</p>
            </div>
        </div>
        
        <div class="mt-4 p-5 bg-white rounded-[16px] border border-slate-200/60 premium-shadow relative overflow-hidden group hover:border-slate-300 transition-colors">
            <div class="absolute top-0 left-0 w-1 h-full bg-${cfg.color}-500 transition-colors"></div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient Match</p>
            <h5 class="text-lg font-bold text-slate-800">${name}</h5>
        </div>
    `;
    
    // Re-initialize Lucide icons for the newly injected HTML
    if (window.lucide) {
        window.lucide.createIcons();
    }
}
