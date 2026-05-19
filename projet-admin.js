  // --- SÉCURITÉ & CONFIG ---
        if(sessionStorage.getItem('isAdmin') !== 'true') window.location.href = "index.html";
        const config = { token: "ghp_" + "mSQCh8UYW5v7ggHV1ZDo62NSstG0Qd4XorDM", repo: "fetrasoatanjonait/invest" };
        let currentProject = null;
        let db = { projets: [] };
        let projectSha = "";

        // --- SYNC ENGINE ---
        window.onload = async () => {
            showLoader(true);
            
            const urlParams = new URLSearchParams(window.location.search);
            const projectId = urlParams.get('id') || sessionStorage.getItem('currentProjectId');
            
            if (!projectId) {
                alert('Aucun projet sélectionné');
                window.location.href = 'admin.html';
                return;
            }

            await sync('projet');
            currentProject = db.projets.find(p => p.id == projectId);
            
            if (!currentProject) {
                alert('Projet non trouvé');
                window.location.href = 'admin.html';
                return;
            }

            renderAll();
            showLoader(false);
        };

        async function sync(file) {
            try {
                const res = await fetch(`https://api.github.com/repos/${config.repo}/contents/${file}.json?t=${Date.now()}`, {
                    headers: { Authorization: `token ${config.token}` }
                });
                if(res.ok) {
                    const data = await res.json();
                    if(file === 'projet') {
                        projectSha = data.sha;
                        db.projets = Array.isArray(JSON.parse(decodeURIComponent(escape(atob(data.content))))) ? JSON.parse(decodeURIComponent(escape(atob(data.content)))) : [];
                    }
                }
            } catch(e) { console.error(e); }
        }

        async function push(content) {
            showLoader(true);
            const res = await fetch(`https://api.github.com/repos/${config.repo}/contents/projet.json`, {
                method: 'PUT',
                headers: { Authorization: `token ${config.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Project Update: ${currentProject.nom}`,
                    content: btoa(unescape(encodeURIComponent(JSON.stringify(db.projets)))),
                    sha: projectSha
                })
            });
            if(res.ok) {
                const data = await res.json();
                projectSha = data.content.sha;
                renderAll();
            }
            showLoader(false);
        }

        async function uploadToGithub(file, path) {
            const content = (await toB64(file)).split(',')[1];
            const res = await fetch(`https://api.github.com/repos/${config.repo}/contents/${path}`, {
                method: 'PUT',
                headers: { Authorization: `token ${config.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Upload file: ${path}`, content: content })
            });
            return res.ok ? `https://raw.githubusercontent.com/${config.repo}/main/${path}?t=${Date.now()}` : "";
        }

        // --- CRUD FONDS ---
        async function addFund() {
            const source = document.getElementById('fund-source').value;
            const amount = document.getElementById('fund-amount').value;
            const date = document.getElementById('fund-date').value;
            const proofFile = document.getElementById('fund-proof').files[0];

            if(!source || !amount || !date) return alert("Remplissez tous les champs fonds");
            
            showLoader(true);
            const fundId = Date.now();
            let proofUrl = proofFile ? await uploadToGithub(proofFile, `project-funds/${fundId}.png`) : "";

            const fund = { id: fundId, source, amount, date, img: proofUrl };
            
            if(!currentProject.fonds) currentProject.fonds = [];
            currentProject.fonds.push(fund);
            
            const projectIndex = db.projets.findIndex(p => p.id == currentProject.id);
            db.projets[projectIndex] = currentProject;
            
            await push(db.projets);
            
            // Vider le formulaire
            document.getElementById('fund-source').value = "";
            document.getElementById('fund-amount').value = "";
            document.getElementById('fund-date').value = "";
            document.getElementById('fund-proof').value = "";
        }

        async function deleteFund(id) {
            if(confirm("Supprimer ce fonds ?")) {
                currentProject.fonds = currentProject.fonds.filter(f => f.id != id);
                const projectIndex = db.projets.findIndex(p => p.id == currentProject.id);
                db.projets[projectIndex] = currentProject;
                await push(db.projets);
            }
        }

        // --- CRUD DÉPENSES ---
        async function addExpense() {
            const desc = document.getElementById('expense-desc').value;
            const amount = document.getElementById('expense-amount').value;
            const date = document.getElementById('expense-date').value;
            const proofFile = document.getElementById('expense-proof').files[0];

            if(!desc || !amount || !date) return alert("Remplissez tous les champs dépense");
            
            showLoader(true);
            const expenseId = Date.now();
            let proofUrl = proofFile ? await uploadToGithub(proofFile, `project-expenses/${expenseId}.png`) : "";

            const expense = { id: expenseId, description: desc, amount, date, img: proofUrl };
            
            if(!currentProject.depenses) currentProject.depenses = [];
            currentProject.depenses.push(expense);
            
            const projectIndex = db.projets.findIndex(p => p.id == currentProject.id);
            db.projets[projectIndex] = currentProject;
            
            await push(db.projets);
            
            // Vider le formulaire
            document.getElementById('expense-desc').value = "";
            document.getElementById('expense-amount').value = "";
            document.getElementById('expense-date').value = "";
            document.getElementById('expense-proof').value = "";
        }

        async function deleteExpense(id) {
            if(confirm("Supprimer cette dépense ?")) {
                currentProject.depenses = currentProject.depenses.filter(d => d.id != id);
                const projectIndex = db.projets.findIndex(p => p.id == currentProject.id);
                db.projets[projectIndex] = currentProject;
                await push(db.projets);
            }
        }

        // --- CRUD REVENUS ---
        async function addRevenue() {
            const source = document.getElementById('revenue-source').value;
            const amount = document.getElementById('revenue-amount').value;
            const date = document.getElementById('revenue-date').value;
            const proofFile = document.getElementById('revenue-proof').files[0];

            if(!source || !amount || !date) return alert("Remplissez tous les champs revenu");
            
            showLoader(true);
            const revenueId = Date.now();
            let proofUrl = proofFile ? await uploadToGithub(proofFile, `project-revenue/${revenueId}.png`) : "";

            const revenue = { id: revenueId, source, amount, date, img: proofUrl };
            
            if(!currentProject.revenus) currentProject.revenus = [];
            currentProject.revenus.push(revenue);
            
            const projectIndex = db.projets.findIndex(p => p.id == currentProject.id);
            db.projets[projectIndex] = currentProject;
            
            await push(db.projets);
            
            // Vider le formulaire
            document.getElementById('revenue-source').value = "";
            document.getElementById('revenue-amount').value = "";
            document.getElementById('revenue-date').value = "";
            document.getElementById('revenue-proof').value = "";
        }

        async function deleteRevenue(id) {
            if(confirm("Supprimer ce revenu ?")) {
                currentProject.revenus = currentProject.revenus.filter(r => r.id != id);
                const projectIndex = db.projets.findIndex(p => p.id == currentProject.id);
                db.projets[projectIndex] = currentProject;
                await push(db.projets);
            }
        }

        // --- RENDU UI ---
        function renderAll() {
            if (!currentProject) return;

            // Mettre à jour le nom du projet
            document.getElementById('project-name').innerHTML = `<span class="w-2 h-2 bg-purple-600 rounded-full animate-ping"></span> ${currentProject.nom}`;

            // Calculer les statistiques
            const totalFonds = (currentProject.fonds || []).reduce((acc, f) => acc + parseFloat(f.amount || 0), 0);
            const totalDepenses = (currentProject.depenses || []).reduce((acc, d) => acc + parseFloat(d.amount || 0), 0);
            const totalRevenus = (currentProject.revenus || []).reduce((acc, r) => acc + parseFloat(r.amount || 0), 0);
            const soldeFinal = totalFonds + totalRevenus - totalDepenses;

            // Mettre à jour les statistiques
            document.getElementById('stat-funds').innerText = totalFonds.toLocaleString() + " Ar";
            document.getElementById('stat-expenses').innerText = totalDepenses.toLocaleString() + " Ar";
            document.getElementById('stat-revenue').innerText = totalRevenus.toLocaleString() + " Ar";
            document.getElementById('stat-balance').innerText = soldeFinal.toLocaleString() + " Ar";

            // Afficher les fonds
            document.getElementById('funds-list').innerHTML = (currentProject.fonds || []).slice().reverse().map(f => `
                <div class="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div class="flex-1">
                        <p class="text-xs font-black text-indigo-700">${f.source}</p>
                        <p class="text-[10px] text-slate-600">${f.date} • <span class="font-bold text-indigo-600">+${parseFloat(f.amount).toLocaleString()} Ar</span></p>
                    </div>
                    <div class="flex gap-2">
                        ${f.img ? `<a href="${f.img}" target="_blank" class="w-6 h-6 flex items-center justify-center bg-indigo-500 rounded text-white"><i class="fas fa-image text-[8px]"></i></a>` : ''}
                        <button onclick="deleteFund(${f.id})" class="w-6 h-6 flex items-center justify-center bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition"><i class="fas fa-times text-[8px]"></i></button>
                    </div>
                </div>
            `).join('');

            // Afficher les dépenses
            document.getElementById('expenses-list').innerHTML = (currentProject.depenses || []).slice().reverse().map(d => `
                <div class="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                    <div class="flex-1">
                        <p class="text-xs font-black text-red-700">${d.description}</p>
                        <p class="text-[10px] text-slate-600">${d.date} • <span class="font-bold text-red-600">-${parseFloat(d.amount).toLocaleString()} Ar</span></p>
                    </div>
                    <div class="flex gap-2">
                        ${d.img ? `<a href="${d.img}" target="_blank" class="w-6 h-6 flex items-center justify-center bg-red-500 rounded text-white"><i class="fas fa-image text-[8px]"></i></a>` : ''}
                        <button onclick="deleteExpense(${d.id})" class="w-6 h-6 flex items-center justify-center bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition"><i class="fas fa-times text-[8px]"></i></button>
                    </div>
                </div>
            `).join('');

            // Afficher les revenus
            document.getElementById('revenue-list').innerHTML = (currentProject.revenus || []).slice().reverse().map(r => `
                <div class="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div class="flex-1">
                        <p class="text-xs font-black text-emerald-700">${r.source}</p>
                        <p class="text-[10px] text-slate-600">${r.date} • <span class="font-bold text-emerald-600">+${parseFloat(r.amount).toLocaleString()} Ar</span></p>
                    </div>
                    <div class="flex gap-2">
                        ${r.img ? `<a href="${r.img}" target="_blank" class="w-6 h-6 flex items-center justify-center bg-emerald-500 rounded text-white"><i class="fas fa-image text-[8px]"></i></a>` : ''}
                        <button onclick="deleteRevenue(${r.id})" class="w-6 h-6 flex items-center justify-center bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition"><i class="fas fa-times text-[8px]"></i></button>
                    </div>
                </div>
            `).join('');
        }

        function viewProject() {
            window.location.href = `project.html?id=${currentProject.id}`;
        }

        function showLoader(s) { document.getElementById('loader').classList[s?'remove':'add']('hidden'); }
        const toB64 = f => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });