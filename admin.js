    // --- SÉCURITÉ & CONFIG ---
        if(sessionStorage.getItem('isAdmin') !== 'true') window.location.href = "index.html";
        const config = { token: "ghp_" + "mSQCh8UYW5v7ggHV1ZDo62NSstG0Qd4XorDM", repo: "fetrasoatanjonait/invest" };
        let db = { membres: [], status: "", cotisations: [], depenses: [], projets: [] };
        let shas = { status: "", membres: "", cotisation: "", depense: "", projet: "" };

        // --- SYNC ENGINE ---
        window.onload = async () => {
            showLoader(true);
            await Promise.all([sync('membres'), sync('status'), sync('cotisation'), sync('depense'), sync('projet')]);
            document.getElementById('status-field').value = db.status;
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
                    shas[file] = data.sha;
                    const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
                    if(file === 'cotisation') db.cotisations = Array.isArray(content) ? content : [];
                    else if(file === 'membres') db.membres = Array.isArray(content) ? content : [];
                    else if(file === 'depense') db.depenses = Array.isArray(content) ? content : [];
                    else if(file === 'projet') db.projets = Array.isArray(content) ? content : [];
                    else db[file] = content;
                }
            } catch(e) { console.error(e); }
        }

        async function push(file, content) {
            showLoader(true);
            const res = await fetch(`https://api.github.com/repos/${config.repo}/contents/${file}.json`, {
                method: 'PUT',
                headers: { Authorization: `token ${config.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Admin Sync: ${file}`,
                    content: btoa(unescape(encodeURIComponent(JSON.stringify(content)))),
                    sha: shas[file]
                })
            });
            if(res.ok) {
                const data = await res.json();
                shas[file] = data.content.sha;
                renderAll();
            }
            showLoader(false);
        }

        async function uploadToGithub(file, path) {
            const content = (await toB64(file)).split(',')[1];
            const res = await fetch(`https://api.github.com/repos/${config.repo}/contents/${path}`, {
                method: 'PUT',
                headers: { Authorization: `token ${config.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Upload image: ${path}`, content: content })
            });
            return res.ok ? `https://raw.githubusercontent.com/${config.repo}/main/${path}?t=${Date.now()}` : "";
        }

        // --- CRUD MEMBRES ---
        async function addMember() {
            const nom = document.getElementById('m-nom').value;
            const prenom = document.getElementById('m-prenom').value;
            const photoFile = document.getElementById('m-photo').files[0];
            const mid = Date.now();

            if(!nom || !prenom) return alert("Nom et Prénom requis");
            showLoader(true);
            let photoUrl = photoFile ? await uploadToGithub(photoFile, `photos/${mid}.png`) : "";

            const member = {
                id: mid,
                nom, prenom, 
                age: document.getElementById('m-age').value,
                tel: document.getElementById('m-tel').value,
                adr: document.getElementById('m-adr').value,
                spec: document.getElementById('m-spec').value,
                photo: photoUrl,
                status: "Actif"
            };

            db.membres.push(member);
            await push('membres', db.membres);
            document.querySelectorAll('.admin-card input').forEach(i => i.value = "");
        }

        function openEditModal(id) {
            const m = db.membres.find(x => x.id == id);
            if(!m) return;
            document.getElementById('edit-id').value = m.id;
            document.getElementById('edit-nom').value = m.nom;
            document.getElementById('edit-prenom').value = m.prenom;
            document.getElementById('edit-age').value = m.age || "";
            document.getElementById('edit-tel').value = m.tel || "";
            document.getElementById('edit-spec').value = m.spec || "";
            document.getElementById('edit-adr').value = m.adr || "";
            document.getElementById('edit-status').value = m.status || "Actif";
            document.getElementById('edit-modal').classList.remove('hidden');
        }

        function closeModal() { document.getElementById('edit-modal').classList.add('hidden'); }

        async function updateMember() {
            const id = document.getElementById('edit-id').value;
            const idx = db.membres.findIndex(x => x.id == id);
            if(idx > -1) {
                db.membres[idx] = {
                    ...db.membres[idx],
                    nom: document.getElementById('edit-nom').value,
                    prenom: document.getElementById('edit-prenom').value,
                    age: document.getElementById('edit-age').value,
                    tel: document.getElementById('edit-tel').value,
                    spec: document.getElementById('edit-spec').value,
                    adr: document.getElementById('edit-adr').value,
                    status: document.getElementById('edit-status').value
                };
                closeModal();
                await push('membres', db.membres);
            }
        }

        async function deleteMember(id) {
            if(confirm("Supprimer ce membre définitivement ?")) {
                db.membres = db.membres.filter(x => x.id !== id);
                await push('membres', db.membres);
            }
        }

        // --- CRUD COTISATIONS ---
        async function addPay() {
            const mid = document.getElementById('pay-mid').value;
            const amt = document.getElementById('pay-amt').value;
            const date = document.getElementById('pay-date').value;
            const factFile = document.getElementById('pay-fact').files[0];

            if(!mid || !amt || !date) return alert("Remplissez tous les champs paiement");
            
            showLoader(true);
            const pid = Date.now();
            let factUrl = factFile ? await uploadToGithub(factFile, `recus/${pid}.png`) : "";

            const pay = { id: pid, mid, amount: amt, date, img: factUrl };
            db.cotisations.push(pay);
            await push('cotisation', db.cotisations);
            document.getElementById('pay-amt').value = "";
        }

        async function deletePay(id) {
            if(confirm("Supprimer cette transaction ?")) {
                db.cotisations = db.cotisations.filter(p => p.id != id);
                await push('cotisation', db.cotisations);
            }
        }

        // --- CRUD DÉPENSES ---
        async function addExpense() {
            const desc = document.getElementById('exp-desc').value;
            const amt = document.getElementById('exp-amt').value;
            const date = document.getElementById('exp-date').value;
            const factFile = document.getElementById('exp-fact').files[0];

            if(!desc || !amt || !date) return alert("Remplissez tous les champs dépense");
            
            showLoader(true);
            const eid = Date.now();
            let factUrl = factFile ? await uploadToGithub(factFile, `factures/${eid}.png`) : "";

            const expense = { id: eid, description: desc, amount: amt, date, img: factUrl };
            db.depenses.push(expense);
            await push('depense', db.depenses);
            document.getElementById('exp-desc').value = "";
            document.getElementById('exp-amt').value = "";
        }

        async function deleteExpense(id) {
            if(confirm("Supprimer cette dépense ?")) {
                db.depenses = db.depenses.filter(d => d.id != id);
                await push('depense', db.depenses);
            }
        }

        // --- CRUD PROJETS ---
        async function addProject() {
            const nom = document.getElementById('proj-nom').value;
            const desc = document.getElementById('proj-desc').value;
            const dateDebut = document.getElementById('proj-date-debut').value;
            const dateFin = document.getElementById('proj-date-fin').value;
            const logoFile = document.getElementById('proj-logo').files[0];

            if(!nom || !desc || !dateDebut) return alert("Remplissez les champs obligatoires du projet");
            
            showLoader(true);
            const projId = Date.now();
            let logoUrl = logoFile ? await uploadToGithub(logoFile, `projets/logo_${projId}.png`) : "";

            const project = {
                id: projId,
                nom: nom,
                description: desc,
                dateDebut: dateDebut,
                dateFin: dateFin,
                logo: logoUrl,
                fonds: [],
                depenses: [],
                revenus: [],
                dateCreation: new Date().toISOString().split('T')[0]
            };

            db.projets.push(project);
            await push('projet', db.projets);
            document.getElementById('proj-nom').value = "";
            document.getElementById('proj-desc').value = "";
            document.getElementById('proj-date-debut').value = "";
            document.getElementById('proj-date-fin').value = "";
            document.getElementById('proj-logo').value = "";
        }

        async function deleteProject(id) {
            if(confirm("Supprimer ce projet et toutes ses données financières ?")) {
                db.projets = db.projets.filter(p => p.id != id);
                await push('projet', db.projets);
            }
        }

        function openProjectAdmin(id) {
            sessionStorage.setItem('currentProjectId', id);
            window.location.href = `project-admin.html?id=${id}`;
        }

        async function saveStatus() {
            db.status = document.getElementById('status-field').value;
            await push('status', db.status);
        }

        // --- RENDU UI ---
        function renderAll() {
            // Selecteur Paiement
            const sel = document.getElementById('pay-mid');
            sel.innerHTML = db.membres.map(m => `<option value="${m.id}">${m.nom} ${m.prenom}</option>`).join('');

            // Liste Membres
            document.getElementById('members-list').innerHTML = db.membres.map(m => `
                <div class="bg-slate-50 p-5 rounded-3xl flex items-center justify-between border border-slate-100 animate__animated animate__fadeIn">
                    <div class="flex items-center gap-4">
                        <img src="${m.photo || 'https://ui-avatars.com/api/?name='+m.nom}" class="w-12 h-12 rounded-2xl object-cover shadow-sm">
                        <div>
                            <p class="text-sm font-black text-slate-900">${m.nom} ${m.prenom}</p>
                            <p class="text-[10px] font-black text-indigo-500 uppercase">${m.status || 'Actif'}</p>
                        </div>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="openEditModal(${m.id})" class="w-9 h-9 flex items-center justify-center bg-white rounded-xl text-indigo-600 shadow-sm border border-slate-100 hover:bg-indigo-600 hover:text-white transition"><i class="fas fa-pen-nib text-xs"></i></button>
                        <button onclick="deleteMember(${m.id})" class="w-9 h-9 flex items-center justify-center bg-white rounded-xl text-red-500 shadow-sm border border-slate-100 hover:bg-red-500 hover:text-white transition"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </div>
            `).join('');

            // Liste Paiements
            document.getElementById('payments-list').innerHTML = db.cotisations.slice().reverse().map(p => {
                const mem = db.membres.find(m => m.id == p.mid);
                return `
                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xs">Ar</div>
                            <div>
                                <p class="text-[11px] font-black text-white">${mem ? mem.nom+' '+mem.prenom : 'Ancien Membre'}</p>
                                <p class="text-[10px] font-bold text-slate-500">${p.date} • <span class="text-emerald-400">${p.amount} Ar</span></p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            ${p.img ? `<a href="${p.img}" target="_blank" class="w-8 h-8 flex items-center justify-center bg-indigo-500 rounded-lg text-white"><i class="fas fa-image text-[10px]"></i></a>` : ''}
                            <button onclick="deletePay(${p.id})" class="w-8 h-8 flex items-center justify-center bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition"><i class="fas fa-times text-[10px]"></i></button>
                        </div>
                    </div>
                `;
            }).join('');

            // Liste Dépenses
            document.getElementById('expenses-list').innerHTML = db.depenses.slice().reverse().map(d => {
                return `
                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 font-black text-xs">Ar</div>
                            <div>
                                <p class="text-[11px] font-black text-white">${d.description}</p>
                                <p class="text-[10px] font-bold text-slate-500">${d.date} • <span class="text-red-400">-${d.amount} Ar</span></p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            ${d.img ? `<a href="${d.img}" target="_blank" class="w-8 h-8 flex items-center justify-center bg-red-500 rounded-lg text-white"><i class="fas fa-image text-[10px]"></i></a>` : ''}
                            <button onclick="deleteExpense(${d.id})" class="w-8 h-8 flex items-center justify-center bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition"><i class="fas fa-times text-[10px]"></i></button>
                        </div>
                    </div>
                `;
            }).join('');

            // Liste Projets
            document.getElementById('projects-list').innerHTML = db.projets.slice().reverse().map(p => {
                const totalFonds = (p.fonds || []).reduce((acc, f) => acc + parseFloat(f.amount || 0), 0);
                const totalDepenses = (p.depenses || []).reduce((acc, d) => acc + parseFloat(d.amount || 0), 0);
                const totalRevenus = (p.revenus || []).reduce((acc, r) => acc + parseFloat(r.amount || 0), 0);
                const solde = totalFonds + totalRevenus - totalDepenses;
                
                return `
                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 font-black text-xs">P</div>
                            <div>
                                <p class="text-[11px] font-black text-white">${p.nom}</p>
                                <p class="text-[10px] font-bold text-slate-500">${p.dateDebut} • Solde: <span class="${solde >= 0 ? 'text-emerald-400' : 'text-red-400'}">${solde.toLocaleString()} Ar</span></p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="openProjectAdmin(${p.id})" class="w-8 h-8 flex items-center justify-center bg-purple-500 rounded-lg text-white" title="Gérer le projet"><i class="fas fa-cog text-[10px]"></i></button>
                            <button onclick="deleteProject(${p.id})" class="w-8 h-8 flex items-center justify-center bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition"><i class="fas fa-times text-[10px]"></i></button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function showLoader(s) { document.getElementById('loader').classList[s?'remove':'add']('hidden'); }
        const toB64 = f => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
    