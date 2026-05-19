  const config = { token: "ghp_"+"mSQCh8UYW5v7ggHV1ZDo62NSstG0Qd4XorDM", repo: "fetrasoatanjonait/invest" };
        let db = { membres: [], status: "", cotisations: [], depenses: [], projets: [] };

        window.onload = async () => {
            await Promise.all([sync('membres'), sync('status'), sync('cotisation'), sync('depense'), sync('projet')]);
            render();
        };

        async function sync(file) {
            try {
                const res = await fetch(`https://api.github.com/repos/${config.repo}/contents/${file}.json`, {
                    headers: { Authorization: `token ${config.token}` }
                });
                if(res.ok) {
                    const data = await res.json();
                    if(file === 'cotisation') db.cotisations = JSON.parse(decodeURIComponent(escape(atob(data.content))));
                    else if(file === 'depense') db.depenses = JSON.parse(decodeURIComponent(escape(atob(data.content))));
                    else if(file === 'projet') db.projets = JSON.parse(decodeURIComponent(escape(atob(data.content))));
                    else db[file] = JSON.parse(decodeURIComponent(escape(atob(data.content))));
                }
            } catch (e) { console.error("Erreur de synchro", e); }
        }

        function render() {
            const totalCotisations = (db.cotisations || []).reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);
            const totalDepenses = (db.depenses || []).reduce((acc, d) => acc + parseFloat(d.amount || 0), 0);
            const soldeFinal = totalCotisations - totalDepenses;
            
            document.getElementById('total-cash').innerText = totalCotisations.toLocaleString() + " Ar";
            document.getElementById('total-expenses').innerText = totalDepenses.toLocaleString() + " Ar";
            document.getElementById('final-balance').innerText = soldeFinal.toLocaleString() + " Ar";
            document.getElementById('member-count').innerText = db.membres.length;
            
            document.getElementById('statuts-content').innerText = db.status;

            document.getElementById('list-membres').innerHTML = db.membres.map(m => `
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center group transition-all hover:shadow-md hover:border-slate-200">
                    <div class="relative w-24 h-24 mx-auto mb-5">
                        <img src="${m.photo || 'https://via.placeholder.com/150'}" onclick="zoom('${m.photo}')" 
                             class="w-full h-full rounded-full object-cover cursor-zoom-in border-4 border-slate-50 shadow-inner transition-transform group-hover:scale-105">
                        <div class="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                    </div>
                    <h4 class="font-extrabold text-lg text-slate-950">${m.nom} ${m.prenom}</h4>
                    <p class="text-[11px] font-black text-indigo-600 uppercase mt-1 mb-4 tracking-wider">${m.spec}</p>
                    
                    <div class="pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600">
                        <div class="flex items-center justify-center gap-2">
                            <i class="fas fa-phone text-indigo-300 text-xs w-4"></i>
                            <span>${m.tel}</span>
                        </div>
                        <div class="flex items-center justify-center gap-2">
                            <i class="fas fa-map-marker-alt text-indigo-300 text-xs w-4"></i>
                            <span class="truncate">${m.adr}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            document.getElementById('list-pay').innerHTML = db.cotisations.map(p => {
                const m = db.membres.find(x => x.id == p.mid);
                return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="font-bold text-slate-900">${m ? m.nom + ' ' + m.prenom : 'Membre inconnu'}</div>
                    </td>
                    <td class="px-6 py-4 text-slate-500 font-medium text-sm">
                        ${p.date}
                    </td>
                    <td class="px-6 py-4">
                        <span class="font-extrabold text-emerald-600 text-sm">
                            + ${parseFloat(p.amount).toLocaleString()} Ar
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        ${p.img ? `
                            <button onclick="zoom('${p.img}')" class="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-wider hover:text-indigo-800">
                                <i class="fas fa-receipt"></i> Voir
                            </button>` : '<span class="text-slate-300">---</span>'}
                    </td>
                </tr>`;
            }).join('');

            document.getElementById('list-expenses').innerHTML = (db.depenses || []).map(d => {
                return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="font-bold text-slate-900">${d.description}</div>
                    </td>
                    <td class="px-6 py-4 text-slate-500 font-medium text-sm">
                        ${d.date}
                    </td>
                    <td class="px-6 py-4">
                        <span class="font-extrabold text-red-600 text-sm">
                            - ${parseFloat(d.amount).toLocaleString()} Ar
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        ${d.img ? `
                            <button onclick="zoom('${d.img}')" class="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-wider hover:text-indigo-800">
                                <i class="fas fa-receipt"></i> Voir
                            </button>` : '<span class="text-slate-300">---</span>'}
                    </td>
                </tr>`;
            }).join('');

            // Affichage des projets
            document.getElementById('list-projects').innerHTML = (db.projets || []).map(p => {
                const totalFonds = (p.fonds || []).reduce((acc, f) => acc + parseFloat(f.amount || 0), 0);
                const totalDepenses = (p.depenses || []).reduce((acc, d) => acc + parseFloat(d.amount || 0), 0);
                const totalRevenus = (p.revenus || []).reduce((acc, r) => acc + parseFloat(r.amount || 0), 0);
                const solde = totalFonds + totalRevenus - totalDepenses;
                
                return `
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group transition-all hover:shadow-md hover:border-slate-200 cursor-pointer" onclick="openProject(${p.id})">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center overflow-hidden">
                            ${p.logo ? `<img src="${p.logo}" class="w-full h-full object-cover">` : `<span class="text-white font-black text-lg">${p.nom ? p.nom.charAt(0).toUpperCase() : 'P'}</span>`}
                        </div>
                        <span class="text-xs font-bold px-3 py-1 rounded-full ${solde >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                            ${solde >= 0 ? 'Actif' : 'Déficit'}
                        </span>
                    </div>
                    <h4 class="font-extrabold text-lg text-slate-950 mb-2">${p.nom || 'Projet sans nom'}</h4>
                    <p class="text-sm text-slate-600 mb-4 line-clamp-2">${p.description || 'Aucune description'}</p>
                    
                    <div class="space-y-2">
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-slate-500">Fonds:</span>
                            <span class="font-bold text-indigo-600">${totalFonds.toLocaleString()} Ar</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-slate-500">Dépenses:</span>
                            <span class="font-bold text-red-600">${totalDepenses.toLocaleString()} Ar</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-slate-500">Revenus:</span>
                            <span class="font-bold text-emerald-600">${totalRevenus.toLocaleString()} Ar</span>
                        </div>
                        <div class="pt-2 mt-2 border-t border-slate-100">
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-bold text-slate-400 uppercase">Solde:</span>
                                <span class="font-extrabold text-lg ${solde >= 0 ? 'text-emerald-600' : 'text-red-600'}">
                                    ${solde.toLocaleString()} Ar
                                </span>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        // Mapping des titres de page
        const titles = { 'membres': 'Annuaire des Membres', 'statuts': 'Statuts de l\'Association', 'history': 'Historique des Versements', 'expenses': 'Historique des Dépenses', 'projects': 'Projets en Cours' };

        function tab(id) {
            // Update Title
            document.getElementById('page-title').innerText = titles[id];

            // Update Buttons (Sidebar)
            document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
            document.getElementById('b-' + id).classList.add('active');

            // Update Sections
            document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
            document.getElementById('p-'+id).classList.remove('hidden');
        }

        function zoom(s) { if(s) { document.getElementById('z-img').src=s; document.getElementById('zoom').classList.remove('hidden'); } }
        
        function openProject(projectId) {
            // Stocker l'ID du projet et rediriger vers la page du projet
            sessionStorage.setItem('currentProjectId', projectId);
            window.location.href = `project.html?id=${projectId}`;
        }

        function loginRedirect() {
            const user = prompt("Identifiant :");
            const pass = prompt("Mot de passe :");
            if(user === "admin" && pass === "investpro") {
                sessionStorage.setItem('isAdmin', 'true');
                window.location.href = "admin.html";
            } else if(user !== null) { alert("Accès refusé"); }
        }

        // Fonctions pour le menu mobile
        function toggleSidebar(open) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (open === undefined) open = !sidebar.classList.contains('open');
            
            if (open) {
                sidebar.classList.add('open');
                overlay.classList.remove('hidden');
                setTimeout(() => { overlay.classList.add('opacity-100'); overlay.classList.remove('opacity-0'); }, 10);
            } else {
                sidebar.classList.remove('open');
                overlay.classList.add('opacity-0');
                overlay.classList.remove('opacity-100');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
        }